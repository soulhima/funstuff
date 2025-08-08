import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Ensure Vite listens on all network interfaces (important for containerized environments)
    port: process.env.PORT || 4173,  // Set port dynamically from Railway environment variable
  },
  preview: {
    allowedHosts: ['ravishing-growth-production-8364.up.railway.app'],  // Add your allowed host here
  },
})
