import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    headers: {
      'Content-Security-Policy':
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com; " +
        "connect-src 'self' http://localhost:4000 https://accounts.google.com https://*.backblazeb2.com; " +
        "media-src 'self' blob: https://*.backblazeb2.com; " +
        "img-src 'self' data: blob: https://*.googleusercontent.com https://cdn.pixabay.com https://*.backblazeb2.com; " +
        "style-src 'self' 'unsafe-inline' https://accounts.google.com; " +
        "frame-src 'self' https://accounts.google.com https://*.backblazeb2.com; " +
        "worker-src 'self' blob:; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "frame-ancestors 'none';",
    },
  },
});