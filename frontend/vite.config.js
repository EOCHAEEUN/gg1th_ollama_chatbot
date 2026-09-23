import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
}

export default defineConfig({
  plugins: [react()],

  // npm run dev
  server: {
    proxy: apiProxy,
  },

  // npm run preview
  preview: {
    proxy: apiProxy,
  },
})