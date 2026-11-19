"""Read Discord channel webhook match embeds and publish static dashboard JSON.

Environment: DISCORD_BOT_TOKEN, DISCORD_CHANNEL_ID, optional DISCORD_WEBHOOK_ID.
Output path: site/data/stats.json. This runs in GitHub Actions, not the browser.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import discord

try:
    from scripts.parser import make_payload, parse_match
except ModuleNotFoundError:
    from parser import make_payload, parse_match

OUTPUT = Path(__file__).resolve().parents[1] / "site" / "data" / "stats.json"


async def collect() -> None:
    token = os.getenv("DISCORD_BOT_TOKEN", "").strip()
    channel_id = os.getenv("DISCORD_CHANNEL_ID", "").strip()
    webhook_id = os.getenv("DISCORD_WEBHOOK_ID", "").strip()
    if not token or not channel_id.isdecimal() or (webhook_id and not webhook_id.isdecimal()):
        sys.exit("Missing secrets: DISCORD_BOT_TOKEN and numeric DISCORD_CHANNEL_ID required")

    intents = discord.Intents.none()
    intents.guilds = True
    intents.message_content = True
    client = discord.Client(intents=intents)
    finished = asyncio.Event()
    captured_error: Exception | None = None

    @client.event
    async def on_ready() -> None:
        nonlocal captured_error
        try:
            channel = await client.fetch_channel(int(channel_id))
            if not hasattr(channel, "history"):
                raise RuntimeError("This Discord channel has no message history")
            matches = []
            checked = 0
            print("Scanning Discord webhook messages…")
            async for msg in channel.history(limit=None, oldest_first=True):
                checked += 1
                if msg.webhook_id is None:
                    continue
                if webhook_id and int(msg.webhook_id) != int(webhook_id):
                    continue
                item = parse_match(msg)
                if item:
                    matches.append(item)
            payload = make_payload(matches, checked, datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"))
            if not matches:
                print("WARNING: zero matches. Verify View Channel, Read Message History, Message Content Intent and webhook ID.")
                # Prevent silently wiping a previously populated dashboard.
                prior = json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else {}
                if prior.get("matches"):
                    raise RuntimeError("No matches returned; refusing to replace previously populated dashboard")
            OUTPUT.parent.mkdir(parents=True, exist_ok=True)
            OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            print(f"Messages scanned: {checked:,}; games: {len(matches):,}; Summer Pearls: {sum(m['pearls'] or 0 for m in matches):,}")
            print(f"Wrote {OUTPUT}")
        except Exception as exc:
            captured_error = exc
        finally:
            finished.set()
            await client.close()

    try:
        async with client:
            await client.start(token, reconnect=False)
            await finished.wait()
    except discord.PrivilegedIntentsRequired as exc:
        raise RuntimeError("Enable Message Content Intent in Discord Developer Portal > Bot") from exc
    if captured_error:
        raise captured_error


if __name__ == "__main__":
    try:
        asyncio.run(collect())
    except (discord.DiscordException, RuntimeError) as exc:
        sys.exit(f"Sync failed: {exc}")
