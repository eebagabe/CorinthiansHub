import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // em dev, /api vai para o backend Spring (backend/)
  server: { proxy: { '/api': 'http://localhost:8081' } },
})
