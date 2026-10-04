import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Redirect all 404s back to index.html so clean URLs like /huffman work on refresh
    historyApiFallback: true,
  },
})
