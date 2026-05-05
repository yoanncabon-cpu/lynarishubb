"""Retire le fond blanc des avatars agents par flood-fill depuis les bords.

Préserve les zones blanches internes (chemise, dents, yeux).
"""
from PIL import Image
from pathlib import Path
from collections import deque

ROOT = Path(__file__).resolve().parents[1] / "public" / "agents" / "avatars"

# pixel considered "background-ish" if min channel >= this (i.e. light enough)
BG_MIN_CHANNEL = 230
# distance from white tolerance for full transparency
WHITE_DIST = 28
# feather distance for soft edge
FEATHER = 18

def is_bgish(r: int, g: int, b: int) -> bool:
    """True si pixel clair et neutre (peu saturé)."""
    if min(r, g, b) < BG_MIN_CHANNEL:
        return False
    # peu saturé : écart entre canaux faible
    if max(r, g, b) - min(r, g, b) > 18:
        return False
    return True

def remove_white(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()

    # 1) flood fill depuis tous les pixels du bord qui sont "bgish"
    visited = bytearray(w * h)  # 0 unvisited, 1 visited bg
    q: deque[tuple[int, int]] = deque()

    def try_seed(x: int, y: int):
        idx = y * w + x
        if visited[idx]:
            return
        r, g, b, _ = px[x, y]
        if is_bgish(r, g, b):
            visited[idx] = 1
            q.append((x, y))

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)

    # BFS 4-connexe avec tolérance plus permissive (proche du blanc neutre)
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                idx = ny * w + nx
                if visited[idx]:
                    continue
                r, g, b, _ = px[nx, ny]
                if is_bgish(r, g, b):
                    visited[idx] = 1
                    q.append((nx, ny))

    # 2) applique alpha=0 sur tous les pixels marqués
    # 3) feather : pour chaque pixel non-bg adjacent à un pixel bg, calcule alpha selon distance au blanc
    out = Image.new("RGBA", (w, h))
    op = out.load()

    # première passe : transparent sur visited, copie ailleurs
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if visited[y * w + x]:
                op[x, y] = (r, g, b, 0)
            else:
                op[x, y] = (r, g, b, a)

    # feather : sur les pixels conservés mais proches d'un pixel transparent ET très clairs
    for y in range(h):
        for x in range(w):
            if visited[y * w + x]:
                continue
            r, g, b, _ = px[x, y]
            d = max(255 - r, 255 - g, 255 - b)  # distance au blanc
            if d > WHITE_DIST + FEATHER:
                continue
            # voisin transparent ?
            has_transparent_neighbor = False
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1),
                           (x + 1, y + 1), (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1)):
                if 0 <= nx < w and 0 <= ny < h and visited[ny * w + nx]:
                    has_transparent_neighbor = True
                    break
            if not has_transparent_neighbor:
                continue
            if d <= WHITE_DIST:
                op[x, y] = (r, g, b, 0)
            else:
                k = (d - WHITE_DIST) / FEATHER
                op[x, y] = (r, g, b, int(255 * min(1.0, max(0.0, k))))

    return out

def main():
    files = sorted(list(ROOT.glob("*.png")) + list(ROOT.glob("*.webp")))
    print(f"Processing {len(files)} files in {ROOT}")
    for f in files:
        img = Image.open(f)
        out = remove_white(img)
        if f.suffix.lower() == ".png":
            out.save(f, "PNG", optimize=True)
        else:
            out.save(f, "WEBP", quality=92, method=6)
        # stats
        alphas = [out.getpixel((x, y))[3] for x, y in
                  ((0, 0), (out.size[0]-1, 0), (0, out.size[1]-1), (out.size[0]-1, out.size[1]-1))]
        print(f"  ok  {f.name}  corners alpha={alphas}")

if __name__ == "__main__":
    main()
