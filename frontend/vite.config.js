import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom', 'zustand'],
          maps: ['leaflet', 'react-leaflet'],
          documents: ['jspdf', 'jspdf-autotable', 'react-pdf'],
        },
      },
    },
  },
})
