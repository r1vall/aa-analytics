"""Pure parsing helpers for Anime Adventures Discord webhook match embeds.

No Discord credentials are read here. Unrecognized resources are kept as
numbered slots rather than assigned possibly incorrect game-item names.
"""
from __future__ import annotations

import re
from datetime import timezone
from typing import Any

NUMBER = r"([0-9][0-9,]*)"
PEARLS_RE = re.compile(r"\+\s*" + NUMBER + r"\s*Summer\s+Pearls\b", re.I)
XP_RE = re.compile(r"\+\s*" + NUMBER + r"\s*XP\b", re.I)
KILLS_RE = re.compile(r"\b" + NUMBER + r"\s*kills?\b", re.I)
DAMAGE_RE = re.compile(r"\b" + NUMBER + r"\s*(?:dmg|damage)\b", re.I)
WAVE_RE = re.compile(r"\bWave\s*(\d+)\b", re.I)
DURATION_RE = re.compile(r"\b(\d{1,3}):(\d{2}):(\d{2})\b")
RESULT_RE = re.compile(r"\b(Victory|Defeat|Loss|Lost|Win|Failed|Failure|Completed)\b", re.I)
CUSTOM_EMOJI_RE = re.compile(r"<a?:([\w-]+):\d+>")
EMOJI_NAME_MAP = {
    "gem": "gems", "diamond": "gems", "gold": "gold", "coin": "gold",
    "trait": "trait_reroll_tokens", "reroll": "trait_reroll_tokens",
    "remnant": "star_remnants", "starremnant": "star_remnants",
}
EXTRA_REWARD_PATTERNS = {
    "gems": re.compile(r"\+\s*" + NUMBER + r"\s+Gems?\b", re.I),
    "trait_reroll_tokens": re.compile(r"\+\s*" + NUMBER + r"\s+Trait\s+(?:Reroll\s+)?Tokens?\b", re.I),
    "star_remnants": re.compile(r"\+\s*" + NUMBER + r"\s+Star\s+Remnants?\b", re.I),
    "gold": re.compile(r"\+\s*" + NUMBER + r"\s+Gold\b", re.I),
}
RESOURCE_LABELS = {
    "gems": "Gems", "gold": "Gold", "trait_reroll_tokens": "Trait Reroll Tokens",
    "star_remnants": "Star Remnants", "summer_pearls": "Summer Pearls",
}


def to_number(value: str | None) -> int | None:
    return int(value.replace(",", "")) if value is not None else None


def clean(text: Any) -> str:
    text = str(text or "")
    text = re.sub(r"\*\*|__|~~|`", "", text)
    return text.replace("\u200b", "").strip()


def get_sections(message: Any) -> dict[str, str]:
    result: dict[str, list[str]] = {}
    for embed in getattr(message, "embeds", []) or []:
        for field in getattr(embed, "fields", []) or []:
            name = clean(getattr(field, "name", "")).casefold()
            if name:
                result.setdefault(name, []).append(clean(getattr(field, "value", "")))
    return {key: "\n".join(value) for key, value in result.items()}


def get_part(sections: dict[str, str], key: str) -> str:
    return "\n".join(value for name, value in sections.items() if key in name)


def get_all_text(message: Any, sections: dict[str, str]) -> str:
    pieces = [clean(getattr(message, "content", ""))]
    for embed in getattr(message, "embeds", []) or []:
        for attr in ("title", "description"):
            value = getattr(embed, attr, "")
            if value:
                pieces.append(clean(value))
    pieces.extend(sections.values())
    return "\n".join(pieces)


def duration_to_seconds(value: str) -> int | None:
    found = DURATION_RE.search(value)
    if not found:
        return None
    h, m, s = map(int, found.groups())
    if m >= 60 or s >= 60:
        return None
    return h * 3600 + m * 60 + s


def parse_resources(stats_text: str) -> tuple[dict[str, int], dict[str, str]]:
    """Extract consecutive Player Stats numeric rows; stable index-based keys.

    The same slot always refers to the same Player Stats row. We only use a
    semantic key if a Discord custom emoji *unambiguously* supplies its name.
    """
    resources: dict[str, int] = {}
    labels: dict[str, str] = {}
    slot = 0
    for line in stats_text.splitlines():
        line = clean(line).strip("| ")
        # player-stats rows look like '<:gems:123> 4,367', or '💎 4,367'
        match = re.fullmatch(r"(?P<icon>.*?)\s*(?P<count>\d[\d,]*)\s*", line)
        if not match or not match.group("icon").strip():
            continue
        icon, count = match.group("icon"), match.group("count")
        # Never include rewards (+55 etc.) in a balance snapshot.
        if "+" in icon or len(icon) > 90:
            continue
        slot += 1
        emoji_match = CUSTOM_EMOJI_RE.search(icon)
        emoji_name = (emoji_match.group(1) if emoji_match else "").lower()
        recognized = next((label for word, label in EMOJI_NAME_MAP.items() if word in emoji_name), None)
        key = recognized if recognized and recognized not in resources else f"slot_{slot}"
        resources[key] = to_number(count) or 0
        labels[key] = RESOURCE_LABELS.get(key, f"Resource {slot}")
    return resources, labels


def parse_match(message: Any) -> dict[str, Any] | None:
    sections = get_sections(message)
    combined = get_all_text(message, sections)
    pearl_match = PEARLS_RE.search(combined)
    match_text = get_part(sections, "match result")
    result_match = RESULT_RE.search(match_text)
    # Require actual game evidence: other bot announcements may contain XP.
    if not pearl_match and not (match_text and result_match):
        return None

    reward_text = get_part(sections, "reward") or combined
    # Be resilient if a webhook uses a different arrangement.
    pearl_match = PEARLS_RE.search(reward_text) or pearl_match
    xp_match = XP_RE.search(reward_text) or XP_RE.search(combined)
    result_match = RESULT_RE.search(match_text or combined)
    kills_match = KILLS_RE.search(match_text or combined)
    damage_match = DAMAGE_RE.search(match_text or combined)
    wave_match = WAVE_RE.search(match_text or combined)
    duration = duration_to_seconds(match_text or combined)

    extra_rewards = {}
    for name, pattern in EXTRA_REWARD_PATTERNS.items():
        found = pattern.search(reward_text)
        if found:
            extra_rewards[name] = to_number(found.group(1))

    result = None
    if result_match:
        result = "Victory" if result_match.group(1).casefold() in {"win", "victory", "completed"} else "Defeat"

    map_name: str | None = None
    difficulty: str | None = None
    # The mode appears on the line following Victory - 00:27:27 - Wave 50.
    for raw_line in match_text.splitlines():
        line = clean(raw_line).strip()
        if not line or RESULT_RE.search(line) or KILLS_RE.search(line) or DAMAGE_RE.search(line):
            continue
        if " - " in line:
            candidate_map, candidate_difficulty = line.rsplit(" - ", 1)
            if candidate_map.strip() and candidate_difficulty.strip():
                map_name, difficulty = candidate_map.strip(), candidate_difficulty.strip()
                break

    resources, resource_labels = parse_resources(get_part(sections, "player stats"))
    units = [clean(line) for line in get_part(sections, "units").splitlines() if clean(line)]
    portals = [clean(line) for line in get_part(sections, "portal").splitlines() if clean(line)]

    at = message.created_at
    if at.tzinfo is None:
        at = at.replace(tzinfo=timezone.utc)
    at = at.astimezone(timezone.utc)
    return {
        "id": str(message.id),
        "timestamp": at.isoformat().replace("+00:00", "Z"),
        "pearls": to_number(pearl_match.group(1)) if pearl_match else None,
        "xp": to_number(xp_match.group(1)) if xp_match else None,
        "duration_seconds": duration,
        "kills": to_number(kills_match.group(1)) if kills_match else None,
        "damage": to_number(damage_match.group(1)) if damage_match else None,
        "wave": int(wave_match.group(1)) if wave_match else None,
        "result": result,
        "map": map_name,
        "difficulty": difficulty,
        "extra_rewards": extra_rewards,
        "resources": resources,
        "resource_labels": resource_labels,
        "units": units,
        "portals": portals,
        "url": str(getattr(message, "jump_url", "")),
    }


def make_payload(matches: list[dict[str, Any]], messages_scanned: int, generated_at: str) -> dict[str, Any]:
    matches = sorted(matches, key=lambda m: (m["timestamp"], m["id"]))
    # This data describes games; balances are instantaneous snapshots, not sums.
    return {
        "schema_version": 1,
        "generated_at": generated_at,
        "scan": {"messages_scanned": messages_scanned, "matches": len(matches)},
        "matches": matches,
    }
