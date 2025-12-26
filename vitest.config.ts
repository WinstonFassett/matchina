import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      '**/dev/**',
      '**/node_modules/**',
      // Stale tests referencing deleted hsm-searchbar example
      'test/context-propagation-bug.test.ts',
      'test/context-propagation-bug.test.tsx',
      'test/debug-context-propagation.test.tsx',
      'test/sketch-inspector*.test.tsx',
    ],
    setupFiles: './test/vitest-console-groups',
  },
})