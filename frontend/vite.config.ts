import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: "./", // ✅ 追加
  server: {
    port: 5175,
    strictPort: true,
  },
});
