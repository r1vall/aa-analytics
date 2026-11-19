/* Anime Adventures Analytics — no framework, no backend secrets in the browser. */
(() => {
  'use strict';
  const config = window.DASHBOARD_CONFIG || {};
  const tz = config.timezone || 'Europe/Kyiv';
  const isDemo = new URLSearchParams(location.search).get('demo') === '1';
  const fmt = new Intl.NumberFormat('en-US');
  const state = { payload: null, period: '7d', metric: 'pearls', map: '', difficulty: '', start: '', end: '', query: '', sort: 'date', visible: 10, loading: false };
  const metricNames = { pearls: 'Summer Pearls', xp: 'XP', kills: 'Kills', damage: 'Damage' };
  const $ = id => document.getElementById(id);
  const num = value => fmt.format(Math.round(Number(value) || 0));
  const safe = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const val = (obj, key) => typeof obj?.[key] === 'number' && Number.isFinite(obj[key]) ? obj[key] : null;
  const sum = (rows, key) => rows.reduce((total, row) => total + (val(row, key) ?? 0), 0);
  const secs = rows => rows.reduce((total, row) => total + Math.max(0, val(row, 'duration_seconds') ?? 0), 0);
  const formatShort = n => {
    if (n === null || n === undefined || !Number.isFinite(n)) return '—';
    const a = Math.abs(n);
    if (a < 10000) return num(n);
    for (const [div, suffix] of [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]) {
      if (a >= div) return `${(n / div).toFixed(a / div >= 100 ? 0 : a / div >= 10 ? 1 : 2).replace(/\.0+$/, '')}${suffix}`;
    }
    return num(n);
  };
  const duration = total => {
    if (total === null || total === undefined || !Number.isFinite(total)) return '—';
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = Math.floor(total % 60);
    return h ? `${h}h ${String(m).padStart(2, '0')}m` : m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
  };
  const hourRate = (rows, key) => {
    const usable = rows.filter(row => (val(row, 'duration_seconds') ?? 0) > 0 && val(row, key) !== null);
    const hours = secs(usable) / 3600;
    return hours ? sum(usable, key) / hours : null;
  };
  const formatDate = (stamp, format = 'short') => {
    if (!stamp) return '—';
    const d = new Date(stamp);
    if (!Number.isFinite(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, year: 'numeric', month: 'short', day: '2-digit',
      ...(format === 'short' ? { hour: '2-digit', minute: '2-digit' } : {})
    }).format(d);
  };
  const localDate = date => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const read = type => parts.find(item => item.type === type)?.value || '';
    return `${read('year')}-${read('month')}-${read('day')}`;
  };
  const localHour = date => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(date);
  const cleanRows = payload => Array.isArray(payload?.matches) ? payload.matches.filter(m => m && !Number.isNaN(Date.parse(m.timestamp))) : [];
  const matchesAll = () => cleanRows(state.payload);

  function getRange() {
    const now = Date.now();
    if (state.period === '24h') return { start: now - 864e5, end: now, name: 'Last 24 hours' };
    if (state.period === '7d') return { start: now - 7 * 864e5, end: now, name: 'Last 7 days' };
    if (state.period === '30d') return { start: now - 30 * 864e5, end: now, name: 'Last 30 days' };
    if (state.period === 'custom') return { start: null, end: null, name: 'Custom date range' };
    return { start: null, end: null, name: 'All available data' };
  }
  function appliesDimensions(m) {
    return (!state.map || m.map === state.map) && (!state.difficulty || m.difficulty === state.difficulty);
  }
  function filteredRows() {
    const range = getRange();
    return matchesAll().filter(m => {
      const t = Date.parse(m.timestamp);
      return appliesDimensions(m)
        && (range.start === null || t >= range.start)
        && (range.end === null || t <= range.end)
        && (!state.start || localDate(new Date(t)) >= state.start)
        && (!state.end || localDate(new Date(t)) <= state.end);
    }).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  }
  function priorRows() {
    const range = getRange();
    if (range.start === null || range.end === null || state.start || state.end) return null;
    const size = range.end - range.start;
    return matchesAll().filter(m => {
      const t = Date.parse(m.timestamp);
      return appliesDimensions(m) && t >= range.start - size && t < range.start;
    });
  }
  function changePct(now, before) {
    if (before === null || before === undefined) return null;
    if (before === 0) return now === 0 ? 0 : null;
    return (now - before) / Math.abs(before) * 100;
  }
  function renderDelta(now, before, unit = 'vs previous period') {
    const pct = changePct(now, before);
    if (pct === null) return '<span>Period comparison unavailable</span>';
    const sign = pct > 0.05 ? 'positive' : pct < -0.05 ? 'negative' : 'neutral';
    const arrow = pct > 0.05 ? '↗' : pct < -0.05 ? '↘' : '—';
    return `<span class="delta ${sign}">${arrow} ${Math.abs(pct).toFixed(1)}%</span><span>${safe(unit)}</span>`;
  }
  function setOptions() {
    for (const [id, key, allLabel] of [['mapFilter', 'map', 'All maps'], ['difficultyFilter', 'difficulty', 'All levels']]) {
      const values = [...new Set(matchesAll().map(m => m[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
      const el = $(id);
      const previous = el.value;
      el.innerHTML = `<option value="">${allLabel}</option>` + values.map(v => `<option value="${safe(v)}">${safe(v)}</option>`).join('');
      el.value = values.includes(previous) ? previous : '';
      state[key] = el.value;
    }
  }
  function kpiCard(label, value, bottom, glyph = '↗', index = 0) {
    return `<article class="kpi-card" style="animation-delay:${index * 30}ms"><div class="kpi-top"><span class="kpi-label">${safe(label)}</span><span class="kpi-icon" aria-hidden="true">${glyph}</span></div><strong class="kpi-value" title="${safe(String(value))}">${safe(value)}</strong><div class="kpi-bottom">${bottom}</div></article>`;
  }
  function renderKpis(rows) {
    const previous = priorRows();
    const currentHours = secs(rows);
    const matchesWithDur = rows.filter(m => (val(m, 'duration_seconds') ?? 0) > 0);
    const totalPearls = sum(rows, 'pearls');
    const xps = sum(rows, 'xp');
    const kills = sum(rows, 'kills');
    const damages = sum(rows, 'damage');
    const success = rows.filter(m => m.result === 'Victory').length;
    const known = rows.filter(m => m.result === 'Victory' || m.result === 'Defeat').length;
    const winRate = known ? success / known * 100 : null;
    const columns = [
      kpiCard('Summer Pearls earned', num(totalPearls), renderDelta(totalPearls, previous && sum(previous, 'pearls')), '◈', 0),
      kpiCard('Time played', currentHours ? duration(currentHours) : '—', previous ? renderDelta(currentHours, secs(previous)) : '<span>Recorded match time only</span>', '◷', 1),
      kpiCard('Pearls / hour', hourRate(rows, 'pearls') === null ? '—' : num(hourRate(rows, 'pearls')), previous ? renderDelta(hourRate(rows, 'pearls') || 0, hourRate(previous, 'pearls')) : '<span>Match-time efficiency</span>', '↗', 2),
      kpiCard('Matches played', num(rows.length), previous ? renderDelta(rows.length, previous.length) : '<span>Total runs in selection</span>', '▤', 3),
      kpiCard('XP earned', num(xps), previous ? renderDelta(xps, sum(previous, 'xp')) : '<span>From reward records</span>', '+', 4),
      kpiCard('Total kills', num(kills), previous ? renderDelta(kills, sum(previous, 'kills')) : '<span>Recorded match kills</span>', '◎', 5),
      kpiCard('Total damage', formatShort(damages), previous ? renderDelta(damages, sum(previous, 'damage')) : `<span title="${num(damages)}">${safe(num(damages))} exact</span>`, '◇', 6),
      kpiCard('Win rate', winRate === null ? '—' : `${winRate.toFixed(1)}%`, previous ? renderDelta(winRate || 0, (() => { const p = previous.filter(m => m.result === 'Victory' || m.result === 'Defeat'); return p.length ? p.filter(m => m.result === 'Victory').length / p.length * 100 : null; })(), 'vs previous period') : '<span>Matches with known results</span>', '✓', 7)
    ];
    $('kpiGrid').innerHTML = columns.join('');
    $('kpiScope').textContent = `${getRange().name} · ${num(rows.length)} sessions`;
    $('efficiencyPearls').textContent = hourRate(rows, 'pearls') === null ? '—' : num(hourRate(rows, 'pearls'));
    $('efficiencyContext').textContent = `${num(matchesWithDur.length)} matches with known durations`;
    const metrics = [
      ['XP per hour', hourRate(rows, 'xp')],
      ['Kills per hour', hourRate(rows, 'kills')],
      ['Damage per hour', hourRate(rows, 'damage')],
      ['Average match length', matchesWithDur.length ? secs(matchesWithDur) / matchesWithDur.length : null],
      ['Winning sessions', known ? `${num(success)} / ${num(known)}` : '—'],
    ];
    $('efficiencyRows').innerHTML = metrics.map(([label, value]) => `<div class="eff-row"><span>${safe(label)}</span><strong title="${typeof value === 'number' ? safe(num(value)) : ''}">${typeof value === 'number' ? (label === 'Average match length' ? duration(value) : formatShort(value)) : safe(value ?? '—')}</strong></div>`).join('');
  }

  function bucketKey(row, kind) {
    const date = new Date(row.timestamp);
    const day = localDate(date);
    return kind === 'hour' ? `${day} ${localHour(date)}:00` : kind === 'month' ? day.slice(0, 7) : day;
  }
  function makeBuckets(rows) {
    const period = state.period;
    const ordered = [...rows].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    const span = ordered.length ? Date.parse(ordered[ordered.length - 1].timestamp) - Date.parse(ordered[0].timestamp) : 0;
    const kind = period === '24h' ? 'hour' : period === 'all' && span > 120 * 864e5 ? 'month' : 'day';
    const map = new Map();
    for (const row of ordered) {
      const key = bucketKey(row, kind);
      if (!map.has(key)) map.set(key, { key, pearls: 0, xp: 0, kills: 0, damage: 0, matches: 0 });
      const bucket = map.get(key);
      for (const name of Object.keys(metricNames)) bucket[name] += val(row, name) ?? 0;
      bucket.matches++;
    }
    if (period === '24h') {
      for (let i = 23; i >= 0; i--) {
        const date = new Date(Date.now() - i * 36e5);
        const key = `${localDate(date)} ${localHour(date)}:00`;
        if (!map.has(key)) map.set(key, { key, pearls: 0, xp: 0, kills: 0, damage: 0, matches: 0 });
      }
    } else if (period === '7d' || period === '30d') {
      const days = period === '7d' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 864e5);
        const key = localDate(date);
        if (!map.has(key)) map.set(key, { key, pearls: 0, xp: 0, kills: 0, damage: 0, matches: 0 });
      }
    }
    return { kind, buckets: [...map.values()].sort((a, b) => a.key.localeCompare(b.key)) };
  }
  function renderTrend(rows) {
    const metric = state.metric;
    const total = sum(rows, metric);
    $('trendTotal').textContent = metric === 'damage' ? formatShort(total) : num(total);
    $('trendTotal').title = num(total);
    $('trendTotalUnit').textContent = `${metricNames[metric]} in period`;
    const { kind, buckets } = makeBuckets(rows);
    $('chartAxisLabel').textContent = kind === 'hour' ? 'Hourly totals' : kind === 'month' ? 'Monthly totals' : 'Daily totals';
    const svg = $('trendChart').querySelector('svg');
    const W = 920, left = 51, right = 18, top = 15, bottom = 51, H = 305;
    const innerW = W - left - right, innerH = H - top - bottom;
    const maxValue = Math.max(1, ...buckets.map(b => b[metric]));
    const cap = maxValue * 1.13;
    const x = i => left + innerW * (buckets.length <= 1 ? .5 : i / (buckets.length - 1));
    const y = value => top + innerH * (1 - value / cap);
    const points = buckets.map((bucket, index) => [x(index), y(bucket[metric])]);
    const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point[0].toFixed(2)},${point[1].toFixed(2)}`).join(' ');
    const area = points.length ? `${path} L${points[points.length - 1][0]},${top + innerH} L${points[0][0]},${top + innerH} Z` : '';
    const grids = Array.from({ length: 5 }, (_, i) => {
      const yy = top + innerH * i / 4;
      const value = cap * (1 - i / 4);
      return `<line class="chart-grid-line" x1="${left}" y1="${yy}" x2="${W - right}" y2="${yy}"/><text class="chart-grid-label" x="${left - 9}" y="${yy + 4}" text-anchor="end">${safe(formatShort(value))}</text>`;
    }).join('');
    const tickCount = Math.min(6, buckets.length);
    const ticks = [];
    for (let i = 0; i < tickCount; i++) {
      const index = tickCount < 2 ? 0 : Math.round(i * (buckets.length - 1) / (tickCount - 1));
      if (!buckets[index]) continue;
      const label = buckets[index].key;
      const display = kind === 'month' ? label : kind === 'hour' ? label.slice(11) : label.slice(5).replace('-', '/');
      ticks.push(`<text class="chart-x-label" x="${x(index)}" y="${H - 15}" text-anchor="middle">${safe(display)}</text>`);
    }
    svg.innerHTML = grids + (points.length ? `<path class="chart-fill" d="${area}"/><path class="chart-path" d="${path}"/>` : '') + ticks.join('') + points.map((p, i) => {
      const startX = i === 0 ? 0 : (x(i - 1) + p[0]) / 2;
      const endX = i === buckets.length - 1 ? W : (p[0] + x(i + 1)) / 2;
      return `<rect class="chart-hotspot" data-bucket="${i}" x="${startX}" y="0" width="${endX - startX}" height="${H - bottom + 12}"></rect>`;
    }).join('');
    const tooltip = $('chartTooltip');
    tooltip.hidden = true;
    svg.querySelectorAll('[data-bucket]').forEach(rect => {
      const index = Number(rect.dataset.bucket);
      const bucket = buckets[index];
      rect.addEventListener('mouseenter', () => {
        tooltip.hidden = false;
        tooltip.innerHTML = `<span>${safe(bucket.key)}</span><strong>${num(bucket[metric])} ${safe(metricNames[metric])}</strong><span>${num(bucket.matches)} sessions</span>`;
        const box = $('trendChart').getBoundingClientRect();
        const px = points[index][0] / W * box.width;
        tooltip.style.left = `${Math.max(58, Math.min(box.width - 58, px))}px`;
        tooltip.style.top = `${Math.max(55, points[index][1] / H * box.height)}px`;
      });
      rect.addEventListener('mouseleave', () => { tooltip.hidden = true; });
    });
  }
  function renderMaps(rows) {
    const maps = new Map();
    for (const row of rows) {
      const name = row.map || 'Unknown map';
      if (!maps.has(name)) maps.set(name, { count: 0, pearls: 0 });
      const item = maps.get(name);
      item.count++;
      item.pearls += val(row, 'pearls') ?? 0;
    }
    const ordered = [...maps.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 5);
    $('mapsCount').textContent = `${maps.size} ${maps.size === 1 ? 'map' : 'maps'}`;
    const maxCount = Math.max(...ordered.map(item => item[1].count), 1);
    $('mapBreakdown').innerHTML = ordered.length ? ordered.map(([name, data]) => `<div class="map-item"><div class="map-item-top"><strong title="${safe(name)}">${safe(name)}</strong><span>${num(data.count)} matches · ${formatShort(data.pearls)} pearls</span></div><div class="map-track"><div class="map-fill" style="width:${100 * data.count / maxCount}%"></div></div></div>`).join('') : '<div class="no-results">No map details in the selected period</div>';
  }
  function renderResources() {
    const entries = new Map();
    for (const match of matchesAll().sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))) {
      for (const [key, value] of Object.entries(match.resources || {})) {
        if (typeof value !== 'number') continue;
        const prior = entries.get(key);
        entries.set(key, { value, prev: prior?.value ?? null, last: match.timestamp, label: (config.resourceLabels || {})[key] || match.resource_labels?.[key] || ({ gems: 'Gems', gold: 'Gold', trait_reroll_tokens: 'Trait Reroll Tokens', star_remnants: 'Star Remnants' }[key]) || `Resource ${key.replace('slot_', '')}` });
      }
    }
    const values = [...entries.entries()];
    const date = values.length ? values.reduce((latest, [, entry]) => entry.last > latest ? entry.last : latest, '') : null;
    $('resourceTimestamp').textContent = values.length ? `Latest balance snapshot · ${formatDate(date)}` : 'No resource snapshots were available.';
    $('resourceList').innerHTML = values.length ? values.map(([key, entry]) => {
      const diff = entry.prev === null ? null : entry.value - entry.prev;
      return `<div class="resource"><div class="resource-name" title="${safe(key)}">${safe(entry.label)}</div><strong class="resource-value">${num(entry.value)}</strong><div class="resource-delta">${diff === null ? 'Latest balance' : diff === 0 ? 'No change since prior snapshot' : `${diff > 0 ? '+' : '−'}${num(Math.abs(diff))} vs prior snapshot`}</div></div>`;
    }).join('') : '<div class="no-results">No balances found in embed fields.</div>';
  }
  function renderExtraRewards(rows) {
    const totals = {};
    for (const row of rows) {
      for (const [key, value] of Object.entries(row.extra_rewards || {})) {
        if (typeof value === 'number') totals[key] = (totals[key] || 0) + value;
      }
    }
    const list = Object.entries(totals);
    const panel = $('extraRewards');
    panel.hidden = !list.length;
    const labels = { gems: 'Gems', gold: 'Gold', star_remnants: 'Star Remnants', trait_reroll_tokens: 'Trait Reroll Tokens' };
    panel.innerHTML = list.length ? '<div class="extra-title">OTHER REWARDS EARNED IN SELECTION</div>' + list.map(([key, value]) => `<div class="extra-row"><span>${safe(labels[key] || key)}</span><strong>+${num(value)}</strong></div>`).join('') : '';
  }
  function authorizedDiscordUrl(raw) {
    try { const u = new URL(raw); return u.protocol === 'https:' && ['discord.com', 'discordapp.com'].includes(u.hostname) && u.pathname.startsWith('/channels/') ? u.href : null; }
    catch { return null; }
  }
  function renderTable(rows) {
    let output = rows;
    const query = state.query.toLowerCase();
    if (query) output = rows.filter(m => [m.map, m.difficulty, m.result, m.id].join(' ').toLowerCase().includes(query));
    const key = { pearls: 'pearls', damage: 'damage', kills: 'kills', duration: 'duration_seconds' }[state.sort];
    if (key) output = [...output].sort((a, b) => (val(b, key) ?? -1) - (val(a, key) ?? -1) || Date.parse(b.timestamp) - Date.parse(a.timestamp));
    const shown = output.slice(0, state.visible);
    $('historyBody').innerHTML = shown.length ? shown.map(m => {
      const url = authorizedDiscordUrl(m.url);
      const result = m.result || 'Unknown';
      return `<tr><td>${safe(formatDate(m.timestamp))}</td><td><span class="match-main" title="${safe(m.map || 'Unknown map')}">${safe(m.map || 'Unknown map')}</span><span class="match-sub">${safe(m.difficulty || 'Difficulty unavailable')} · Wave ${safe(m.wave ?? '—')}</span></td><td><span class="result-pill ${result === 'Victory' ? '' : result === 'Defeat' ? 'defeat' : 'unknown'}">${safe(result)}</span></td><td class="num">${safe(duration(val(m, 'duration_seconds')))}</td><td class="num"><strong>${m.pearls == null ? '—' : num(m.pearls)}</strong></td><td class="num">${m.kills == null ? '—' : num(m.kills)}</td><td class="num" title="${m.damage == null ? '' : num(m.damage)}">${m.damage == null ? '—' : formatShort(m.damage)}</td><td>${url ? `<a class="details-link" target="_blank" rel="noopener noreferrer" href="${safe(url)}">View ↗</a>` : '—'}</td></tr>`;
    }).join('') : '<tr><td colspan="8" class="no-results">No matches found for this search.</td></tr>';
    $('historyCount').textContent = `Showing ${num(shown.length)} of ${num(output.length)} sessions`;
    $('loadMore').hidden = shown.length >= output.length;
  }
  function render() {
    if (!state.payload) return;
    const all = matchesAll();
    const rows = filteredRows();
    $('emptyState').hidden = rows.length > 0;
    $('dataContent').hidden = rows.length === 0;
    if (!rows.length) {
      $('emptyTitle').textContent = all.length ? 'No sessions in this view.' : 'Your dashboard is ready.';
      $('emptyDescription').textContent = all.length ? 'Try a longer time range or clear your map and date filters.' : 'Connect your Discord bot through GitHub Secrets and run the update workflow. Data will appear automatically after the first scan.';
      $('emptyDemo').hidden = all.length > 0 || isDemo;
      return;
    }
    renderKpis(rows);
    renderTrend(rows);
    renderMaps(rows);
    renderResources();
    renderExtraRewards(rows);
    renderTable(rows);
  }
  function exportCsv() {
    const rows = filteredRows();
    if (!rows.length) return;
    const resourceKeys = [...new Set(rows.flatMap(row => Object.keys(row.resources || {})))].sort();
    const header = ['timestamp_utc', 'map', 'difficulty', 'result', 'duration_seconds', 'pearls', 'xp', 'kills', 'damage', 'wave', ...resourceKeys, 'discord_url'];
    const quote = x => {
      const raw = String(x ?? '');
      const guarded = /^[=+\-@\t\r]/.test(raw) ? "'" + raw : raw;
      return `"${guarded.replace(/"/g, '""')}"`;
    };
    const data = [header.join(','), ...rows.map(m => [m.timestamp, m.map, m.difficulty, m.result, m.duration_seconds, m.pearls, m.xp, m.kills, m.damage, m.wave, ...resourceKeys.map(key => m.resources?.[key] ?? ''), m.url].map(quote).join(','))].join('\r\n');
    const blob = new Blob(['\ufeff' + data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `aa-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }
  async function refreshData(silent = false) {
    if (state.loading) return;
    state.loading = true;
    $('refreshBtn').classList.add('rotating');
    try {
      const file = isDemo ? './data/demo.json' : './data/stats.json';
      const response = await fetch(`${file}?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.matches)) throw new Error('Unexpected JSON data format');
      const hasChanged = !state.payload || data.generated_at !== state.payload.generated_at || data.matches.length !== state.payload.matches.length;
      state.payload = data;
      if (hasChanged) { setOptions(); render(); }
      $('sourceStatus').textContent = isDemo ? 'Sample dataset' : data.matches.length ? 'Connected · Discord' : 'Awaiting first sync';
      $('syncTime').textContent = isDemo ? 'Preview mode' : data.generated_at ? `Updated ${formatDate(data.generated_at)}` : 'No data yet';
      document.body.classList.toggle('demo', isDemo);
      if (isDemo) {
        $('demoLink').textContent = 'Back to live'; $('demoLink').href = location.pathname;
      }
    } catch (err) {
      $('sourceStatus').textContent = 'Connection error';
      $('syncTime').textContent = 'Data unavailable';
      if (!silent) {
        $('emptyState').hidden = false;
        $('dataContent').hidden = true;
        $('emptyTitle').textContent = 'Cannot load dashboard data.';
        $('emptyDescription').textContent = 'Open the website through GitHub Pages or a local HTTP server (not by double-clicking the HTML file).';
      }
      console.error('Dashboard data request failed:', err);
    } finally {
      state.loading = false;
      $('refreshBtn').classList.remove('rotating');
    }
  }
  function wireEvents() {
    $('timezoneLabel').textContent = tz;
    if (typeof config.title === 'string' && config.title.trim()) {
      document.title = `Overview · ${config.title.trim()} Analytics`;
      document.querySelector('.brand-label span').textContent = config.title.trim().toUpperCase();
    }
    document.querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => {
      state.period = button.dataset.period;
      state.start = ''; state.end = '';
      $('startDate').value = ''; $('endDate').value = '';
      document.querySelectorAll('[data-period]').forEach(b => b.classList.toggle('active', b === button));
      state.visible = 10; render();
    }));
    for (const [id, key] of [['mapFilter', 'map'], ['difficultyFilter', 'difficulty']]) {
      $(id).addEventListener('change', e => { state[key] = e.target.value; state.visible = 10; render(); });
    }
    for (const [id, key] of [['startDate', 'start'], ['endDate', 'end']]) {
      $(id).addEventListener('change', e => {
        state[key] = e.target.value; state.period = 'custom';
        document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('active'));
        state.visible = 10; render();
      });
    }
    document.querySelectorAll('[data-metric]').forEach(button => button.addEventListener('click', () => {
      state.metric = button.dataset.metric;
      document.querySelectorAll('[data-metric]').forEach(b => b.classList.toggle('active', b === button));
      renderTrend(filteredRows());
    }));
    $('historySearch').addEventListener('input', e => { state.query = e.target.value.trim(); state.visible = 10; renderTable(filteredRows()); });
    $('historySort').addEventListener('change', e => { state.sort = e.target.value; renderTable(filteredRows()); });
    $('loadMore').addEventListener('click', () => { state.visible += 10; renderTable(filteredRows()); });
    $('exportBtn').addEventListener('click', exportCsv);
    $('refreshBtn').addEventListener('click', () => refreshData(false));
    document.querySelectorAll('[data-nav]').forEach(link => link.addEventListener('click', () => {
      document.querySelectorAll('[data-nav]').forEach(item => item.classList.toggle('active', item === link));
    }));
  }
  if (isDemo) {
    const banner = document.createElement('div');
    banner.className = 'demo-banner';
    banner.textContent = 'DEMO PREVIEW — all values here are synthetic sample data, not your Discord history.';
    document.body.prepend(banner);
  }
  wireEvents();
  refreshData();
  if (!isDemo) setInterval(() => { if (!document.hidden) refreshData(true); }, 60_000);
})();
