"""Checks for narrate.py. Run with: python3 -m unittest discover -s scripts -p 'test_*.py'"""

import tempfile
import unittest
import wave
from pathlib import Path

from narrate import for_elevenlabs, join_wavs, parse_script

SCRIPT = """<!--
A header comment that spans
several lines.
-->

## demo
First line. [pause]
<emphasis>Second</emphasis> line.

## science
<!-- an inline note --> Only line.
"""


def write_tone(path: Path, seconds: float, rate: int = 8000) -> None:
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(b"\x01\x00" * int(seconds * rate))


class ParseScriptTest(unittest.TestCase):
    def test_sections_keep_their_order_and_ids(self):
        self.assertEqual([sid for sid, _ in parse_script(SCRIPT)], ["demo", "science"])

    def test_comments_are_dropped_and_tags_kept(self):
        sections = dict(parse_script(SCRIPT))
        self.assertEqual(sections["demo"], "First line. [pause]\n<emphasis>Second</emphasis> line.")
        self.assertEqual(sections["science"], "Only line.")

    def test_text_before_the_first_section_is_rejected(self):
        with self.assertRaises(ValueError):
            parse_script("Stray text.\n## demo\nLine.")

    def test_duplicate_section_ids_are_rejected(self):
        with self.assertRaises(ValueError):
            parse_script("## demo\nOne.\n## demo\nTwo.")


class ForElevenLabsTest(unittest.TestCase):
    def test_paired_tags_become_bracket_cues(self):
        self.assertEqual(
            for_elevenlabs("It's <emphasis>correctly wrong</emphasis>. <slow>It's in mine.</slow>"),
            "It's [emphasized] correctly wrong. [slowly] It's in mine.",
        )

    def test_bracket_cues_pass_through(self):
        self.assertEqual(for_elevenlabs("[pause] Was it complete? [wry]"), "[pause] Was it complete? [wry]")

    def test_unknown_paired_tags_are_rejected(self):
        with self.assertRaises(ValueError):
            for_elevenlabs("<shout>no</shout>")


class JoinWavsTest(unittest.TestCase):
    def test_sections_are_joined_with_gaps_and_edges(self):
        with tempfile.TemporaryDirectory() as tmp:
            a, b, out = Path(tmp, "a.wav"), Path(tmp, "b.wav"), Path(tmp, "out.wav")
            write_tone(a, 0.5)
            write_tone(b, 0.25)
            join_wavs([a, b], out, gap=1.0, edge=0.5)
            with wave.open(str(out)) as w:
                # 0.5 edge + 0.5 take + 1.0 gap + 0.25 take + 0.5 edge
                self.assertEqual(w.getnframes(), int(2.75 * 8000))
                self.assertEqual(w.getframerate(), 8000)

    def test_takes_with_different_formats_are_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            a, b = Path(tmp, "a.wav"), Path(tmp, "b.wav")
            write_tone(a, 0.1, rate=8000)
            write_tone(b, 0.1, rate=16000)
            with self.assertRaises(ValueError):
                join_wavs([a, b], Path(tmp, "out.wav"), gap=0, edge=0)


if __name__ == "__main__":
    unittest.main()
