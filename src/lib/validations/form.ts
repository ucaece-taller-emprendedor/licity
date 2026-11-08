import type { ZodType } from 'zod'

export type Errores = Record<string, string>

/** Valida un <form> con un esquema Zod. Devuelve los datos o los errores por campo (en español). */
export function validarFormulario<T>(schema: ZodType<T>, form: HTMLFormElement): { datos: T; errores?: undefined } | { datos?: undefined; errores: Errores } {
  const crudo = Object.fromEntries(new FormData(form).entries())
  const r = schema.safeParse(crudo)
  if (r.success) return { datos: r.data }
  const errores: Errores = {}
  for (const issue of r.error.issues) {
    const campo = String(issue.path[0] ?? 'general')
    errores[campo] ??= issue.message
  }
  return { errores }
}

/** Traduce los códigos de error de Firebase Auth/Firestore a mensajes claros. */
export function mensajeDeError(e: unknown): string {
  const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : ''
  const mapa: Record<string, string> = {
    'auth/invalid-credential': 'Email o contraseña incorrectos.',
    'auth/user-not-found': 'Email o contraseña incorrectos.',
    'auth/wrong-password': 'Email o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese email. Ingresá en su lugar.',
    'auth/weak-password': 'La contraseña es muy débil (mínimo 8 caracteres).',
    'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos y probá de nuevo.',
    'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permitila e intentá de nuevo.',
    'auth/network-request-failed': 'No hay conexión. Revisá tu internet.',
    'auth/invalid-email': 'El email no es válido.',
    'auth/user-disabled': 'Esta cuenta está deshabilitada. Escribinos si creés que es un error.',
    'permission-denied': 'No tenés permiso para hacer eso.',
  }
  return mapa[code] ?? 'Ocurrió un error inesperado. Probá de nuevo.'
}
