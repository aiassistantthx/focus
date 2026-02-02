import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, cpSync, existsSync, renameSync, mkdirSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: resolve(__dirname, 'src'),
  base: '/',
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        settings: resolve(__dirname, 'src/settings/settings.html'),
        offscreen: resolve(__dirname, 'src/offscreen/offscreen.html'),
        blocked: resolve(__dirname, 'src/blocked/blocked.html'),
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background/service-worker') {
            return 'background/service-worker.js';
          }
          return '[name]/[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            const parts = assetInfo.name.replace('.css', '').split('/');
            const name = parts[parts.length - 1];
            return `${name}/${name}.css`;
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  plugins: [
    {
      name: 'copy-manifest-and-public',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        // Copy manifest.json
        copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(distDir, 'manifest.json'),
        );
        // Copy public/ contents
        const publicDir = resolve(__dirname, 'public');
        if (existsSync(publicDir)) {
          cpSync(publicDir, distDir, { recursive: true });
        }
      },
    },
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
});
