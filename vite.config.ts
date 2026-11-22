/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

/** GitHub Pages serves 404.html for unknown paths: make it the SPA entry. */
function spaFallback(): Plugin {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    closeBundle() {
      copyFileSync('dist/index.html', 'dist/404.html')
    },
  }
}

export const BASE_PATH = '/action_ou_verit-_premium_check/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [react(), tailwindcss(), spaFallback()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    css: { include: [/tokens\.css/] },
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: { provider: 'v8', include: ['src/**'], exclude: ['src/**/*.test.*'] },
  },
})
