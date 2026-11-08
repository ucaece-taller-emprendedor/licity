import { initializeApp } from 'firebase/app'
import { browserLocalPersistence, connectAuthEmulator, getAuth, setPersistence } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const env = import.meta.env

// La config web de Firebase es PÚBLICA (va en el navegador). La seguridad la dan las reglas de Firestore.
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
})

export const auth = getAuth(app)
export const db = getFirestore(app)

// Sesión persistente: sigue abierta aunque se cierre el navegador.
void setPersistence(auth, browserLocalPersistence)

export const usandoEmuladores = env.VITE_USE_EMULATORS === 'true'

if (usandoEmuladores) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9421', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8421)
}
