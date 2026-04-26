import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `base: './'` makes every emitted URL relative to index.html, so the build
// works whether it's served from `/`, `/dodo-game/`, or any subfolder.
// Required for GitHub Pages where the site lives at
// `https://<user>.github.io/<repo>/`.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
});
