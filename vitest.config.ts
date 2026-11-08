import { defineConfig } from 'vitest/config'

// Vitest solo corre los tests de reglas de Firestore (necesitan el emulador: npm run test:reglas).
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
    // Evita que firebase se cargue dos veces (ESM y CJS) y rompa el contexto de pruebas.
    server: { deps: { inline: [/@firebase\/rules-unit-testing/, /firebase\//] } },
  },
})
