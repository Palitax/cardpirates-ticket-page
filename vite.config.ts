import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'favicon.svg'],
      manifest: {
        name: 'Cardpirates Ticket Scanner',
        short_name: 'CP Scanner',
        description: 'Offline-fähiger Ticket-Scanner für Cardpirates Events',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/scan',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/supabase/],
      }
    })
  ],
  build: {
    outDir: 'assets', // Output built assets directly to Shopify theme's assets folder
    emptyOutDir: false, // Prevent deleting other files in assets/
    rollupOptions: {
      input: 'src/main.tsx', // Build from the main React entrypoint directly
      output: {
        entryFileNames: 'theme-app.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'theme-app.css';
          }
          return '[name][extname]';
        },
      },
    },
  },
})
