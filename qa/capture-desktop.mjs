import { chromium } from 'playwright'
import fs from 'fs'

const OUT = process.env.SHOT_DIR || '/tmp/nexus-desktop'
fs.mkdirSync(OUT, { recursive: true })
const BASE = process.argv[2] || 'http://127.0.0.1:4173/'

const browser = await chromium.launch({
  // Falls back to Playwright's own browser when CHROME_PATH isn't set.
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
})

// A desktop window and a tall/narrow Android-ish viewport.
for (const [name, vp] of [
  ['desktop', { width: 1440, height: 900 }],
  ['tall', { width: 412, height: 915 }],
]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 })
  await page.goto(`${BASE}?qa=1&tier=B`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.screenshot({ timeout: 180000, path: `${OUT}/${name}-start.png` })
  await page.waitForFunction(() => !!window.__nexusQA, null, { timeout: 15000 })
  await page.evaluate(() => window.__nexusQA.start('full'))
  await page.waitForTimeout(800)
  await page.evaluate(() => window.__nexusQA.seek(36))
  await page.waitForTimeout(900)
  await page.screenshot({ timeout: 180000, path: `${OUT}/${name}-t36.png` })
  await page.close()
}
console.log('done')
await browser.close()
