import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['**/dev/**', '**/node_modules/**', '**/e2e/**'],
    setupFiles: './test/vitest-console-groups',
    coverage: {
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/index.ts',
        'src/function-types.ts',
        'src/state-keyed.ts',
        'src/state-machine.ts',
        'src/promise-machine.ts',
        'src/is-machine.ts',
        'src/nesting/index.ts',
        'src/nesting/inspect.ts',
        'src/nesting/submachine.ts',
        'src/nesting/types.ts',
        'docs/**',
        '**/node_modules/**'
      ]
    }
  },
})