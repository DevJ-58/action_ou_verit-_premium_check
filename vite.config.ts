/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

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

/**
 * URL prefix of the app: the repository sub-path on GitHub Pages, the root on
 * Vercel (which sets VERCEL=1), or whatever BASE_PATH says.
 */
export const BASE_PATH =
  process.env.BASE_PATH ?? (process.env.VERCEL ? '/' : '/action_ou_verit-_premium_check/')

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    tailwindcss(),
    spaFallback(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Action ou Vérité',
        short_name: 'Action·Vérité',
        description: 'Le jeu Action ou Vérité, autour d’un téléphone posé au centre de la table.',
        lang: 'fr',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0f0e1a',
        theme_color: '#0f0e1a',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        navigateFallback: `${BASE_PATH}index.html`,
      },
    }),
  ],
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
