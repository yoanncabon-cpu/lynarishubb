"""Compresse les scènes 16:9 en WebP optimisé pour le web."""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public"
SCENES = ROOT / "agents" / "scenes"
MARKETING = ROOT / "marketing"

def convert(src: Path, max_width: int = 1600, quality: int = 88):
    img = Image.open(src).convert("RGB")
    if img.size[0] > max_width:
        ratio = max_width / img.size[0]
        new_size = (max_width, int(img.size[1] * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
    dst = src.with_suffix(".webp")
    img.save(dst, "WEBP", quality=quality, method=6)
    src_size_mb = src.stat().st_size / 1_048_576
    dst_size_kb = dst.stat().st_size / 1024
    src.unlink()  # supprime le PNG (on garde uniquement le WebP)
    print(f"  {src.stem}: {src_size_mb:.1f}MB -> {dst_size_kb:.0f}KB ({img.size})")

print("Compression scenes/")
for png in sorted(SCENES.glob("*.png")):
    convert(png)

print("\nCompression marketing/")
for png in sorted(MARKETING.glob("*.png")):
    convert(png, max_width=1920)

print("\nDone.")
