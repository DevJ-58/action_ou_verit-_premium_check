// Renders design/logo.svg to the PNG icons the PWA manifest needs.
// Usage: node scripts/generate-icons.mjs  (uses Playwright's Chromium; set PW_CHROMIUM_PATH if needed)
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const svg = readFileSync('design/logo.svg', 'utf8')
const targets = [
  { file: 'public/icons/icon-192.png', size: 192, padding: 0 },
  { file: 'public/icons/icon-512.png', size: 512, padding: 0 },
  { file: 'public/icons/maskable-512.png', size: 512, padding: 0.12 },
  { file: 'public/icons/apple-touch-icon.png', size: 180, padding: 0 },
]

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
)
const page = await browser.newPage()
for (const { file, size, padding } of targets) {
  const inner = Math.round(size * (1 - padding * 2))
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<body style="margin:0;background:#0f0e1a;display:grid;place-items:center;height:${size}px">
       <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div>
     </body>`,
  )
  await page.screenshot({ path: file })
  console.log('wrote', file)
}
await browser.close()
