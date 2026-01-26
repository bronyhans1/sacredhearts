import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure service worker and manifest are copied to dist
  publicDir: 'public',
  build: {
    chunkSizeWarningLimit: 600, // Slightly higher than default 500; we use manualChunks
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'sw.js' || assetInfo.name === 'manifest.json') {
            return '[name][extname]';
          }
          return 'assets/[name].[hash][extname]';
        },
        // Split vendors so main chunk is smaller; better caching
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('react-router') || id.includes('lucide-react') || id.includes('react-easy-crop')) {
              return 'vendor-ui';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
