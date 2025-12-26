import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['**/dev/**', '**/node_modules/**'],
    setupFiles: './test/vitest-console-groups',
  },
})