import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // If 5173 is taken, fail fast instead of auto-switching to a different port.
    // This prevents opening the wrong "localhost:XXXX" URL and seeing blank/stale pages.
    strictPort: true,
    proxy: {
      // Forward /auth/* and /api/* to the Express server
      '/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      // Socket.IO HTTP + WebSocket polling/upgrade
      '/socket.io': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
