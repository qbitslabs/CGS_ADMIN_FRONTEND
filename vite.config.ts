/* Vite config for the platform-admin console (port 5174).
 * Proxies /cgs_api to the local CGS backend during development. */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/cgs_api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/w_api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

