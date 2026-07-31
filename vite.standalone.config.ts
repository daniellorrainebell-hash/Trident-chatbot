import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Standalone build — everything in one JS chunk so the whole experience can
 * be folded into a single self-contained HTML file (see scripts/bundle-standalone.mjs).
 *
 * Used for sharing and for hosts that forbid external requests. The normal
 * `npm run build` still code-splits three.js into its own cacheable chunk,
 * which is the better choice for a real deployment.
 */
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-standalone',
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
})
