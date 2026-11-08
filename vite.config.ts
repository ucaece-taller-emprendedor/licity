import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Firebase pesa ~900 kB; es esperable en una SPA con Auth + Firestore.
  build: { chunkSizeWarningLimit: 1100 },
  server: { port: 5421, strictPort: true },
})
