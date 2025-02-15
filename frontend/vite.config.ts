import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite の設定
export default defineConfig({
  plugins: [react()],
  root: './',  // ← ここが `./` になっているか確認
});
