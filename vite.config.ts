import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves this project at /chess/.
  base: '/chess/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
