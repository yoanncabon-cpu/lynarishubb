"""Ajoute le hero scene parallax cinematique aux 9 pages agents statiques."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src" / "app" / "(marketing)" / "agents"

# Données agents (alignées avec data.ts)
AGENTS = {
    "marine":  {"color": "#22D3EE", "name": "Marine",  "role": "Agent Téléphonique",   "tagline": "Décroche. Qualifie. Prend RDV. 24 / 7."},
    "charles": {"color": "#7C3AED", "name": "Charles", "role": "Agent Personnel",      "tagline": "Ton chef d’orchestre IA disponible sur WhatsApp."},
    "lou":     {"color": "#F472B6", "name": "Lou",     "role": "Agent Contenu & SEO",  "tagline": "Rédige, optimise, publie. Partout."},
    "elio":    {"color": "#10B981", "name": "Elio",    "role": "Agent Commercial",     "tagline": "Prospecte, qualifie, relance. Automatiquement."},
    "mae":     {"color": "#F59E0B", "name": "Mae",     "role": "Agent Mail",           "tagline": "Ta boîte mail triée et gérée chaque matin."},
    "max":     {"color": "#EC4899", "name": "Max",     "role": "Agent Photo & Vidéo", "tagline": "Génère, retouche, exporte. En secondes."},
    "nova":    {"color": "#6366F1", "name": "Nova",    "role": "Agent Business",       "tagline": "Ton assistant stratégique avec tes vraies données."},
    "alba":    {"color": "#8B5CF6", "name": "Alba",    "role": "Agent RH",             "tagline": "CV triés, contrats rédigés, candidats contactés."},
    "orion":   {"color": "#64748B", "name": "Orion",   "role": "Agent Automatisation", "tagline": "Décris ton process en français. Orion le code."},
}

IMPORT_LINE = 'import Link from "next/link"'
NEW_IMPORT = 'import Link from "next/link"\nimport { AgentSceneHero } from "@/components/marketing/AgentSceneHero"'

OPEN_DIV = '<div style={{ background: "#0A0A0F", minHeight: "100vh", color: "#F5F5F7" }}>'

for slug, data in AGENTS.items():
    path = ROOT / slug / "page.tsx"
    if not path.exists():
        print(f"  miss {slug}")
        continue

    src = path.read_text(encoding="utf-8")

    # Skip si l'AgentSceneHero est deja present
    if "AgentSceneHero" in src:
        print(f"  skip {slug} (déjà ajouté)")
        continue

    # 1) Ajout import
    if IMPORT_LINE not in src:
        print(f"  ERR {slug}: import Link not found")
        continue
    src = src.replace(IMPORT_LINE, NEW_IMPORT, 1)

    # 2) Insertion JSX juste apres le <div ouvrant
    # Patterns possibles d'ouverture
    div_patterns = [
        '<div style={{ background: "#0A0A0F", minHeight: "100vh", color: "#F5F5F7" }}>',
        '<div style={{ background: "#0A0A0B" }}>',
    ]
    found = None
    for pat in div_patterns:
        if pat in src:
            found = pat
            break
    if not found:
        print(f"  ERR {slug}: open div pattern not found")
        continue

    hero_block = f'''{found}

      {{/* Cinematic scene parallax — banner full-bleed avec scroll effects */}}
      <AgentSceneHero
        src="/agents/scenes/{slug}.webp"
        alt="{data["name"]}, {data["role"]} Lynaris"
        color="{data["color"]}"
        name="{data["name"]}"
        role="{data["role"]}"
        tagline="{data["tagline"]}"
      />'''

    src = src.replace(found, hero_block, 1)

    path.write_text(src, encoding="utf-8")
    print(f"  ok {slug}")

print("Done.")
