import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

/** Proyecto "demo-" de los emuladores: nunca toca producción. Cambiarlo junto con firebase.json/package.json. */
export const PROYECTO_EMULADOR = 'demo-licity'

export const HOST_AUTH_EMULADOR = '127.0.0.1:9421'
export const HOST_FIRESTORE_EMULADOR = '127.0.0.1:8421'

/**
 * Inicia firebase-admin.
 * - Por defecto apunta a los EMULADORES (no hace falta ninguna credencial).
 * - Con { produccion: true } usa las credenciales por defecto de Google (GOOGLE_APPLICATION_CREDENTIALS)
 *   y el proyecto de FIREBASE_PROJECT_ID. Se niega a seguir si hay variables de emulador definidas.
 */
export function iniciarAdmin({ produccion = false }: { produccion?: boolean } = {}) {
  if (produccion) {
    if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      throw new Error('Hay variables de emulador definidas: no se puede operar en producción así.')
    }
    const projectId = process.env.FIREBASE_PROJECT_ID
    if (!projectId) throw new Error('Falta FIREBASE_PROJECT_ID (id del proyecto Firebase).')
    if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId })
    return { auth: getAuth(), db: getFirestore(), projectId, esEmulador: false }
  }
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= HOST_AUTH_EMULADOR
  process.env.FIRESTORE_EMULATOR_HOST ??= HOST_FIRESTORE_EMULADOR
  const projectId = process.env.GCLOUD_PROJECT ?? PROYECTO_EMULADOR
  if (!projectId.startsWith('demo-')) throw new Error(`Por seguridad el modo emulador exige un proyecto "demo-*" (hay "${projectId}").`)
  if (!getApps().length) initializeApp({ projectId })
  return { auth: getAuth(), db: getFirestore(), projectId, esEmulador: true }
}

/** Da el custom claim `admin: true` (y deja su perfil en Firestore). Requiere que la persona ya tenga cuenta. */
export async function darAdmin(email: string, opciones: { produccion?: boolean } = {}) {
  const { auth, db, projectId, esEmulador } = iniciarAdmin(opciones)
  const usuario = await auth.getUserByEmail(email).catch(() => {
    throw new Error(`No existe ninguna cuenta con el email ${email} en ${projectId}. Primero tiene que registrarse (o crearla en la consola de Firebase → Authentication).`)
  })
  await auth.setCustomUserClaims(usuario.uid, { ...(usuario.customClaims ?? {}), admin: true })
  await db.doc(`users/${usuario.uid}`).set(
    { email, displayName: usuario.displayName ?? email, role: 'admin', status: 'activo', isDemo: false, createdAt: new Date() },
    { merge: true },
  )
  return { uid: usuario.uid, projectId, esEmulador }
}
