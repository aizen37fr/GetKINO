import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true, // Listen on all addresses (0.0.0.0) to fix localhost resolution
    strictPort: false, // Let it pick next available if needed, but we prefer 5173
  },
})
