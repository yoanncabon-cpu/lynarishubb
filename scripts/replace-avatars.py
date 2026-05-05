"""Remplace les avatars *.png par les *-new.png et génère *.webp.

- Crée backup dans public/agents/avatars/_backup/
- PNG : optimisé (resampling 1024x1024 si besoin)
- WebP : qualité 92, méthode 6 (rendu compact)
"""
from PIL import Image
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1] / "public" / "agents" / "avatars"
BACKUP = ROOT / "_backup"
BACKUP.mkdir(exist_ok=True)

AGENTS = ["marine", "charles", "lou", "elio", "mae", "max", "nova", "alba", "orion"]

for slug in AGENTS:
    src_new = ROOT / f"{slug}-new.png"
    dst_png = ROOT / f"{slug}.png"
    dst_webp = ROOT / f"{slug}.webp"

    if not src_new.exists():
        print(f"  miss {slug}: pas de {slug}-new.png")
        continue

    # Backup
    if dst_png.exists():
        shutil.copy2(dst_png, BACKUP / f"{slug}.png")
    if dst_webp.exists():
        shutil.copy2(dst_webp, BACKUP / f"{slug}.webp")

    # Resample 1024x1024 si l'original est plus grand
    img = Image.open(src_new).convert("RGB")
    if img.size[0] > 1024:
        img = img.resize((1024, 1024), Image.Resampling.LANCZOS)

    # Sauvegarde PNG (sans compression aggressive — qualité prime)
    img.save(dst_png, "PNG", optimize=True)
    # Sauvegarde WebP (qualité 92, taille drastiquement réduite)
    img.save(dst_webp, "WEBP", quality=92, method=6)

    src_new.unlink()  # nettoyage du fichier intermédiaire

    s_png = dst_png.stat().st_size / 1024
    s_webp = dst_webp.stat().st_size / 1024
    print(f"  ok   {slug}: png={s_png:.0f}KB  webp={s_webp:.0f}KB")

print("\nDone. Backup dans _backup/.")
