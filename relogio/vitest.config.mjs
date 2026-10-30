import { defineConfig } from 'vitest/config'

// Pure-logic tests for the watch app. Runs with the repository's Vitest:
//   cd /opt/data/projetos/gym-app && npx vitest run --root relogio
// Globals are enabled because `zeus build` rollup-bundles every .js file in
// the project (tests included) and an `import ... from 'vitest'` breaks it.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.js']
  }
})
