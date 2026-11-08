import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { readFileSync } from 'node:fs'

export async function crearEntorno(proyecto: string): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: proyecto,
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8421 },
  })
}
