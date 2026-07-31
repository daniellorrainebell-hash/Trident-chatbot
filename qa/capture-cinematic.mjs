import { chromium } from 'playwright'
import fs from 'fs'

const OUT = process.env.SHOT_DIR || '/tmp/nexus-shots'
fs.mkdirSync(OUT, { recursive: true })

const BASE = process.argv[2] || 'http://127.0.0.1:4173/'
const TIER = process.argv[3] || 'A'
const MARKS = [
  1.2, 4.0, 5.4, 8.0, 9.8, 11.8, 14.5, 18, 21, 25.5, 29, 32.5, 36, 39.5, 41.5,
  43.5, 46, 48, 50.5, 55, 58, 61,
]

const browser = await chromium.launch({
  // Falls back to Playwright's own browser when CHROME_PATH isn't set.
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--no-sandbox',
  ],
})

const page = await browser.newPage({
  viewport: { width: 450, height: 800 },
  deviceScaleFactor: 2,
})

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto(`${BASE}?qa=1&tier=${TIER}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)
await page.screenshot({ timeout: 180000, path: `${OUT}/00-start.png` })

await page.waitForFunction(() => !!window.__nexusQA, null, { timeout: 15000 })
await page.evaluate(() => window.__nexusQA.start('full'))
await page.waitForTimeout(1200)

for (const t of MARKS) {
  const ok = await page.evaluate((tt) => window.__nexusQA.seek(tt), t)
  if (!ok) {
    console.log('seek failed at', t)
    break
  }
  // Let the paused frame settle — shader clocks and the env map still tick.
  await page.waitForTimeout(700)
  await page.screenshot({ timeout: 180000, path: `${OUT}/t-${String(t).padStart(5, '0')}.png` })
}

console.log(
  'ERRORS:',
  errors.length ? JSON.stringify([...new Set(errors)].slice(0, 10), null, 1) : 'none',
)
await browser.close()
