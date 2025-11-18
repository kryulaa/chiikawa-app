import { defineConfig } from 'vite';

// Vite config for Chiikawa Nature Adventure
export default defineConfig({
  base: './', // ensures relative paths for assets
  build: {
    outDir: 'dist',        // build output folder
    assetsDir: 'assets',   // folder for JS/CSS/images
    rollupOptions: {
      output: {
        // keep filenames predictable for caching
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash][extname]`
      }
    }
  },
  server: {
    open: true,          // opens browser on npm run dev
    port: 3000
  }
});
