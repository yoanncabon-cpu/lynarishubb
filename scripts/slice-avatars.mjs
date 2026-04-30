#!/usr/bin/env node
/**
 * Découpe une grille 3x3 d'avatars Higgsfield en 9 PNG carrés nommés.
 *
 * Usage:
 *   node scripts/slice-avatars.mjs <chemin-image-source>
 *   node scripts/slice-avatars.mjs ~/Downloads/hf_20260430_004303_394fd70f-e8e0-4f56-8ceb-931cdaa76f56.png
 *
 * Sortie: public/agents/avatars/{slug}.png (1024x1024 chacun)
 *
 * Ordre attendu dans la grille (gauche -> droite, haut -> bas):
 *   Marine  | Charles | Lou
 *   Elio    | Mae     | Max
 *   Nova    | Alba    | Orion
 */

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Ordre = lecture gauche-droite, haut-bas
const SLUGS = [
  ["marine", "charles", "lou"],
  ["elio", "mae", "max"],
  ["nova", "alba", "orion"],
];

const OUTPUT_SIZE = 1024;
// Padding intérieur en % pour rogner la marge blanche autour de chaque tuile.
// Ajuste si tes tuiles ont plus/moins de blanc (0 = aucun rognage).
const INNER_PADDING_PCT = 0.03;

async function main() {
  const sourcePath = process.argv[2];
  if (!sourcePath) {
    console.error("Erreur: chemin de l'image source manquant.");
    console.error("Usage: node scripts/slice-avatars.mjs <chemin-image>");
    process.exit(1);
  }

  const absSource = path.resolve(sourcePath);
  if (!existsSync(absSource)) {
    console.error(`Erreur: fichier introuvable -> ${absSource}`);
    process.exit(1);
  }

  const outDir = path.join(projectRoot, "public", "agents", "avatars");
  await mkdir(outDir, { recursive: true });

  const meta = await sharp(absSource).metadata();
  const { width, height } = meta;
  if (!width || !height) {
    throw new Error("Impossible de lire les dimensions de l'image.");
  }

  console.log(`Source: ${absSource}`);
  console.log(`Dimensions: ${width}x${height}`);
  console.log(`Sortie: ${outDir}\n`);

  const cellW = Math.floor(width / 3);
  const cellH = Math.floor(height / 3);
  const padX = Math.floor(cellW * INNER_PADDING_PCT);
  const padY = Math.floor(cellH * INNER_PADDING_PCT);

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const slug = SLUGS[row][col];
      const left = col * cellW + padX;
      const top = row * cellH + padY;
      const w = cellW - padX * 2;
      const h = cellH - padY * 2;

      const baseTile = sharp(absSource)
        .extract({ left, top, width: w, height: h })
        .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: "cover" });

      const pngPath = path.join(outDir, `${slug}.png`);
      const webpPath = path.join(outDir, `${slug}.webp`);

      await baseTile.clone().png({ compressionLevel: 9 }).toFile(pngPath);
      await baseTile.clone().webp({ quality: 88, effort: 6 }).toFile(webpPath);

      console.log(`  + ${slug.padEnd(8)} -> ${slug}.png + ${slug}.webp`);
    }
  }

  console.log(`\nOK 9 avatars generes (${OUTPUT_SIZE}x${OUTPUT_SIZE}).`);
  console.log(`Astuce: passe-les dans remove.bg ou photoroom pour fond transparent -> .webp`);
}

main().catch((err) => {
  console.error("Echec:", err);
  process.exit(1);
});
