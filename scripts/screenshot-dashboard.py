"""Screenshot le dashboard Lynaris pour compositer dans team-hero.

- Capture la home /agents (publique, no auth needed) en tant que vue dashboard-like
- Crop pour garder un format 16:9 utile pour compositing
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUTPUT = Path(__file__).resolve().parents[1] / "scripts" / "_dashboard-shot.png"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1600, "height": 900})
        page = await context.new_page()

        # Capture la section "agents" du marketing — visible sans auth
        await page.goto("http://localhost:3000/agents", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)  # laisse le temps aux animations + lazy images

        # Force scroll au top
        await page.evaluate("window.scrollTo(0, 200)")
        await page.wait_for_timeout(500)

        await page.screenshot(path=str(OUTPUT), full_page=False, type="png")
        print(f"saved: {OUTPUT}")
        await browser.close()

asyncio.run(main())
