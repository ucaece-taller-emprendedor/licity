import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { Cargando } from '@/components/ui'
import { panelDe, type Rol } from '@/config/app'
import { EstadoVerificacion } from '@/components/EstadoVerificacion'
import { useAuth } from './useAuth'

/** Exige sesión iniciada. Si falta el perfil (login con Google nuevo) lleva a completarlo. */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { usuario, perfil, cargando } = useAuth()
  const loc = useLocation()
  if (cargando) return <Cargando />
  if (!usuario) return <Navigate to="/app/ingresar" replace state={{ desde: loc.pathname }} />
  if (!perfil) return <Navigate to="/app/completar-perfil" replace />
  return children ?? <Outlet />
}

/** Exige uno de los roles dados. Los usuarios suspendidos no entran; los pendientes ven un aviso. */
export function RequireRole({ roles, children }: { roles: Rol[]; children?: ReactNode }) {
  const { perfil, cargando } = useAuth()
  if (cargando) return <Cargando />
  if (!perfil) return <Navigate to="/app/ingresar" replace />
  if (!roles.includes(perfil.role)) return <Navigate to={panelDe(perfil.role)} replace />
  if (perfil.status === 'suspendido') return <Navigate to="/app/suspendido" replace />
  return children ?? <Outlet />
}

/**
 * Exige admin. OJO: esto solo oculta pantallas. La seguridad real está en firestore.rules
 * (custom claim `admin: true` en el token), que se evalúa en el servidor de Firebase.
 */
export function RequireAdmin({ children }: { children?: ReactNode }) {
  const { usuario, esAdmin, cargando } = useAuth()
  if (cargando) return <Cargando />
  if (!usuario || !esAdmin) return <Navigate to="/admin/login" replace />
  return children ?? <Outlet />
}

/** Para las pantallas de contratista que requieren estar verificado: si no, explica el estado de la verificación. */
export function RequireVerificado({ children }: { children?: ReactNode }) {
  const { perfil, cargando } = useAuth()
  if (cargando || !perfil) return <Cargando />
  if (perfil.verificacion === 'APROBADO') return children ?? <Outlet />
  return <EstadoVerificacion />
}
