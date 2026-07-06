import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
