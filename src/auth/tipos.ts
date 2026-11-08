import type { EstadoCuenta, Rol, Verificacion } from '@/config/app'

export type Perfil = {
  uid: string
  email: string
  displayName: string
  role: Rol
  status: EstadoCuenta
  /** Solo contratistas. */
  verificacion: Verificacion | null
  motivoRechazo: string | null
  isDemo: boolean
}
