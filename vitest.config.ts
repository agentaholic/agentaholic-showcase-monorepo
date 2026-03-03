/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'happy-dom',
    testTimeout: 30000,
    setupFiles: ['./src/test/setup.ts'],
    exclude: [
      'node_modules/**',
      // Exclude workspace tests (they run via workspace test tasks)
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      'src/services/ticTacToe/aggregates/**/*.test.ts',
      'src/services/ticTacToe/api/**/*.test.ts',
      'src/services/ticTacToe/features/**/*.spec.ts',
      'src/services/ticTacToe/utils/**/*.test.ts',
      'src/services/hangman/aggregates/**/*.test.ts',
      'src/services/hangman/api/**/*.test.ts',
      'src/services/hangman/utils/**/*.test.ts',
      'src/services/hangman/features/**/*.test.ts',
    ],
  },
})
