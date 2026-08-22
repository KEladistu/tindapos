import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*'],
      manifest: {
        name: 'TindaPOS',
        short_name: 'TindaPOS',
        description: 'Offline-first POS for Philippine small businesses',
        theme_color: '#f59e0b',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        icons: []
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true
  }
});
