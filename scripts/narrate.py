"""Render a blog post's narration with ElevenLabs (Eleven v4) or Fish Audio (Drama 3).

Usage:
  ELEVENLABS_API_KEY=... python3 scripts/narrate.py <slug> [section ...]
  FISH_API_KEY=... python3 scripts/narrate.py --provider fish <slug> [section ...]

The script reads narration/<slug>.txt and renders each "## <id>" section that has
no take yet into narration/.takes/<slug>/<provider>/<id>.wav. Sections named on
the command line are rendered again. It then joins every section with a short
silence, normalizes loudness and writes public/audio/blog/<slug>.mp3.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
import wave
from pathlib import Path

# Each provider reads every post in one voice. A Fish voice id is the end of the
# voice's URL on fish.audio (fish.audio/m/<id>). An ElevenLabs voice id is on the
# voice's page in the ElevenLabs voice library.
ELEVENLABS_VOICE_ID = ""
FISH_VOICE_ID = ""

ELEVENLABS_MODEL = "eleven_v4"
ELEVENLABS_MAX_CHARS = 10_000
FISH_MODEL = "drama-3"
RATE = 44100

ROOT = Path(__file__).resolve().parent.parent
NARRATION = ROOT / "narration"
TAKES = NARRATION / ".takes"
AUDIO_OUT = ROOT / "public" / "audio" / "blog"
SECTION_GAP_SECONDS = 1.2
EDGE_SECONDS = 0.5
COMMENT = re.compile(r"<!--.*?-->", re.S)
HEADER = re.compile(r"^## ([a-z0-9-]+)\s*$")
PAIRED_TAG = re.compile(r"<([a-z]+)>(.*?)</\1>", re.S)
# Eleven v4 ignores paired tags, so each one becomes a bracket cue before its words.
ELEVENLABS_CUES = {
    "emphasis": "emphasized",
    "slow": "slowly",
    "whisper": "whispers",
    "soft": "softly",
    "fast": "quickly",
    "stress": "stressed",
    "forceful": "forcefully",
}


def parse_script(text: str) -> list[tuple[str, str]]:
    """Split a narration script into (section id, text) pairs, in order."""
    sections: list[tuple[str, list[str]]] = []
    for line in COMMENT.sub("", text).splitlines():
        header = HEADER.match(line)
        if header:
            if any(sid == header.group(1) for sid, _ in sections):
                raise ValueError(f"section '{header.group(1)}' appears twice")
            sections.append((header.group(1), []))
        elif line.strip():
            if not sections:
                raise ValueError(f"text before the first '## <id>' header: {line.strip()!r}")
            sections[-1][1].append(line.strip())
    return [(sid, "\n".join(lines)) for sid, lines in sections]


def for_elevenlabs(text: str) -> str:
    """Rewrite Drama 3 paired tags as the bracket cues Eleven v4 reads."""

    def cue(match: re.Match) -> str:
        if match.group(1) not in ELEVENLABS_CUES:
            raise ValueError(f"no ElevenLabs cue for <{match.group(1)}>")
        return f"[{ELEVENLABS_CUES[match.group(1)]}] {match.group(2)}"

    return PAIRED_TAG.sub(cue, text)


def join_wavs(takes: list[Path], out: Path, gap: float, edge: float) -> None:
    """Write the takes back to back, with gap seconds between them and edge seconds at each end."""
    if not takes:
        raise ValueError("no takes to join")
    params, frames = None, []
    for take in takes:
        with wave.open(str(take)) as w:
            if params and w.getparams()[:3] != params[:3]:
                raise ValueError(f"{take.name} differs in channels, sample width or rate from the first take")
            params = params or w.getparams()
            frames.append(w.readframes(w.getnframes()))
    assert params
    channels, width, rate = params[:3]
    silence = lambda seconds: b"\x00" * int(seconds * rate) * channels * width
    with wave.open(str(out), "wb") as w:
        w.setnchannels(channels)
        w.setsampwidth(width)
        w.setframerate(rate)
        w.writeframes(silence(edge) + silence(gap).join(frames) + silence(edge))


def post(url: str, body: dict, headers: dict) -> bytes:
    request = urllib.request.Request(
        url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", **headers}
    )
    try:
        with urllib.request.urlopen(request, timeout=900) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        sys.exit(f"{url} returned {error.code}: {error.read().decode(errors='replace')}")


def elevenlabs(text: str, key: str, out: Path) -> None:
    """Render one section with Eleven v4 into a WAV file at out."""
    text = for_elevenlabs(text)
    if len(text) > ELEVENLABS_MAX_CHARS:
        sys.exit(f"{out.stem} has {len(text)} characters, over Eleven v4's {ELEVENLABS_MAX_CHARS}, so split it")
    # MP3 works on every plan, while 44.1 kHz PCM needs the Pro plan. ffmpeg decodes it for joining.
    mp3 = post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128",
        {"text": text, "model_id": ELEVENLABS_MODEL},
        {"xi-api-key": key},
    )
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "mp3", "-i", "pipe:", "-ac", "1", "-ar", str(RATE), str(out)],
        input=mp3,
        check=True,
    )


def fish(text: str, key: str, out: Path) -> None:
    """Render one section with Drama 3 into a WAV file at out."""
    # Raw PCM avoids the placeholder length that a streamed WAV header carries.
    pcm = post(
        "https://api.fish.audio/v1/tts",
        {"text": text, "reference_id": FISH_VOICE_ID, "format": "pcm", "sample_rate": RATE, "latency": "normal"},
        {"Authorization": f"Bearer {key}", "model": FISH_MODEL},
    )
    with wave.open(str(out), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm)


PROVIDERS = {
    "elevenlabs": (elevenlabs, "ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID", lambda: ELEVENLABS_VOICE_ID),
    "fish": (fish, "FISH_API_KEY", "FISH_VOICE_ID", lambda: FISH_VOICE_ID),
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--provider", choices=PROVIDERS, default="elevenlabs")
    parser.add_argument("slug")
    parser.add_argument("sections", nargs="*", help="sections to render again")
    args = parser.parse_args()

    render, key_name, voice_name, voice = PROVIDERS[args.provider]
    key = os.environ.get(key_name)
    if not key:
        sys.exit(f"set {key_name} to your API key")
    if not voice():
        sys.exit(f"set {voice_name} in scripts/narrate.py to the voice you picked")

    sections = parse_script((NARRATION / f"{args.slug}.txt").read_text())
    unknown = set(args.sections) - {sid for sid, _ in sections}
    if unknown:
        sys.exit(f"no such section: {', '.join(sorted(unknown))}")

    takes = TAKES / args.slug / args.provider
    takes.mkdir(parents=True, exist_ok=True)
    for sid, text in sections:
        take = takes / f"{sid}.wav"
        if sid in args.sections or not take.exists():
            print(f"rendering {sid} ({len(text)} chars) with {args.provider}")
            render(text, key, take)

    joined = takes / "_joined.wav"
    join_wavs([takes / f"{sid}.wav" for sid, _ in sections], joined, SECTION_GAP_SECONDS, EDGE_SECONDS)
    AUDIO_OUT.mkdir(parents=True, exist_ok=True)
    out = AUDIO_OUT / f"{args.slug}.mp3"
    # loudnorm targets -16 LUFS, the usual level for spoken-word podcasts.
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(joined),
         "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ac", "1", "-ar", str(RATE), "-b:a", "96k", str(out)],
        check=True,
    )
    print(f"wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
