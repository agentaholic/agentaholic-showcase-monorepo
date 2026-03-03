/// <reference types="vitest" />
/**
 * Vitest configuration for workspace tests.
 *
 * This config is used by workspace-test.sh to run tests in specific workspaces.
 * Unlike the root vitest.config.ts, it does NOT exclude workspace test directories,
 * allowing those tests to run when invoked via the workspace test script.
 */
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
      // NOTE: Unlike root config, we do NOT exclude workspace tests here
      // because this config is used specifically to run workspace tests
    ],
  },
})
