"""Détourage rapide via numpy + scipy. Remplace fond navy par alpha.

Usage: python detourage-fast.py marine charles ...  (tous les slugs si vide)
"""
import sys
import shutil
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1] / "public" / "agents" / "avatars"
BACKUP = Path(__file__).resolve().parents[1] / ".backups" / "avatars-navy-fast"
BACKUP.mkdir(parents=True, exist_ok=True)

ALL_AGENTS = ["marine", "charles", "lou", "elio", "mae", "max", "nova", "alba", "orion", "aria"]
LUMA_MAX = 50      # luminance max pour fond
SAT_MAX = 32       # saturation max (max-min RGB) — exclut rim lights
FEATHER = 4        # pixels d'antialiasing à la frontière

def detourage(arr: np.ndarray) -> np.ndarray:
    """arr: (H, W, 4) RGBA uint8. Retourne RGBA avec alpha modifié."""
    h, w, _ = arr.shape
    rgb = arr[:, :, :3].astype(np.int16)

    # Mask "fond candidat"
    luma = rgb.max(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    bg_candidate = (luma <= LUMA_MAX) & (sat <= SAT_MAX)

    # Flood-fill depuis les bords : on garde uniquement les pixels CONNECTÉS
    # aux coins via un labeling sur le mask candidat.
    border = np.zeros((h, w), dtype=bool)
    border[0, :] = bg_candidate[0, :]
    border[-1, :] = bg_candidate[-1, :]
    border[:, 0] = bg_candidate[:, 0]
    border[:, -1] = bg_candidate[:, -1]

    # Composantes connexes 4-conn sur le mask candidat
    labels, _ = ndimage.label(bg_candidate, structure=np.array([[0,1,0],[1,1,1],[0,1,0]]))
    border_labels = set(labels[border].tolist()) - {0}
    bg_mask = np.isin(labels, list(border_labels))

    # Feather : distance euclidienne au bg_mask, sur les pixels NON-bg
    if FEATHER > 0:
        dist = ndimage.distance_transform_edt(~bg_mask)
        # Pour les pixels à distance <= FEATHER ET dans le bg_candidate (proche du fond),
        # on adoucit l'alpha
        soft_mask = (dist <= FEATHER) & ~bg_mask & bg_candidate
        # alpha graduel : à distance 0 → quasi transparent, à FEATHER → opaque
        soft_alpha = np.clip(255 * (dist / FEATHER), 0, 255).astype(np.uint8)
    else:
        soft_mask = np.zeros_like(bg_mask)
        soft_alpha = np.full((h, w), 255, dtype=np.uint8)

    # Construit le résultat
    out = arr.copy()
    out[bg_mask, 3] = 0
    out[soft_mask, 3] = soft_alpha[soft_mask]

    return out

def process(slug: str):
    for ext in (".png", ".webp"):
        f = ROOT / f"{slug}{ext}"
        if not f.exists():
            continue
        shutil.copy2(f, BACKUP / f.name)

        img = Image.open(f).convert("RGBA")
        arr = np.array(img)
        out_arr = detourage(arr)
        out_img = Image.fromarray(out_arr, "RGBA")

        if ext == ".png":
            out_img.save(f, "PNG", optimize=True)
        else:
            out_img.save(f, "WEBP", quality=92, method=6)

        # report
        corner_alpha = out_arr[0, 0, 3]
        center_alpha = out_arr[arr.shape[0] // 2, arr.shape[1] // 2, 3]
        print(f"  {f.name}: corner={corner_alpha}, center={center_alpha}")

if __name__ == "__main__":
    slugs = sys.argv[1:] if len(sys.argv) > 1 else ALL_AGENTS
    print(f"Detourage rapide de {len(slugs)} agents...")
    for s in slugs:
        process(s)
    print("Done.")
