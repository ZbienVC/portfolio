import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Some filesystems don't emit native watch events reliably — poll so edits hot-reload.
  server: {
    watch: { usePolling: true, interval: 250 },
  },
})
