import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite is the dev server + bundler. The React plugin lets it understand JSX/TSX.
export default defineConfig({
  plugins: [react()],
})
