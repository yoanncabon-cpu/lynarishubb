import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"
import { join } from "node:path"

const OUT = join(process.cwd(), "docs/changes/2026-05-05")
await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 60_000 })
await page.waitForTimeout(3500)

await page.screenshot({ path: join(OUT, "hero-1440.png"), fullPage: false })

await page.setViewportSize({ width: 375, height: 812 })
await page.waitForTimeout(800)
await page.evaluate(() => window.scrollTo(0, 480))
await page.waitForTimeout(1500)
await page.screenshot({ path: join(OUT, "hero-375-visual.png"), fullPage: false })
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(500)
await page.screenshot({ path: join(OUT, "hero-375-top.png"), fullPage: false })

await page.setViewportSize({ width: 1440, height: 900 })
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(800)
await page.screenshot({ path: join(OUT, "landing-fullpage-1440.png"), fullPage: true })

await browser.close()
console.log("✓ screenshots OK ->", OUT)
