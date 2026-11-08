/**
 * Da permisos de administrador (custom claim `admin: true`) a una cuenta existente.
 *   npm run admin:dar -- persona@mail.com             → contra los EMULADORES (npm run emuladores)
 *   npm run admin:dar:prod -- persona@mail.com        → contra PRODUCCIÓN (necesita FIREBASE_PROJECT_ID y
 *                                                       GOOGLE_APPLICATION_CREDENTIALS; en general lo corre
 *                                                       la GitHub Action "Dar admin", no una persona)
 * La persona tiene que cerrar sesión y volver a ingresar para que el permiso se aplique.
 */
import { darAdmin } from './lib/admin-sdk'

const args = process.argv.slice(2)
const produccion = args.includes('--produccion')
const email = args.find(a => !a.startsWith('--'))?.trim().toLowerCase()

if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
  console.error('Uso: npm run admin:dar -- <email>')
  process.exit(1)
}

darAdmin(email, { produccion })
  .then(r => console.log(`✔ ${email} ahora es administrador en ${r.projectId}${r.esEmulador ? ' (emulador)' : ''}. uid: ${r.uid}. Tiene que volver a ingresar.`))
  .catch((e: unknown) => {
    console.error(`✖ ${e instanceof Error ? e.message : String(e)}`)
    process.exit(1)
  })
