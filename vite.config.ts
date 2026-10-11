import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'], react: ['react', 'react-dom'], chess: ['chess.js'] },
      },
    },
  },
  test: { environment: 'node', include: ['src/tests/**/*.test.ts'], coverage: { include: ['src/chess/**', 'src/ai/**'] } },
});
