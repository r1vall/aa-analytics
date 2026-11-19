import unittest
from datetime import datetime, timezone
from types import SimpleNamespace

from scripts.parser import make_payload, parse_match


def build_message(message_id=1, reward="+55 XP\n+7,084 Summer Pearls", match="🏆 Victory - 00:32:13 - Wave 50\nVirtual Dungeon Summer Hunt - Hard\n299 kills - 616,697,559 dmg"):
    return SimpleNamespace(
        id=message_id,
        created_at=datetime(2026, 11, 19, 10, 21, tzinfo=timezone.utc),
        content="",
        embeds=[SimpleNamespace(title="Anime Adventures", description=None, fields=[
            SimpleNamespace(name="Player Stats", value="<:gems:123456> 4,367\n<:unknown:9876> 83,292\n<:traitreroll:3456> 17,296\n<:other:4567> 0"),
            SimpleNamespace(name="Rewards", value=reward),
            SimpleNamespace(name="Portals", value="Divine Treasure Portal x1\nSky Portal x39"),
            SimpleNamespace(name="Units", value="[4] Water Goddess (Holy) = 92 ⚔️ - [Upg 8/8]"),
            SimpleNamespace(name="Match Result", value=match),
        ])],
        jump_url=f"https://discord.com/channels/111/222/{message_id}",
    )


class TestParser(unittest.TestCase):
    def test_screenshot_example(self):
        match = parse_match(build_message())
        self.assertEqual(match["pearls"], 7084)
        self.assertEqual(match["xp"], 55)
        self.assertEqual(match["duration_seconds"], 1933)
        self.assertEqual(match["kills"], 299)
        self.assertEqual(match["damage"], 616697559)
        self.assertEqual(match["wave"], 50)
        self.assertEqual(match["map"], "Virtual Dungeon Summer Hunt")
        self.assertEqual(match["difficulty"], "Hard")
        self.assertEqual(match["resources"]["gems"], 4367)
        self.assertEqual(match["resources"]["slot_2"], 83292)
        self.assertEqual(match["resources"]["trait_reroll_tokens"], 17296)

    def test_second_match(self):
        match = parse_match(build_message(2, "+55 XP\n+9,768 Summer Pearls", "🏆 Victory - 00:27:27 - Wave 50\nHellish City Summer Hunt - Hard\n636 kills - 3,783,336,191 dmg"))
        self.assertEqual(match["pearls"], 9768)
        self.assertEqual(match["duration_seconds"], 1647)
        self.assertEqual(match["damage"], 3783336191)

    def test_extra_named_rewards(self):
        m = parse_match(build_message(reward="+7,084 Summer Pearls\n+3 Trait Reroll Tokens\n+25 Star Remnants\n+18 Gems"))
        self.assertEqual(m["extra_rewards"], {"gems": 18, "trait_reroll_tokens": 3, "star_remnants": 25})

    def test_no_premium_rewards_but_match(self):
        match = parse_match(build_message(3, "+55 XP", "Defeat - 00:02:00 - Wave 8\nMap X - Normal\n9 kills - 300 dmg"))
        self.assertIsNone(match["pearls"])
        self.assertEqual(match["result"], "Defeat")

    def test_ignores_non_matches(self):
        msg = build_message()
        msg.embeds[0].fields = [SimpleNamespace(name="Other", value="ping hello")]
        self.assertIsNone(parse_match(msg))

    def test_payload_order(self):
        a = parse_match(build_message(1))
        b = parse_match(build_message(2))
        payload = make_payload([b, a], 15, "2026-11-19T10:00:00Z")
        self.assertEqual([v["id"] for v in payload["matches"]], ["1", "2"])
        self.assertEqual(payload["scan"]["messages_scanned"], 15)

if __name__ == "__main__":
    unittest.main()
