#!/usr/bin/env python3
import asyncio
import json
import re
import unicodedata
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "src/modules/main.ts"
OUT = ROOT / "public/sounds/pofi-guides"
SOURCE = ROOT / "assets-source/sounds/pofi-guides"
VOICE = "tr-TR-EmelNeural"


def normalize(text: str) -> str:
    turkish_lower = text.replace("İ", "i").replace("I", "ı").lower()
    return re.sub(r"\s+", " ", re.sub(r"[.!?,;:]", "", turkish_lower)).strip()


def slug(text: str) -> str:
    value = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")[:64]


def collect_phrases() -> list[str]:
    source = MAIN.read_text(encoding="utf-8")
    story = source[source.index("const STORY_LIBRARY"):source.index("const POFI_VIEW_STATES")]
    story_phrases = re.findall(r"(?:text|successText|fallbackText): '([^']+)'", story)
    mirror = [
        "Bana bak", "Şimdi sen yap", "Ağzını aç", "Gülümse", "Dudaklarını büz",
        "A sesi yap", "O sesi yap", "Dudaklarını kapat", "Dişlerini göster",
        "Şaşırmış yüz yap", "Harika", "Çok güzel"
    ]
    ceee = ["Neredesin?", "Haniymiş?", "Seni bulabilecek miyim?", "Nereye saklandın?", "Ceee!"]
    return list(dict.fromkeys([*mirror, *ceee, *story_phrases]))


async def generate() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    SOURCE.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, str] = {}
    for index, phrase in enumerate(collect_phrases(), start=1):
        filename = f"{index:02d}-{slug(phrase)}.mp3"
        output = OUT / filename
        if not output.exists() or output.stat().st_size < 1000:
            communicate = edge_tts.Communicate(phrase, VOICE, rate="-8%", pitch="+2Hz", volume="+0%")
            await communicate.save(str(output))
        (SOURCE / filename).write_bytes(output.read_bytes())
        manifest[normalize(phrase)] = f"/sounds/pofi-guides/{filename}"
        print(f"[{index:02d}] {phrase} -> {filename}")
    data = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    (OUT / "manifest.json").write_text(data, encoding="utf-8")
    (SOURCE / "manifest.json").write_text(data, encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(generate())
