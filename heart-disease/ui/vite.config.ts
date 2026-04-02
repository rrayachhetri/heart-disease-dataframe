import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        // No rewrite — backend routes already include /api prefix
      },
      '/health': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
});
