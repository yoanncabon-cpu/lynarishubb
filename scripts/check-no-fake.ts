import { readFileSync, readdirSync, statSync } from "fs"
import { join } from "path"

const FORBIDDEN: RegExp[] = [
  /ACME(?!\.)/,
  /\bNovacode\b/,
  /\bKairos\b/,
  /\bTamarin\b/,
  /\bLudens\b/,
  /\bStudioFr\b/,
  /Lorem ipsum/i,
  /\+120 équipes/,
  /87%.*admin/i,
  /Sophie L\./,
  /Alexandre B\./,
  /Agence Spark/,
  /Startup B2B/,
  /E-commerce Mode/,
  /Cabinet RH.*faux/i,
]

const EXEMPT_MARKER = "// [APPROVED-FAKE]"

function scan(dir: string): { file: string; line: number; pattern: string }[] {
  const results: { file: string; line: number; pattern: string }[] = []
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".next", ".git", "dist", "scripts"].includes(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...scan(full))
    } else if (/\.(tsx?|jsx?|md)$/.test(entry)) {
      const lines = readFileSync(full, "utf-8").split("\n")
      lines.forEach((line, i) => {
        if (line.includes(EXEMPT_MARKER)) return
        for (const pat of FORBIDDEN) {
          if (pat.test(line)) {
            results.push({ file: full, line: i + 1, pattern: pat.source })
          }
        }
      })
    }
  }
  return results
}

const errors = scan("src")
if (errors.length > 0) {
  console.error(`\n❌ Fake data détectée (${errors.length} occurrence${errors.length > 1 ? "s" : ""}) :\n`)
  errors.forEach(e => console.error(`  ${e.file}:${e.line} — motif interdit: "${e.pattern}"`))
  console.error(`\n→ Corriger ou marquer "// [APPROVED-FAKE]" si intentionnel.\n`)
  process.exit(1)
}
console.log("✅ check:no-fake — aucune fake data détectée.")
