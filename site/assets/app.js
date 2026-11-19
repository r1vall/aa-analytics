/* AA Analytics V2.0. Pure static client, no secret credentials or remote dependencies. */
(() => {
  'use strict';
  const cfg = window.DASHBOARD_CONFIG || {};
  const tz = cfg.timezone || 'Europe/Kyiv';
  const demo = new URLSearchParams(window.location.search).get('demo') === '1';
  const $ = (id) => document.getElementById(id);
  const escape = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* private window */ } },
  };
  const ICON = (id) => `<svg class="icon" aria-hidden="true"><use href="#ic-${id}"></use></svg>`;
  const I18N = {
    ru: {
      workspace:'РАБОЧЕЕ ПРОСТРАНСТВО', workspaceShort:'WORKSPACE', navOverview:'Обзор',navTrends:'Аналитика',navResources:'Ресурсы',navMatches:'История матчей',
      helpTitle:'Все матчи. Один взгляд.',helpText:'Без ручного подсчёта и бесконечных таблиц.',connection:'ИСТОЧНИК ДАННЫХ',connecting:'Подключение…',connected:'Discord подключён',awaiting:'Ожидание данных',demo:'Демо-режим',offline:'Ошибка загрузки',
      demoBanner:'ДЕМО-РЕЖИМ: здесь показаны вымышленные данные, не ваша статистика Discord.',backLive:'К реальным данным ↗',
      dashboardTitle:'Аналитика',dashboardSubtitle:'Краткий обзор статистики и последних матчей.',trendTitleV4:'Динамика наград',lastMatchesV4:'Последние матчи',syncAutomatic:'Автоматическая синхронизация',recordedMatches:'матчей в выборке',
      period24:'24 часа',period7:'7 дней',period30:'30 дней',periodAll:'Всё время',dates:'Даты',reset:'Сбросить',from:'С',to:'По',apply:'Применить',resetFilters:'Сбросить фильтры',
      allMaps:'Все карты',allDifficulties:'Все сложности',dateInvalid:'Дата начала не может быть позже даты окончания.',
      atAGlance:'КРАТКО О ГЛАВНОМ',keyMetrics:'Ключевые показатели',trendCaption:'ДИНАМИКА НАГРАД',trendTitle:'Активность во времени',trendDescription:'Смотри, как меняются результаты от матча к матчу.',metricPearls:'Перлы',metricKills:'Киллы',metricDamage:'Урон',chartSource:'Источник: результаты матчей Discord',
      effEyebrow:'ЭФФЕКТИВНОСТЬ',effTitle:'Темп фарма',effDesc:'В расчёте на игровое время.',perHour:'SUMMER PEARLS / ЧАС',effNote:'Время в лобби не учитывается. Почасовые значения рассчитаны только для матчей с известной длительностью.',
      mapsEyebrow:'ГДЕ ИГРАЕШЬ',mapsTitle:'Карты и режимы',mapsDesc:'Распределение матчей по локациям.',inventoryEyebrow:'АКТУАЛЬНЫЕ ЗАПАСЫ',inventoryTitle:'Инвентарь',inventoryNote:'Здесь показан последний баланс, а не сумма дохода. Неопознанные иконки можно подписать в assets/config.js.',
      historyEyebrow:'ПОЛНЫЙ АРХИВ',historyTitle:'История матчей',historyDesc:'Поиск, сортировка и ссылки на оригинальные сообщения.',export:'Экспорт CSV',thDate:'ДАТА',thMap:'КАРТА И СЛОЖНОСТЬ',thResult:'РЕЗУЛЬТАТ',thTime:'ВРЕМЯ',thPearls:'ПЕРЛЫ',thKills:'КИЛЛЫ',thDamage:'УРОН',thLink:'ССЫЛКА',showMore:'Показать ещё',
      footerDesc:'ПАНЕЛЬ ИГРОВОЙ СТАТИСТИКИ',timezone:'Часовой пояс',autoSync:'Автообновление: ~5 минут*',
      emptyKicker:'ЗАПИСЕЙ НЕТ',openDemo:'Открыть демо ↗',readyTitle:'Здесь появится твоя статистика.',readyDesc:'Подключи Discord через GitHub Secrets и запусти Update dashboard.',noMatchesTitle:'Нет матчей за этот период.',noMatchesDesc:'Выбери другой период или сбрось фильтры.',errorTitle:'Не удалось загрузить статистику.',errorDesc:'Проверьте GitHub Actions и наличие файла site/data/stats.json. Сайт нужно открывать через GitHub Pages или локальный сервер.',
      dataChecked:'Данные проверены',dataUpdated:'Данные обновлены',dataError:'Не удалось обновить данные',dataNone:'Данных пока нет',updated:'Обновлено',lastSync:'Последняя синхронизация',stale:'Данные не обновлялись',preview:'Просмотр примера',loading:'Загрузка данных…',
      kpiPearls:'Саммер перлы',kpiTime:'Часы в игре',kpiRate:'Перлов / час',kpiMatches:'Игр',kpiXp:'Получено XP',kpiKills:'Всего киллов',kpiDamage:'Суммарный урон',kpiWin:'Победы',
      previous:'к предыдущему периоду',notEnough:'Нет данных для сравнения',recordedTime:'Только время матчей',hourlyEfficiency:'Эффективность фарма',runs:'матчей в выборке',knownResults:'С известным результатом',exactDamage:'точное значение',
      effXp:'XP / час',effKills:'Киллов / час',effDamage:'Урона / час',effAverage:'Средняя длительность',effWins:'Побед',effContext:'матчей с известной длительностью',
      chartDay:'По дням',chartHour:'По часам',chartMonth:'По месяцам',trendUnit:'за период',sessions:'матчей',mapCount:'карт',noMap:'Карта не указана',unknownDifficulty:'Сложность неизвестна',wave:'Волна',
      latestBalance:'Последний баланс',balanceTime:'Данные на',noBalances:'Балансы ресурсов не найдены.',noChange:'Без изменений',sinceSnapshot:'с прошлого снимка',slot:'Ресурс',extraTitle:'ДОПОЛНИТЕЛЬНЫЕ НАГРАДЫ ЗА ПЕРИОД',
      resourceGems:'Гемы',resourceGold:'Золото',resourceTraits:'Токены реролла',resourceStars:'Звёздные остатки',resourcePearls:'Summer Pearls',
      searchPlaceholder:'Поиск по карте...',sortDate:'Сначала новые',sortPearls:'Больше перлов',sortDamage:'Больше урона',sortKills:'Больше киллов',sortDuration:'Дольше матч',
      victory:'Победа',defeat:'Поражение',unknown:'Неизвестно',unknownMap:'Карта неизвестна',view:'Открыть',noSearch:'По этому запросу матчей нет.',shown:'Показано',of:'из',
      themeDark:'Тёмная',themeLight:'Светлая',langTitle:'Switch language',noExport:'Нет матчей для экспорта',exportDone:'CSV скачан',
    },
    en: {
      workspace:'WORKSPACE',workspaceShort:'WORKSPACE',navOverview:'Overview',navTrends:'Analytics',navResources:'Resources',navMatches:'Match history',
      helpTitle:'Every run. One view.',helpText:'No manual counting and no endless spreadsheets.',connection:'DATA SOURCE',connecting:'Connecting…',connected:'Discord connected',awaiting:'Awaiting data',demo:'Demo mode',offline:'Load error',
      demoBanner:'DEMO MODE: these are fictional values, not your Discord match history.',backLive:'Back to live ↗',
      dashboardTitle:'Analytics',dashboardSubtitle:'A quick look at your stats and latest matches.',trendTitleV4:'Rewards over time',lastMatchesV4:'Latest matches',syncAutomatic:'Automatic sync',recordedMatches:'matches in selection',
      period24:'24 hours',period7:'7 days',period30:'30 days',periodAll:'All time',dates:'Dates',reset:'Reset',from:'From',to:'To',apply:'Apply',resetFilters:'Reset filters',
      allMaps:'All maps',allDifficulties:'All difficulties',dateInvalid:'Start date cannot be later than end date.',
      atAGlance:'AT A GLANCE',keyMetrics:'Key metrics',trendCaption:'REWARD TRENDS',trendTitle:'Activity over time',trendDescription:'See how your runs compare across sessions.',metricPearls:'Pearls',metricKills:'Kills',metricDamage:'Damage',chartSource:'Source: Discord match results',
      effEyebrow:'EFFICIENCY',effTitle:'Farming pace',effDesc:'Measured against actual match time.',perHour:'SUMMER PEARLS / HOUR',effNote:'Lobby time is excluded. Rates only include matches with recorded durations.',
      mapsEyebrow:'WHERE YOU PLAY',mapsTitle:'Maps and modes',mapsDesc:'Distribution of runs across locations.',inventoryEyebrow:'LATEST BALANCES',inventoryTitle:'Inventory',inventoryNote:'These are the latest balances, not earned totals. Unknown resource icons can be named in assets/config.js.',
      historyEyebrow:'FULL ARCHIVE',historyTitle:'Match history',historyDesc:'Search, sort and open the original Discord messages.',export:'Export CSV',thDate:'DATE',thMap:'MAP & DIFFICULTY',thResult:'RESULT',thTime:'TIME',thPearls:'PEARLS',thKills:'KILLS',thDamage:'DAMAGE',thLink:'LINK',showMore:'Show more',
      footerDesc:'GAME PERFORMANCE DASHBOARD',timezone:'Timezone',autoSync:'Auto-sync: ~5 minutes*',
      emptyKicker:'NO MATCHES',openDemo:'Open demo ↗',readyTitle:'Your stats will show up here.',readyDesc:'Connect Discord in GitHub Secrets and run Update dashboard.',noMatchesTitle:'No matches in this period.',noMatchesDesc:'Try a different period or clear your filters.',errorTitle:'Could not load statistics.',errorDesc:'Check GitHub Actions and the site/data/stats.json file. Open this site through GitHub Pages or a local HTTP server.',
      dataChecked:'Data checked',dataUpdated:'Data refreshed',dataError:'Unable to refresh',dataNone:'No data yet',updated:'Updated',lastSync:'Last synced',stale:'Data not refreshed',preview:'Preview mode',loading:'Loading data…',
      kpiPearls:'Summer Pearls',kpiTime:'Time in matches',kpiRate:'Pearls / hour',kpiMatches:'Matches played',kpiXp:'XP earned',kpiKills:'Total kills',kpiDamage:'Total damage',kpiWin:'Win rate',
      previous:'vs previous period',notEnough:'Comparison unavailable',recordedTime:'Match time only',hourlyEfficiency:'Farming efficiency',runs:'matches selected',knownResults:'Known results only',exactDamage:'exact value',
      effXp:'XP / hour',effKills:'Kills / hour',effDamage:'Damage / hour',effAverage:'Average match time',effWins:'Wins',effContext:'matches with known duration',
      chartDay:'Daily totals',chartHour:'Hourly totals',chartMonth:'Monthly totals',trendUnit:'in period',sessions:'matches',mapCount:'maps',noMap:'Unknown map',unknownDifficulty:'Difficulty unknown',wave:'Wave',
      latestBalance:'Latest balance',balanceTime:'As of',noBalances:'No resource snapshots were found.',noChange:'No change',sinceSnapshot:'since last snapshot',slot:'Resource',extraTitle:'EXTRA REWARDS IN PERIOD',
      resourceGems:'Gems',resourceGold:'Gold',resourceTraits:'Trait Reroll Tokens',resourceStars:'Star Remnants',resourcePearls:'Summer Pearls',
      searchPlaceholder:'Search maps...',sortDate:'Newest first',sortPearls:'Most pearls',sortDamage:'Most damage',sortKills:'Most kills',sortDuration:'Longest match',
      victory:'Victory',defeat:'Defeat',unknown:'Unknown',unknownMap:'Unknown map',view:'Open',noSearch:'No matches for this search.',shown:'Showing',of:'of',
      themeDark:'Dark',themeLight:'Light',langTitle:'Сменить язык',noExport:'No matches to export',exportDone:'CSV downloaded',
    }
  };
  const state = {
    payload:null, period:'7d', metric:'pearls', map:'', difficulty:'', start:'', end:'', query:'', sort:'date', visible:10,
    loading:false, lang:storage.get('aa-language') === 'en' ? 'en' : cfg.defaultLanguage === 'en' ? 'en' : 'ru',
    theme:storage.get('aa-theme') === 'dark' ? 'dark' : storage.get('aa-theme') === 'light' ? 'light' : 'dark',
  };
  const t = (key) => I18N[state.lang][key] ?? key;
  const fmt = () => new Intl.NumberFormat(state.lang === 'ru' ? 'ru-RU' : 'en-US');
  const num = (x) => fmt().format(Math.round(Number(x) || 0));
  const numeric = (obj,key) => (typeof obj?.[key] === 'number' && Number.isFinite(obj[key]) && obj[key] >= 0 ? obj[key] : null);
  const sum = (rows, key) => rows.reduce((n,row) => n+(numeric(row,key) ?? 0),0);
  const seconds = (rows) => sum(rows,'duration_seconds');
  function short(n) {
    if (n == null || !Number.isFinite(n)) return '—';
    if (Math.abs(n) < 10000) return num(n);
    for (const [base, ru, en] of [[1e12,'трлн','T'],[1e9,'млрд','B'],[1e6,'млн','M'],[1e3,'тыс','K']]) {
      if (Math.abs(n) >= base) return `${(n/base).toFixed(Math.abs(n)/base >= 100 ? 0 : Math.abs(n)/base >= 10 ? 1 : 2).replace(/\.0+$/,'')}${state.lang==='ru'?' '+ru:en}`;
    }
    return num(n);
  }
  function duration(sec) {
    if (sec == null || !Number.isFinite(sec)) return '—';
    const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=Math.floor(sec%60);
    return state.lang==='ru' ? (h?`${num(h)} ч ${String(m).padStart(2,'0')} мин`:m?`${m} мин ${String(s).padStart(2,'0')} с`:`${s} с`)
      : (h?`${num(h)}h ${String(m).padStart(2,'0')}m`:m?`${m}m ${String(s).padStart(2,'0')}s`:`${s}s`);
  }
  function hourRate(rows, key) {
    const known=rows.filter(r=>(numeric(r,'duration_seconds')??0)>0 && numeric(r,key)!==null);
    const hrs=seconds(known)/3600;
    return hrs>0 ? sum(known,key)/hrs : null;
  }
  const dateFormatter=(format='full')=>new Intl.DateTimeFormat(state.lang==='ru'?'ru-RU':'en-GB',{timeZone:tz,year:'numeric',month:'short',day:'2-digit',...(format==='full'?{hour:'2-digit',minute:'2-digit'}:{})});
  function prettyDate(stamp,format='full') { const d=new Date(stamp);return Number.isFinite(d.getTime())?dateFormatter(format).format(d):'—'; }
  function dayLocal(d) {
    const parts=new Intl.DateTimeFormat('en-GB',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
    const at=k=>parts.find(p=>p.type===k)?.value||'';
    return `${at('year')}-${at('month')}-${at('day')}`;
  }
  function hourLocal(d) {return new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',hourCycle:'h23'}).format(d);}
  const cleanRows=(payload)=>Array.isArray(payload?.matches)?payload.matches.filter(m=>m&&Number.isFinite(Date.parse(m.timestamp))):[];
  const allMatches=()=>cleanRows(state.payload);
  function periodRange() {
    const now=Date.now();
    if(state.period==='24h')return {start:now-864e5,end:now,name:t('period24')};
    if(state.period==='7d')return {start:now-7*864e5,end:now,name:t('period7')};
    if(state.period==='30d')return {start:now-30*864e5,end:now,name:t('period30')};
    return {start:null,end:null,name:state.period==='all'?t('periodAll'):t('dates')};
  }
  const dims=(m)=>(!state.map||m.map===state.map)&&(!state.difficulty||m.difficulty===state.difficulty);
  function selectedMatches(){
    const {start,end}=periodRange();
    return allMatches().filter(m=>{const time=Date.parse(m.timestamp);return dims(m)&& (start===null||time>=start)&&(end===null||time<=end)&&(!state.start||dayLocal(new Date(time))>=state.start)&&(!state.end||dayLocal(new Date(time))<=state.end);}).sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp));
  }
  function previousMatches(){
    const {start,end}=periodRange();if(start===null||end===null||state.start||state.end)return null;
    const size=end-start;return allMatches().filter(m=>{const time=Date.parse(m.timestamp);return dims(m)&&time>=start-size&&time<start;});
  }
  const pct=(now,old)=>old===null||old===undefined?null:old===0?(now===0?0:null):(now-old)/Math.abs(old)*100;
  function delta(current,previous){
    const d=pct(current,previous);
    if(d===null)return `<span>${escape(t('notEnough'))}</span>`;
    const sentiment=d>.05?'positive':d<-.05?'negative':'neutral';
    return `<span class="delta ${sentiment}">${d>.05?'↗':d<-.05?'↘':'–'} ${Math.abs(d).toFixed(1)}%</span><span>${escape(t('previous'))}</span>`;
  }
  function applyStaticLanguage(){
    document.documentElement.lang=state.lang;
    document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(I18N[state.lang][key])el.innerHTML=t(key);});
    $('languageBtn').textContent=state.lang.toUpperCase(); $('languageBtn').title=t('langTitle');
    $('historySearch').placeholder=t('searchPlaceholder');
    const sortItems=['sortDate','sortPearls','sortDamage','sortKills','sortDuration'];
    [...$('historySort').options].forEach((o,i)=>o.textContent=t(sortItems[i]));
    updateThemeButton();
    $('timezoneLabel').textContent=tz;
    document.title=`AA Analytics — ${t('dashboardTitle')}`;
    updateSourceStatus();
    updateUpdatedAt();
    updateNav();
  }
  function updateThemeButton(){
    const label=state.theme==='dark'?t('themeLight'):t('themeDark');
    $('themeBtnLabel').textContent=label;
    $('themeBtn').setAttribute('aria-label',`${label} · ${state.lang==='ru'?'сменить тему':'change theme'}`);
    document.querySelector('meta[name="theme-color"]').content=state.theme==='dark'?'#130d1b':'#f9f6fd';
  }
  function setTheme(next){
    state.theme=next;storage.set('aa-theme',next);document.documentElement.dataset.theme=next;updateThemeButton();
  }
  function animateTheme(event){
    const next=state.theme==='light'?'dark':'light';
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){setTheme(next);return;}
    const r=$('themeBtn').getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;
    const radius=Math.hypot(Math.max(cx,innerWidth-cx),Math.max(cy,innerHeight-cy));
    const from=`circle(0px at ${cx}px ${cy}px)`,to=`circle(${radius+25}px at ${cx}px ${cy}px)`;
    if(document.startViewTransition){
      const vt=document.startViewTransition(()=>setTheme(next));
      vt.ready.then(()=>{
        document.documentElement.animate({clipPath:[from,to]},
          {duration:780,easing:'cubic-bezier(.16,.81,.24,1)',pseudoElement:'::view-transition-new(root)',fill:'forwards'});
      }).catch(()=>{});
    }else{
      // Old browsers: a full circular color wash then a soft dissolve.
      const veil=document.createElement('div');
      Object.assign(veil.style,{position:'fixed',inset:'0',zIndex:'9999',pointerEvents:'none',background:next==='dark'?'#130d1b':'#f9f6fd',clipPath:from});
      document.body.appendChild(veil);
      const a=veil.animate([{clipPath:from},{clipPath:to}],{duration:530,easing:'cubic-bezier(.18,.8,.22,1)',fill:'forwards'});
      a.finished.then(()=>{setTheme(next);veil.animate([{opacity:1},{opacity:0}],{duration:220,fill:'forwards'}).finished.then(()=>veil.remove());}).catch(()=>{veil.remove();setTheme(next);});
    }
  }
  function updateNav(){
    const id=(location.hash||'#trends').slice(1);
    document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===id));
    $('breadcrumbCurrent').textContent=t(({overview:'dashboardTitle',trends:'navTrends',resources:'navResources',matches:'navMatches'})[id]||'dashboardTitle');
  }
  function setOptions(){
    [['mapFilter','map','allMaps'],['difficultyFilter','difficulty','allDifficulties']].forEach(([id,key,caption])=>{
      const select=$(id),prev=state[key];
      const values=[...new Set(allMatches().map(m=>m[key]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,state.lang));
      select.innerHTML=`<option value="">${escape(t(caption))}</option>`+values.map(v=>`<option value="${escape(v)}">${escape(v)}</option>`).join('');
      select.value=values.includes(prev)?prev:'';state[key]=select.value;
    });
  }
  function isFiltered(){return state.period!=='7d'||!!state.map||!!state.difficulty||!!state.start||!!state.end;}
  function updateFilters(){
    document.querySelectorAll('[data-period]').forEach(btn=>{const on=btn.dataset.period===state.period;btn.classList.toggle('selected',on);btn.setAttribute('aria-pressed',String(on));});
    $('resetFilters').hidden=!isFiltered();
    $('mapFilter').value=state.map;$('difficultyFilter').value=state.difficulty;
    $('startDate').value=state.start;$('endDate').value=state.end;
  }
  function resetFilters(){Object.assign(state,{period:'7d',map:'',difficulty:'',start:'',end:'',visible:10});$('datePopover').hidden=true;updateFilters();render();}
  function kpi(label,value,footer,icon,index,tooltip=''){
    return `<article class="kpi-card" style="animation-delay:${index*24}ms"><div class="kpi-top"><span class="kpi-label">${escape(label)}</span><span class="kpi-icon">${ICON(icon)}</span></div><strong class="kpi-value" title="${escape(tooltip||String(value))}">${escape(value)}</strong><div class="kpi-bottom">${footer}</div></article>`;
  }
  function renderKPIs(rows){
    const old=previousMatches();const known=rows.filter(m=>['Victory','Defeat'].includes(m.result));
    const wins=known.filter(m=>m.result==='Victory').length;const winRate=known.length?wins/known.length*100:null;
    const oldKnown=old?.filter(m=>['Victory','Defeat'].includes(m.result));
    const oldWins=oldKnown?.filter(m=>m.result==='Victory').length||0;
    const oldRate=oldKnown?.length?oldWins/oldKnown.length*100:null;
    const items=[
      [t('kpiPearls'),num(sum(rows,'pearls')),old?delta(sum(rows,'pearls'),sum(old,'pearls')):`<span>${escape(t('recordedMatches'))}</span>`,'diamond',num(sum(rows,'pearls'))],
      [t('kpiTime'),seconds(rows)?duration(seconds(rows)):'—',old?delta(seconds(rows),seconds(old)):`<span>${escape(t('recordedTime'))}</span>`,'clock'],
      [t('kpiMatches'),num(rows.length),old?delta(rows.length,old.length):`<span>${escape(t('runs'))}</span>`,'layers'],
      [t('kpiRate'),hourRate(rows,'pearls')==null?'—':num(hourRate(rows,'pearls')),old?delta(hourRate(rows,'pearls'),hourRate(old,'pearls')):`<span>${escape(t('hourlyEfficiency'))}</span>`,'bolt'],
      [t('kpiXp'),num(sum(rows,'xp')),old?delta(sum(rows,'xp'),sum(old,'xp')):`<span>XP</span>`,'star'],
      [t('kpiKills'),num(sum(rows,'kills')),old?delta(sum(rows,'kills'),sum(old,'kills')):`<span>${escape(t('recordedMatches'))}</span>`,'target'],
      [t('kpiDamage'),short(sum(rows,'damage')),old?delta(sum(rows,'damage'),sum(old,'damage')):`<span>${escape(t('exactDamage'))}: ${escape(num(sum(rows,'damage')))}</span>`,'activity',num(sum(rows,'damage'))],
      [t('kpiWin'),winRate==null?'—':`${winRate.toFixed(1)}%`,old?delta(winRate,oldRate):`<span>${escape(t('knownResults'))}</span>`,'shield'],
    ];
    $('kpiGrid').innerHTML=items.slice(0,4).map((item,i)=>kpi(...item.slice(0,4),i,item[4])).join('');
    $('kpiSecondary').innerHTML=items.slice(4).map((item,i)=>kpi(...item.slice(0,4),i+4,item[4])).join('');
    $('kpiScope').textContent=`${periodRange().name} · ${num(rows.length)} ${t('sessions')}`;
    
    $('efficiencyPearls').textContent=hourRate(rows,'pearls')==null?'—':num(hourRate(rows,'pearls'));
    $('efficiencyContext').textContent=`${num(rows.filter(m=>(numeric(m,'duration_seconds')??0)>0).length)} ${t('effContext')}`;
    const metrics=[[t('effXp'),hourRate(rows,'xp')],[t('effKills'),hourRate(rows,'kills')],[t('effDamage'),hourRate(rows,'damage')],[t('effAverage'),rows.filter(m=>(numeric(m,'duration_seconds')??0)>0).length?seconds(rows)/rows.filter(m=>(numeric(m,'duration_seconds')??0)>0).length:null],[t('effWins'),known.length?`${num(wins)} / ${num(known.length)}`:'—']];
    $('efficiencyRows').innerHTML=metrics.map(([label,value],i)=>`<div class="eff-row"><span>${escape(label)}</span><strong title="${typeof value==='number'?escape(num(value)):''}">${typeof value==='number'?(i===3?duration(value):short(value)):escape(value??'—')}</strong></div>`).join('');
  }
  function bucketKey(row,kind){const date=new Date(row.timestamp),day=dayLocal(date);return kind==='hour'?`${day} ${hourLocal(date)}:00`:kind==='month'?day.slice(0,7):day;}
  function getBuckets(rows){
    const ordered=[...rows].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
    const span=ordered.length?Date.parse(ordered.at(-1).timestamp)-Date.parse(ordered[0].timestamp):0;
    const kind=state.period==='24h'?'hour':state.period==='all'&&span>120*864e5?'month':'day';
    const map=new Map();const zero=(key)=>({key,pearls:0,xp:0,kills:0,damage:0,matches:0});
    for(const row of ordered){const key=bucketKey(row,kind);if(!map.has(key))map.set(key,zero(key));const b=map.get(key);for(const metric of ['pearls','xp','kills','damage'])b[metric]+=numeric(row,metric)??0;b.matches++;}
    if(state.period==='24h'){
      for(let i=23;i>=0;i--){const d=new Date(Date.now()-i*36e5),key=`${dayLocal(d)} ${hourLocal(d)}:00`;if(!map.has(key))map.set(key,zero(key));}
    }else if(['7d','30d'].includes(state.period)){
      for(let i=(state.period==='7d'?7:30)-1;i>=0;i--){const d=new Date(Date.now()-i*864e5),key=dayLocal(d);if(!map.has(key))map.set(key,zero(key));}
    }
    return {kind,buckets:[...map.values()].sort((a,b)=>a.key.localeCompare(b.key))};
  }
  function smoothPath(points){
    if(!points.length)return '';
    let d=`M ${points[0][0]} ${points[0][1]}`;
    for(let i=0;i<points.length-1;i++){
      const prev=points[Math.max(0,i-1)],a=points[i],b=points[i+1],next=points[Math.min(points.length-1,i+2)];
      const dx=(b[0]-a[0]);
      let slope1=(b[1]-prev[1])/(b[0]-prev[0]||1),slope2=(next[1]-a[1])/(next[0]-a[0]||1);
      const avg=(b[1]-a[1])/(dx||1);
      if(Math.abs(avg)<.0001){slope1=0;slope2=0;}else{if(slope1*avg<0)slope1=0;if(slope2*avg<0)slope2=0;}
      const c1y=Math.max(7,Math.min(250,a[1]+slope1*dx*.28)),c2y=Math.max(7,Math.min(250,b[1]-slope2*dx*.28));
      d+=` C ${(a[0]+dx*.28).toFixed(1)} ${c1y.toFixed(1)}, ${(b[0]-dx*.28).toFixed(1)} ${c2y.toFixed(1)}, ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    }
    return d;
  }
  const METRIC_NAMES={pearls:'Summer Pearls',xp:'XP',kills:'metricKills',damage:'metricDamage'};
  const metricLabel=(k)=>t(METRIC_NAMES[k]);
  function renderChart(rows){
    const metric=state.metric,total=sum(rows,metric);
    $('trendTotal').textContent=metric==='damage'?short(total):num(total);
    $('trendTotal').title=num(total);
    $('trendTotalUnit').textContent=`${metricLabel(metric)} ${t('trendUnit')}`;
    const {kind,buckets}=getBuckets(rows);
    $('chartAxisLabel').textContent=t(kind==='hour'?'chartHour':kind==='month'?'chartMonth':'chartDay');
    const svg=$('trendChart').querySelector('svg');
    const w=840,h=275,left=52,right=14,top=15,bottom=40,iw=w-left-right,ih=h-top-bottom;
    const ceiling=Math.max(1,...buckets.map(b=>b[metric]))*1.16;
    const x=i=>left+iw*(buckets.length<2?.5:i/(buckets.length-1));
    const y=v=>top+ih*(1-v/ceiling);
    const points=buckets.map((b,i)=>[x(i),y(b[metric])]);
    const line=smoothPath(points);
    const area=points.length?`${line} L ${points.at(-1)[0]} ${top+ih} L ${points[0][0]} ${top+ih} Z`:'';
    const grids=Array.from({length:5},(_,i)=>{const yy=top+ih*i/4;return `<line class="chart-grid-line" x1="${left}" y1="${yy}" x2="${w-right}" y2="${yy}"/><text class="chart-grid-text" x="${left-11}" y="${yy+4}" text-anchor="end">${escape(short(ceiling*(1-i/4)))}</text>`;}).join('');
    const n=Math.min(6,buckets.length);const tickIndices=new Set(Array.from({length:n},(_,i)=>Math.round((n<2?0:i/(n-1))*(buckets.length-1))));
    const ticks=[...tickIndices].map(i=>{const key=buckets[i].key;const display=kind==='month'?key:kind==='hour'?key.slice(11):key.slice(5).replace('-','/');return `<text class="chart-x-text" x="${x(i)}" y="${h-8}" text-anchor="middle">${escape(display)}</text>`;}).join('');
    const tail=points.length?`<circle class="chart-end-dot" cx="${points.at(-1)[0]}" cy="${points.at(-1)[1]}" r="4"/>`:'';
    const hotspots=points.map((p,i)=>{const start=i===0?left:(x(i-1)+p[0])/2;const end=i===buckets.length-1?w-right:(p[0]+x(i+1))/2;return `<rect class="chart-target" x="${start}" y="${top}" width="${Math.max(1,end-start)}" height="${ih}" tabindex="0" role="button" aria-label="${escape(buckets[i].key)}: ${escape(num(buckets[i][metric]))} ${escape(metricLabel(metric))}" data-bucket="${i}"/>`;}).join('');
    svg.innerHTML=grids+(points.length?`<path class="chart-fill" d="${area}"/><path class="chart-line" d="${line}"/>${tail}`:'')+ticks+hotspots;
    const tip=$('chartTooltip');tip.hidden=true;
    const show=i=>{const b=buckets[i],p=points[i];tip.hidden=false;tip.innerHTML=`<span>${escape(b.key)}</span><strong>${escape(num(b[metric]))} ${escape(metricLabel(metric))}</strong><span>${escape(num(b.matches))} ${escape(t('sessions'))}</span>`;const rect=$('trendChart').getBoundingClientRect();tip.style.left=`${Math.max(105,Math.min(rect.width-105,p[0]/w*rect.width))}px`;tip.style.top=`${Math.max(80,p[1]/h*rect.height)}px`;};
    svg.querySelectorAll('[data-bucket]').forEach(r=>{
      const idx=Number(r.dataset.bucket);
      r.addEventListener('pointerenter',()=>show(idx));r.addEventListener('pointerleave',()=>tip.hidden=true);
      r.addEventListener('focus',()=>show(idx));r.addEventListener('blur',()=>tip.hidden=true);
      r.addEventListener('click',()=>{if(tip.hidden)show(idx);else tip.hidden=true;});
    });
  }
  function renderMaps(rows){
    const summary=new Map();
    rows.forEach(row=>{const key=row.map||t('unknownMap');if(!summary.has(key))summary.set(key,{count:0,pearls:0});const m=summary.get(key);m.count++;m.pearls+=numeric(row,'pearls')??0;});
    const ordered=[...summary.entries()].sort((a,b)=>b[1].count-a[1].count).slice(0,5);
    $('mapsCount').textContent=`${num(summary.size)} ${t('mapCount')}`;
    const max=Math.max(1,...ordered.map(([,v])=>v.count));
    $('mapBreakdown').innerHTML=ordered.length?ordered.map(([name,v])=>`<div class="map-item"><div class="map-item-top"><strong title="${escape(name)}">${escape(name)}</strong><span>${num(v.count)} ${t('sessions')} · ${short(v.pearls)} pearls</span></div><div class="map-track"><div class="map-fill" style="width:${(v.count/max*100).toFixed(2)}%"></div></div></div>`).join(''):`<div class="no-results">${escape(t('noMatchesDesc'))}</div>`;
  }
  const resourceMeta={gems:['resourceGems','gem'],gold:['resourceGold','coin'],trait_reroll_tokens:['resourceTraits','bolt'],star_remnants:['resourceStars','star'],summer_pearls:['resourcePearls','diamond']};
  function resourceLabel(key,reported){
    const configured=cfg.resourceLabels?.[key];if(configured&&typeof configured==='string')return configured;
    if(resourceMeta[key])return t(resourceMeta[key][0]);
    if(key.startsWith('slot_'))return `${t('slot')} ${key.split('_').at(-1)}`;
    return reported||key.replaceAll('_',' ');
  }
  function renderResources(){
    // Balance snapshots are global; they are independent from the selected period.
    const entries=new Map();
    for(const m of [...allMatches()].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp))){
      for(const [key,value] of Object.entries(m.resources||{})){
        if(typeof value!=='number'||!Number.isFinite(value))continue;
        const prev=entries.get(key);
        entries.set(key,{value,prev:prev?.value??null,stamp:m.timestamp,reported:m.resource_labels?.[key]});
      }
    }
    const rows=[...entries.entries()].sort(([a],[b])=>{
      const rank=x=>Object.keys(resourceMeta).indexOf(x)===-1?10:Object.keys(resourceMeta).indexOf(x);
      return rank(a)-rank(b)||a.localeCompare(b);
    });
    const timestamp=rows.length?rows.reduce((v,[,r])=>r.stamp>v?r.stamp:v,''):null;
    $('resourceTimestamp').textContent=rows.length?`${t('balanceTime')} ${prettyDate(timestamp)}`:t('noBalances');
    $('resourceList').innerHTML=rows.length?rows.map(([key,r])=>{
      const diff=r.prev===null?null:r.value-r.prev;
      const details=diff===null?t('latestBalance'):Math.abs(diff)<.01?t('noChange'):`${diff>0?'+':'−'}${num(Math.abs(diff))} ${t('sinceSnapshot')}`;
      return `<div class="resource"><div class="resource-icon">${ICON(resourceMeta[key]?.[1]||'database')}</div><span class="resource-name" title="${escape(key)}">${escape(resourceLabel(key,r.reported))}</span><strong class="resource-value">${num(r.value)}</strong><span class="resource-delta">${escape(details)}</span></div>`;
    }).join(''):`<div class="no-results">${escape(t('noBalances'))}</div>`;
  }
  function renderExtra(rows){
    const rewards={};for(const m of rows){for(const [key,value] of Object.entries(m.extra_rewards||{})){if(typeof value==='number'&&Number.isFinite(value))rewards[key]=(rewards[key]||0)+value;}}
    const items=Object.entries(rewards);const el=$('extraRewards');el.hidden=!items.length;
    el.innerHTML=items.length?`<div class="extra-title">${escape(t('extraTitle'))}</div>`+items.map(([key,val])=>`<div class="extra-row"><span>${escape(resourceLabel(key))}</span><strong>+${num(val)}</strong></div>`).join(''):'';
  }
  function validDiscordUrl(raw){try{const u=new URL(raw);return u.protocol==='https:'&&['discord.com','discordapp.com'].includes(u.hostname)&&u.pathname.startsWith('/channels/')?u.href:null;}catch{return null;}}
  function renderHistory(rows){
    let matches=rows;
    const q=state.query.toLocaleLowerCase(state.lang==='ru'?'ru-RU':'en-US');
    if(q)matches=matches.filter(m=>[m.map,m.difficulty,m.result,m.id].join(' ').toLocaleLowerCase(state.lang==='ru'?'ru-RU':'en-US').includes(q));
    const sortKey={pearls:'pearls',damage:'damage',kills:'kills',duration:'duration_seconds'}[state.sort];
    if(sortKey)matches=[...matches].sort((a,b)=>(numeric(b,sortKey)??-1)-(numeric(a,sortKey)??-1)||Date.parse(b.timestamp)-Date.parse(a.timestamp));
    const visible=matches.slice(0,state.visible);
    $('historyBody').innerHTML=visible.length?visible.map(m=>{
      const url=validDiscordUrl(m.url),win=m.result==='Victory',lose=m.result==='Defeat';
      return `<tr><td>${escape(prettyDate(m.timestamp))}</td><td><span class="match-map" title="${escape(m.map||t('unknownMap'))}">${escape(m.map||t('unknownMap'))}</span><span class="match-sub">${escape(m.difficulty||t('unknownDifficulty'))} · ${escape(t('wave'))} ${escape(m.wave??'—')}</span></td><td><span class="result-tag ${lose?'defeat':!win?'unknown':''}">${escape(t(win?'victory':lose?'defeat':'unknown'))}</span></td><td class="numeric">${escape(duration(numeric(m,'duration_seconds')))}</td><td class="numeric cell-strong">${m.pearls==null?'—':num(m.pearls)}</td><td class="numeric">${m.kills==null?'—':num(m.kills)}</td><td class="numeric" title="${m.damage==null?'':num(m.damage)}">${m.damage==null?'—':short(m.damage)}</td><td>${url?`<a class="table-link" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(t('view'))} ${ICON('external')}</a>`:'—'}</td></tr>`;
    }).join(''):`<tr><td colspan="8" class="no-results">${escape(t('noSearch'))}</td></tr>`;
    $('historyCount').textContent=`${t('shown')} ${num(visible.length)} ${t('of')} ${num(matches.length)} ${t('sessions')}`;
    $('loadMore').hidden=visible.length>=matches.length;
  }
  function render(){
    if(!state.payload)return;
    const all=allMatches(),rows=selectedMatches();
    $('emptyState').hidden=rows.length>0;$('dataContent').hidden=rows.length===0;
    updateFilters();
    if(!rows.length){
      
      $('emptyTitle').textContent=all.length?t('noMatchesTitle'):t('readyTitle');
      $('emptyDescription').textContent=all.length?t('noMatchesDesc'):t('readyDesc');
      $('emptyReset').hidden=!all.length;
      $('emptyDemo').hidden=!!all.length||demo;
      return;
    }
    renderKPIs(rows);renderChart(rows);renderMaps(rows);renderResources();renderExtra(rows);renderHistory(rows);
  }
  function updateSourceStatus(error=false){
    const available=allMatches().length>0;
    $('sourceStatus').textContent=error?t('offline'):demo?t('demo'):available?t('connected'):t('awaiting');
    $('sourcePip').className=`status-pip ${error?'offline':available||demo?'connected':''}`;
    $('syncIndicator').classList.toggle('has-error',error);
    const pip=$('syncIndicator').querySelector('.sync-light');pip.className=`sync-light ${error?'offline':available||demo?'connected':''}`;
  }
  function updateUpdatedAt(){
    if(demo){$('syncTime').textContent=t('preview');return;}
    const time=state.payload?.generated_at;
    if(!time){$('syncTime').textContent=t('dataNone');return;}
    const minutes=(Date.now()-Date.parse(time))/6e4;
    $('syncTime').textContent=`${minutes>18?t('stale'):t('updated')}: ${prettyDate(time)}`;
  }
  let toastTimer;
  function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3100);}
  function exportCsv(){
    const rows=selectedMatches();if(!rows.length){toast(t('noExport'));return;}
    const resourceKeys=[...new Set(rows.flatMap(m=>Object.keys(m.resources||{})))].sort();
    const header=['timestamp_utc','map','difficulty','result','duration_seconds','pearls','xp','kills','damage','wave',...resourceKeys,'discord_url'];
    const csvSafe=(x)=>{const raw=String(x??'');const guarded=/^[=+\-@\t\r]/.test(raw)?"'"+raw:raw;return `"${guarded.replace(/"/g,'""')}"`;};
    const content=[header.join(','),...rows.map(m=>[m.timestamp,m.map,m.difficulty,m.result,m.duration_seconds,m.pearls,m.xp,m.kills,m.damage,m.wave,...resourceKeys.map(k=>m.resources?.[k]??''),m.url].map(csvSafe).join(','))].join('\r\n');
    const blob=new Blob(['\ufeff'+content],{type:'text/csv;charset=utf-8;'});const link=URL.createObjectURL(blob);const a=document.createElement('a');a.href=link;a.download=`aa-analytics-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(link),2000);toast(t('exportDone'));
  }
  async function refreshData(silent=false){
    if(state.loading)return;state.loading=true;$('refreshBtn').classList.add('spinning');
    try{
      const path=demo?'./data/demo.json':'./data/stats.json';
      const response=await fetch(`${path}?v=${Date.now()}`,{cache:'no-store'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json();
      if(!data||!Array.isArray(data.matches))throw new Error('Invalid JSON schema');
      // Detect a modified match even if the match count stayed the same.
      const changed=JSON.stringify(data)!==JSON.stringify(state.payload);
      state.payload=data;if(changed){setOptions();render();}
      updateSourceStatus();updateUpdatedAt();
      if(!silent)toast(changed?t('dataUpdated'):t('dataChecked'));
    }catch(err){
      console.error('AA Analytics data request failed:',err);
      updateSourceStatus(true);$('syncTime').textContent=t('dataError');
      if(!silent){toast(t('dataError'));if(!state.payload){$('emptyState').hidden=false;$('dataContent').hidden=true;$('emptyTitle').textContent=t('errorTitle');$('emptyDescription').textContent=t('errorDesc');$('emptyReset').hidden=true;}}
    }finally{state.loading=false;$('refreshBtn').classList.remove('spinning');}
  }
  function setup(){
    document.documentElement.dataset.theme=state.theme;
    applyStaticLanguage();
    $('demoBanner').hidden=!demo;
    document.querySelectorAll('[data-period]').forEach(btn=>btn.addEventListener('click',()=>{state.period=btn.dataset.period;state.start='';state.end='';state.visible=10;$('datePopover').hidden=true;render();}));
    $('mapFilter').addEventListener('change',e=>{state.map=e.target.value;state.visible=10;render();});
    $('difficultyFilter').addEventListener('change',e=>{state.difficulty=e.target.value;state.visible=10;render();});
    $('customDateToggle').addEventListener('click',()=>{$('datePopover').hidden=!$('datePopover').hidden;if(!$('datePopover').hidden)$('startDate').focus();});
    $('dateApply').addEventListener('click',()=>{
      const start=$('startDate').value,end=$('endDate').value;
      if(start&&end&&start>end){$('dateError').textContent=t('dateInvalid');return;}
      $('dateError').textContent='';state.start=start;state.end=end;
      if(start||end)state.period='custom';else if(state.period==='custom')state.period='7d';
      state.visible=10;$('datePopover').hidden=true;render();
    });
    $('resetFilters').addEventListener('click',resetFilters);$('emptyReset').addEventListener('click',resetFilters);
    document.addEventListener('pointerdown',e=>{if(!$('datePopover').hidden&&!$('datePopover').contains(e.target)&&!$('customDateToggle').contains(e.target))$('datePopover').hidden=true;});
    document.querySelectorAll('[data-metric]').forEach(btn=>btn.addEventListener('click',()=>{state.metric=btn.dataset.metric;document.querySelectorAll('[data-metric]').forEach(b=>b.classList.toggle('active',b===btn));if(state.payload)renderChart(selectedMatches());}));
    $('historySearch').addEventListener('input',e=>{state.query=e.target.value.trim();state.visible=10;if(state.payload)renderHistory(selectedMatches());});
    $('historySort').addEventListener('change',e=>{state.sort=e.target.value;if(state.payload)renderHistory(selectedMatches());});
    $('loadMore').addEventListener('click',()=>{state.visible+=10;renderHistory(selectedMatches());});
    $('exportBtn').addEventListener('click',exportCsv);
    $('refreshBtn').addEventListener('click',()=>refreshData(false));
    $('themeBtn').addEventListener('click',animateTheme);
    $('languageBtn').addEventListener('click',()=>{state.lang=state.lang==='ru'?'en':'ru';storage.set('aa-language',state.lang);applyStaticLanguage();setOptions();if(state.payload)render();});
    const closeMenu=()=>{$('sidebar').classList.remove('open');$('sidebarShade').hidden=true;$('menuButton').setAttribute('aria-expanded','false');};
    $('menuButton').addEventListener('click',()=>{const open=!$('sidebar').classList.contains('open');$('sidebar').classList.toggle('open',open);$('sidebarShade').hidden=!open;$('menuButton').setAttribute('aria-expanded',String(open));});
    $('sidebarShade').addEventListener('click',closeMenu);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();$('datePopover').hidden=true;}});
    document.querySelectorAll('[data-nav]').forEach(a=>a.addEventListener('click',()=>{closeMenu();setTimeout(updateNav,30);}));
    window.addEventListener('hashchange',updateNav);
    updateFilters();updateSourceStatus();updateUpdatedAt();
    refreshData(true);
    if(!demo)setInterval(()=>{updateUpdatedAt();if(!document.hidden)refreshData(true);},60_000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!demo)refreshData(true);});
  }
  setup();
})();
