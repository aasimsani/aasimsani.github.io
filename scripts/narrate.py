"""Render a blog post's narration with Fish Audio's Drama 3 API.

Usage:
  FISH_API_KEY=... python3 scripts/narrate.py <slug> [section ...]

The script reads narration/<slug>.txt and renders each "## <id>" section that has
no take yet into narration/.takes/<slug>/<id>.wav. Sections named on the command
line are rendered again. It then joins every section with a short silence,
normalizes loudness and writes public/audio/blog/<slug>.mp3.
"""

import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
import wave
from pathlib import Path

API_URL = "https://api.fish.audio/v1/tts"
MODEL = "drama-3"
# The Fish Audio voice model every post is read in. Its id is the last part of
# the voice's URL on fish.audio, such as fish.audio/m/<id>.
VOICE_ID = ""

ROOT = Path(__file__).resolve().parent.parent
NARRATION = ROOT / "narration"
TAKES = NARRATION / ".takes"
AUDIO_OUT = ROOT / "public" / "audio" / "blog"
SECTION_GAP_SECONDS = 1.2
EDGE_SECONDS = 0.5
COMMENT = re.compile(r"<!--.*?-->", re.S)
HEADER = re.compile(r"^## ([a-z0-9-]+)\s*$")


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


def synthesize(text: str, key: str, out: Path) -> None:
    """Render one section into a WAV file at out."""
    # Raw PCM avoids the placeholder length that a streamed WAV header carries.
    body = {
        "text": text,
        "reference_id": VOICE_ID,
        "format": "pcm",
        "sample_rate": 44100,
        "latency": "normal",
    }
    request = urllib.request.Request(
        API_URL,
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json", "model": MODEL},
    )
    try:
        with urllib.request.urlopen(request, timeout=900) as response:
            pcm = response.read()
    except urllib.error.HTTPError as error:
        sys.exit(f"Fish Audio returned {error.code}: {error.read().decode(errors='replace')}")
    with wave.open(str(out), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(44100)
        w.writeframes(pcm)


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    slug, redo = sys.argv[1], sys.argv[2:]
    key = os.environ.get("FISH_API_KEY")
    if not key:
        sys.exit("set FISH_API_KEY to your Fish Audio API key")
    if not VOICE_ID:
        sys.exit("set VOICE_ID in scripts/narrate.py to the Fish Audio voice you picked")

    sections = parse_script((NARRATION / f"{slug}.txt").read_text())
    unknown = set(redo) - {sid for sid, _ in sections}
    if unknown:
        sys.exit(f"no such section: {', '.join(sorted(unknown))}")

    takes = TAKES / slug
    takes.mkdir(parents=True, exist_ok=True)
    for sid, text in sections:
        take = takes / f"{sid}.wav"
        if sid in redo or not take.exists():
            print(f"rendering {sid} ({len(text)} chars)")
            synthesize(text, key, take)

    joined = takes / "_joined.wav"
    join_wavs([takes / f"{sid}.wav" for sid, _ in sections], joined, SECTION_GAP_SECONDS, EDGE_SECONDS)
    AUDIO_OUT.mkdir(parents=True, exist_ok=True)
    out = AUDIO_OUT / f"{slug}.mp3"
    # loudnorm targets -16 LUFS, the usual level for spoken-word podcasts.
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(joined),
         "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ac", "1", "-ar", "44100", "-b:a", "96k", str(out)],
        check=True,
    )
    print(f"wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
