"""Pipeline complet : remplace les avatars par les *-w.png (fond blanc)
et applique un détourage chroma-key blanc rapide.
"""
import shutil
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1] / "public" / "agents" / "avatars"
BACKUP = Path(__file__).resolve().parents[1] / ".backups" / "avatars-pre-white-bg"
BACKUP.mkdir(parents=True, exist_ok=True)

AGENTS = ["marine", "charles", "lou", "elio", "mae", "max", "nova", "alba", "orion", "aria"]

# Pour fond blanc : on cherche les pixels TRÈS clairs et neutres
LUMA_MIN = 235      # luminance min pour fond candidat (très clair)
SAT_MAX = 18        # saturation max — pour exclure couleurs claires non-bg
FEATHER = 4

def detourage_white(arr: np.ndarray) -> np.ndarray:
    h, w, _ = arr.shape
    rgb = arr[:, :, :3].astype(np.int16)

    luma = rgb.min(axis=2)  # min channel — pour blanc, doit être haut sur tous canaux
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    bg_candidate = (luma >= LUMA_MIN) & (sat <= SAT_MAX)

    border = np.zeros((h, w), dtype=bool)
    border[0, :] = bg_candidate[0, :]
    border[-1, :] = bg_candidate[-1, :]
    border[:, 0] = bg_candidate[:, 0]
    border[:, -1] = bg_candidate[:, -1]

    labels, _ = ndimage.label(bg_candidate, structure=np.array([[0,1,0],[1,1,1],[0,1,0]]))
    border_labels = set(labels[border].tolist()) - {0}
    bg_mask = np.isin(labels, list(border_labels))

    if FEATHER > 0:
        dist = ndimage.distance_transform_edt(~bg_mask)
        soft_mask = (dist <= FEATHER) & ~bg_mask & bg_candidate
        soft_alpha = np.clip(255 * (dist / FEATHER), 0, 255).astype(np.uint8)
    else:
        soft_mask = np.zeros_like(bg_mask)
        soft_alpha = np.full((h, w), 255, dtype=np.uint8)

    out = arr.copy()
    out[bg_mask, 3] = 0
    out[soft_mask, 3] = soft_alpha[soft_mask]

    return out

def process(slug: str):
    src_w = ROOT / f"{slug}-w.png"
    if not src_w.exists():
        print(f"  miss {slug}: pas de {slug}-w.png")
        return

    # Backup les fichiers existants
    for ext in (".png", ".webp"):
        old = ROOT / f"{slug}{ext}"
        if old.exists():
            shutil.copy2(old, BACKUP / f"{slug}{ext}")

    # Charge le nouveau, resize si nécessaire
    img = Image.open(src_w).convert("RGB")
    if img.size[0] > 1024:
        img = img.resize((1024, 1024), Image.Resampling.LANCZOS)

    # Détourage
    arr_rgba = np.array(img.convert("RGBA"))
    out_arr = detourage_white(arr_rgba)
    out_img = Image.fromarray(out_arr, "RGBA")

    # Sauvegarde PNG + WebP avec alpha
    out_img.save(ROOT / f"{slug}.png", "PNG", optimize=True)
    out_img.save(ROOT / f"{slug}.webp", "WEBP", quality=92, method=6)

    src_w.unlink()  # nettoie le -w.png

    corner_alpha = out_arr[0, 0, 3]
    center_alpha = out_arr[arr_rgba.shape[0] // 2, arr_rgba.shape[1] // 2, 3]
    print(f"  {slug}: corner={corner_alpha} center={center_alpha}")

if __name__ == "__main__":
    print(f"Pipeline white bg -> transparent : {len(AGENTS)} agents")
    for s in AGENTS:
        process(s)
    print("Done.")
