"""Chroma-key des avatars : retire le fond navy #0A0A0F + dégradé pour avoir alpha.

- Backup → .backups/avatars-navy-2026-05-05/
- Méthode : flood-fill depuis les coins, tolérance large sur les pixels sombres
  (le sujet n'a pas de pixels uniformément sombres, donc safe).
- Préserve un soft alpha gradient à la frontière pour antialiasing naturel.
- Conserve les rim lights colorés (qui sont dans le sujet, pas le fond).
"""
from PIL import Image
from pathlib import Path
from collections import deque
import shutil

ROOT = Path(__file__).resolve().parents[1] / "public" / "agents" / "avatars"
BACKUP = Path(__file__).resolve().parents[1] / ".backups" / "avatars-navy-2026-05-05"
BACKUP.mkdir(parents=True, exist_ok=True)

AGENTS = ["marine", "charles", "lou", "elio", "mae", "max", "nova", "alba", "orion", "aria"]

# Pixel "fond" si très sombre ET peu saturé.
BG_LUMA_MAX = 45        # luminance max pour considérer un pixel comme fond candidat
BG_SAT_MAX = 28         # saturation max (max-min des canaux RGB) — exclut rim light coloré
EDGE_FEATHER = 6        # transition douce à la frontière

def is_dark_neutral(r: int, g: int, b: int) -> bool:
    """Pixel sombre et neutre = fond navy."""
    luma = max(r, g, b)
    if luma > BG_LUMA_MAX:
        return False
    sat = max(r, g, b) - min(r, g, b)
    return sat <= BG_SAT_MAX

def detourage(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()

    visited = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()

    def seed(x: int, y: int):
        idx = y * w + x
        if visited[idx]:
            return
        r, g, b, _ = px[x, y]
        if is_dark_neutral(r, g, b):
            visited[idx] = 1
            q.append((x, y))

    # seeds : tous les pixels du bord
    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                idx = ny * w + nx
                if visited[idx]:
                    continue
                r, g, b, _ = px[nx, ny]
                if is_dark_neutral(r, g, b):
                    visited[idx] = 1
                    q.append((nx, ny))

    out = Image.new("RGBA", (w, h))
    op = out.load()

    # Première passe : transparent sur visited, opaque ailleurs
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if visited[y * w + x]:
                op[x, y] = (r, g, b, 0)
            else:
                op[x, y] = (r, g, b, a)

    # Feather : alpha graduel sur les pixels conservés en frontière
    for y in range(h):
        for x in range(w):
            if visited[y * w + x]:
                continue
            # cherche distance au pixel transparent le plus proche dans EDGE_FEATHER
            for d in range(1, EDGE_FEATHER + 1):
                hit = False
                for dx in range(-d, d + 1):
                    for dy in (-d, d):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < w and 0 <= ny < h and visited[ny * w + nx]:
                            hit = True
                            break
                    if hit:
                        break
                    for dy2 in range(-d + 1, d):
                        for dx2 in (-d, d):
                            nx, ny = x + dx2, y + dy2
                            if 0 <= nx < w and 0 <= ny < h and visited[ny * w + nx]:
                                hit = True
                                break
                        if hit:
                            break
                    if hit:
                        break
                if hit:
                    r, g, b, _ = op[x, y]
                    alpha = int(255 * (d / EDGE_FEATHER))
                    op[x, y] = (r, g, b, min(alpha, 255))
                    break

    return out

def main():
    files = []
    for slug in AGENTS:
        png = ROOT / f"{slug}.png"
        webp = ROOT / f"{slug}.webp"
        if png.exists():
            files.append(png)
        if webp.exists():
            files.append(webp)

    print(f"Detourage de {len(files)} fichiers...")

    for f in files:
        # Backup
        shutil.copy2(f, BACKUP / f.name)
        img = Image.open(f)
        out = detourage(img)
        if f.suffix.lower() == ".png":
            out.save(f, "PNG", optimize=True)
        else:
            out.save(f, "WEBP", quality=92, method=6)
        # check
        corner = out.getpixel((0, 0))
        center = out.getpixel((out.size[0] // 2, out.size[1] // 2))
        print(f"  {f.name}: corner alpha={corner[3]}, center alpha={center[3]}")

    print(f"\nDone. Backup: {BACKUP}")

if __name__ == "__main__":
    main()
