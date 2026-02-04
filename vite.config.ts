import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Ensure the base is correct for Vercel/Root deployments
  base: '/',
  define: {
    // This allows process.env.API_KEY to be available in the browser code
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true,
    // Target the specific root files correctly
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  }
});