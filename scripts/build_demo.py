"""Generate a clearly labelled, deterministic synthetic preview dataset."""
from __future__ import annotations
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

random.seed(47)
now = datetime.now(timezone.utc)
maps = ["Virtual Dungeon Summer Hunt", "Hellish City Summer Hunt", "Ice Fortress", "Forgotten Capital", "Spirit Sanctuary"]
units = ["Water Goddess (Holy)", "Abyssal Eel", "Rudo (Prodigy)", "Izo (Samurai)", "Elfy (Sylph)"]
matches = []
for i in range(164):
    days_ago = random.random() * 38
    when = now - timedelta(days=days_ago, hours=random.random() * 7)
    duration = random.randint(19 * 60, 36 * 60)
    won = random.random() > .08
    k = random.randint(200, 780) if won else random.randint(45, 280)
    pr = round(random.uniform(5200, 11100)) if won else random.randint(0, 1700)
    m = random.choices(maps, weights=[43, 37, 12, 5, 3])[0]
    resources = {"gems": 3300 + i * 11, "gold": 77300 + i * 54, "trait_reroll_tokens": 58 + i // 7, "star_remnants": 14300 + i * 8}
    matches.append({
        "id": str(100000000 + i),
        "timestamp": when.isoformat().replace("+00:00", "Z"),
        "pearls": pr,
        "xp": 55 if won else 17,
        "duration_seconds": duration,
        "kills": k,
        "damage": random.randint(600_000_000, 5_400_000_000),
        "wave": 50 if won else random.randint(9, 40),
        "result": "Victory" if won else "Defeat",
        "map": m,
        "difficulty": random.choices(["Hard", "Normal", "Nightmare"], weights=[75, 12, 13])[0],
        "extra_rewards": ({"trait_reroll_tokens": 2} if i % 11 == 0 else {"star_remnants": 6} if i % 13 == 0 else {}),
        "resources": resources,
        "resource_labels": {"gems": "Gems", "gold": "Gold", "trait_reroll_tokens": "Trait Reroll Tokens", "star_remnants": "Star Remnants"},
        "units": [random.choice(units)],
        "portals": ["Sky Portal x39"],
        "url": "",
    })
matches.sort(key=lambda item: item["timestamp"])
payload = {"schema_version": 1, "generated_at": now.isoformat().replace("+00:00", "Z"), "is_demo": True, "scan": {"messages_scanned": 706, "matches": len(matches)}, "matches": matches}
output = Path(__file__).resolve().parents[1] / "site" / "data" / "demo.json"
output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(output)
