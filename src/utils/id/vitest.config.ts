/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths({ root: '../../../' })],
  test: {
    globals: true,
    environment: 'happy-dom',
    testTimeout: 30000,
    include: ['**/*.test.ts'],
    root: __dirname,
  },
})
