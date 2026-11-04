import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import type { Role } from '@/lib/db/schema'

export type CurrentUser = {
  id: string
  name: string
  email: string
  role: Role
  status: 'ACTIVE' | 'SUSPENDED'
  isDemo: boolean
  needsRoleSelection: boolean
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const u = session.user as typeof session.user & {
    role: Role
    status: 'ACTIVE' | 'SUSPENDED'
    isDemo: boolean
    needsRoleSelection: boolean
  }
  if (u.status !== 'ACTIVE') return null
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    isDemo: Boolean(u.isDemo),
    needsRoleSelection: Boolean(u.needsRoleSelection),
  }
})

/** Destino de cada usuario después de ingresar. */
export function homeFor(user: Pick<CurrentUser, 'role' | 'needsRoleSelection'>) {
  if (user.role === 'SUPERADMIN') return '/admin'
  if (user.needsRoleSelection) return '/app/tipo'
  if (user.role === 'BUSINESS') return '/app/contratista'
  return '/app/pyme'
}

/** Para páginas y layouts: redirige si no hay sesión o el rol no corresponde. */
export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect(role === 'SUPERADMIN' ? '/admin/ingresar' : '/app/ingresar')
  if (user.role !== role || (role !== 'SUPERADMIN' && user.needsRoleSelection)) redirect(homeFor(user))
  return user
}

/** Para server actions y endpoints: el rol se valida siempre en el servidor. */
export async function requireRoleForAction(role: Role): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user || user.role !== role || (role !== 'SUPERADMIN' && user.needsRoleSelection)) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}
