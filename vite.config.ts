// TODO:
//
// - experiment with using the watch plugin for automating the generation of the API client
//
//   see an example of this being done here: https://github.com/encoredev/examples/blob/577b6b0e5292012b3f8e85f457ddd6c4354aedd4/ts/react-starter/vite.config.ts

import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tsconfigPaths()],
  server: {
    cors: true,
  },
  build: {
    rollupOptions: {
      external: ['encore.dev/log'],
    },
  },
  resolve: {
    alias: {
      '~src/utils/api/apiClient': path.resolve(
        __dirname,
        mode === 'node'
          ? './src/utils/api/apiClient.ts'
          : './src/utils/api/apiClient.browser.ts',
      ),
    },
  },
}))
