# AA Analytics

A lightweight, minimalist performance dashboard for **Anime Adventures**. It reads the same Discord webhook embeds as your existing Summer Pearls script, adds match statistics and resource snapshots, then publishes an auto-updating website on **GitHub Pages**.

No database, paid server, Node.js setup, or frontend dependencies required.

## Features

- Summer Pearls earned, matches, played time, Pearls/hour, XP, kills, damage, win rate
- Comparison to previous 24-hour / 7-day / 30-day period
- Interactive Pearls / XP / Kills / Damage trend chart
- Match breakdown by map; latest resource balances
- Date, map, and difficulty filters; searchable sortable session table
- CSV export; mobile responsive interface; browser re-checks every 60 seconds
- Scheduled Discord history scan every **30 minutes** through GitHub Actions (schedule is best effort and may be delayed)
- Test preview via `?demo=1` with **clearly marked synthetic data**

**What “played time” means:** sum of recorded match durations. It excludes time in lobby, idle time and matches with missing durations. Hourly rates only use matches where both the metric and duration are reported.

**What balances mean:** the `Player Stats` block includes *snapshots*, not the amount earned in a match. The parser never adds snapshots together. Unknown icons are named `Resource 1`, etc., until configured. Summer Pearls and XP earned are taken from the `Rewards` block.

## 1. Revoke the leaked bot token

Your terminal screenshot contained the Discord bot token. Open [Discord Developer Portal](https://discord.com/developers/applications) → your application → **Bot** → **Reset Token**. Use only the new token below. **Never put a bot token in any uploaded code, HTML, JavaScript, JSON, or public repo.**

## 2. Upload to GitHub

1. Create a repository on GitHub. Set its default branch to `main`.
2. Upload **all files from this folder**, including the hidden `.github/workflows/pages.yml` file.
3. In GitHub, open **Settings → Secrets and variables → Actions → New repository secret**. Create these:

   | Secret | Value |
   | --- | --- |
   | `DISCORD_BOT_TOKEN` | Newly reset Discord bot token |
   | `DISCORD_CHANNEL_ID` | ID of your Discord results channel (numeric) |
   | `DISCORD_WEBHOOK_ID` | *(Optional)* Numeric ID of the webhook generating results; omit to include all webhooks in the channel |

4. The Discord bot must be in that server with **View Channel** and **Read Message History** permissions. In [Discord Developer Portal](https://discord.com/developers/applications) → **Bot**, enable **Message Content Intent** (same as your original Python script). Without it, embed fields may not be exposed to the bot.
5. Open **Settings → Pages → Build and deployment → Source: GitHub Actions**. This matters: the workflow deploys the generated `site/` artifact directly; it does **not** commit JSON to the repository.
6. Open **Actions → Update dashboard → Run workflow**. When finished, the deployed site URL appears under **Settings → Pages** and/or in the deployment workflow.

On `main` pushes, GitHub Actions also deploys the site. The schedule runs at **11 and 41 minutes past every UTC hour**, with possible delays during GitHub high load. To change refresh frequency, edit `.github/workflows/pages.yml` → `schedule.cron` (GitHub minimum is 5 minutes; free quotas may apply).

**Privacy:** GitHub Pages is publicly reachable and the generated site JSON exposes the parsed activity, resource balances and the Discord message links. Don't deploy personal/private data if you don't want it visible. GitHub repository secrets are *not* exported to the website.

## 3. Test locally on Windows

From the project root:

```bat
py -m pip install -r requirements.txt
set "DISCORD_BOT_TOKEN=YOUR_NEW_TOKEN"
set "DISCORD_CHANNEL_ID=YOUR_CHANNEL_ID"
py -m scripts.sync_discord
py -m http.server 8000 --directory site
```

Open:

- `http://localhost:8000/` — real data generated from your Discord channel
- `http://localhost:8000/?demo=1` — synthetic preview with full charts and filters

Set an optional webhook filter in the same Command Prompt with `set "DISCORD_WEBHOOK_ID=1234567890"`. Avoid sharing command screenshots with tokens.

**Do not double-click `index.html`** directly: browsers generally block the `fetch()` call for local `file://` paths. Use the HTTP server.

## 4. Name the resource icons accurately

Open `site/assets/config.js` and fill in labels corresponding to the *position* of each numeric resource under **Player Stats** in your Discord embed. For example:

```js
resourceLabels: {
  slot_1: 'Gems',
  slot_2: 'Gold',
  slot_3: 'Trait Reroll Tokens',
  slot_4: 'Star Remnants',
},
```

**These are examples, not verified identities of your screenshot icons.** First check the actual game resource icon labels. Where Discord custom emoji codes have descriptive names (e.g. `<:gems:123>`), the script automatically recognizes supported currencies. The dashboard uses the configured label if provided.

You can also change `title` and `timezone` in the same file (default `Europe/Kyiv`).

## 5. Troubleshooting

- **Actions reports missing secrets:** check each GitHub repository secret name, then select **Run workflow** again.
- **Bot cannot read messages:** verify channel ID, bot access, and the privileged Message Content Intent.
- **Dashboard shows zero matches:** confirm that messages are posted by a **webhook**, not a normal user/bot message; remove `DISCORD_WEBHOOK_ID` to test all webhooks. Verify the embed names (`Rewards`, `Player Stats`, `Match Result`).
- **Some metrics are `—`:** those values are absent or cannot be reliably parsed from the source message. The dashboard does not invent missing values.
- **Stats change in Discord but not on site:** wait for the scheduled Actions job and GitHub Pages deployment, or manually run **Update dashboard**. The in-browser 60-second fetch only sees the *latest published* file.
- **A message was edited/deleted:** the next scan reads full available history, so published statistics reflect the current available messages.
- **GitHub Pages not deployed:** use the **GitHub Actions** publishing source and check Actions logs; do not select “Deploy from branch” for this workflow.

## Files

```
.github/workflows/pages.yml     Scheduled updates + deployment to GitHub Pages
scripts/parser.py              Parse Discord messages into structured game data
scripts/sync_discord.py         Discord API ingestion
scripts/build_demo.py          Generate optional synthetic demo.json
site/index.html                Website structure
site/assets/styles.css         White minimalist visual design
site/assets/app.js             Filtering, statistics, charts and CSV export
site/assets/config.js          Optional inventory labels and timezone
site/data/stats.json           Empty starter; replaced during deployment
site/data/demo.json            Sample data for demo mode
requirements.txt               discord.py dependency
tests/test_parser.py           Parsing regression tests
```

To run tests:

```bat
py -m unittest discover -s tests -v
```

### Important GitHub Pages architecture note

GitHub explicitly states that commits made by a workflow's default `GITHUB_TOKEN` do **not** trigger a new Pages build when publishing from a branch. This project instead **deploys a fresh Pages artifact in the scheduled workflow**, avoiding that issue. See [GitHub Pages publishing documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [scheduled workflow event docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
