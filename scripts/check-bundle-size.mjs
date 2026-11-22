// Fails (exit 1) when the JavaScript loaded by index.html exceeds the gzip budget.
// Usage: node scripts/check-bundle-size.mjs [distDir] [budgetKB]
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

export function initialScripts(html) {
  const srcs = [
    ...html.matchAll(/<script[^>]+src="([^"]+)"/g),
    ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g),
  ]
  return [...new Set(srcs.map((m) => m[1]))].filter((src) => src.endsWith('.js'))
}

export function measure(distDir) {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8')
  return initialScripts(html).map((src) => {
    // Scripts live under the base path, whatever it is: keep the part from the file name's folder.
    const file = join(distDir, src.replace(/^.*?\/(assets\/|registerSW)/, '$1'))
    return { src, gzip: gzipSync(readFileSync(file)).length }
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const distDir = process.argv[2] ?? 'dist'
  const budget = Number(process.argv[3] ?? 200) * 1024
  const files = measure(distDir)
  const total = files.reduce((sum, f) => sum + f.gzip, 0)
  for (const f of files) console.log(`${(f.gzip / 1024).toFixed(1).padStart(7)} KB  ${f.src}`)
  console.log(`${(total / 1024).toFixed(1).padStart(7)} KB  total (budget ${budget / 1024} KB)`)
  if (total > budget) {
    console.error('Initial JavaScript is over budget.')
    process.exit(1)
  }
}
