import { sembrar } from '../../scripts/seed'

// Corre una vez antes de los tests: carga los datos DEMO en los emuladores.
export default async function globalSetup() {
  await sembrar()
}
