import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api/todoist': {
        target: 'https://api.todoist.com',
        changeOrigin: true,
        secure: true,

        rewrite: (path) =>
          path.replace(/^\/api\/todoist/, '')
      }
    }
  }
})