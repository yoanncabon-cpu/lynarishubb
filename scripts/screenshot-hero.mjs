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

// scroll progressively to trigger ScrollTrigger animations
async function smoothScrollTo(p, targetSelector) {
  const targetY = await p.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return 0
    const r = el.getBoundingClientRect()
    return window.scrollY + r.top - 80
  }, targetSelector)
  const steps = 30
  const startY = await p.evaluate(() => window.scrollY)
  for (let i = 1; i <= steps; i++) {
    const y = startY + ((targetY - startY) * i) / steps
    await p.evaluate((y) => window.scrollTo(0, y), y)
    await p.waitForTimeout(50)
  }
  await p.waitForTimeout(2000)
}

await smoothScrollTo(page, "section[aria-labelledby='agents-heading']")
await page.screenshot({ path: join(OUT, "agents-1440.png"), fullPage: false })

await page.mouse.move(720, 450)
await page.waitForTimeout(800)
await page.screenshot({ path: join(OUT, "agents-1440-hover.png"), fullPage: false })

await page.setViewportSize({ width: 375, height: 812 })
await page.waitForTimeout(800)
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(500)
await smoothScrollTo(page, "section[aria-labelledby='agents-heading']")
await page.screenshot({ path: join(OUT, "agents-375.png"), fullPage: false })

await browser.close()
console.log("✓ screenshots OK ->", OUT)
