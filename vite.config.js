import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // به همه آدرس‌های IP اجازه دسترسی می‌دهد
    port: 5173, // پورت پیش‌فرض
  },
}) 