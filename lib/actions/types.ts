export type ActionState = {
  ok?: boolean
  error?: string
  message?: string
}

export const UNAUTHORIZED: ActionState = {
  error: 'Tu sesión venció o no tenés permiso para esta acción. Volvé a ingresar.',
}
