import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// The dev server mirrors Vercel's production rewrites (see vercel.json),
// so the browser always sees same-origin URLs — no CORS preflights, no
// backend config drift between local and prod.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/palace': {
        target: 'https://mempalace.onioko.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api\/palace/, ''),
      },
      '/api/memos': {
        target: 'https://memos-local.onioko.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api\/memos/, ''),
      },
    },
  },
})
