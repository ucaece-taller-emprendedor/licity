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
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const u = session.user as typeof session.user & {
    role: Role
    status: 'ACTIVE' | 'SUSPENDED'
    isDemo: boolean
  }
  if (u.status !== 'ACTIVE') return null
  return { id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, isDemo: Boolean(u.isDemo) }
})

export function homeFor(role: Role) {
  if (role === 'SUPERADMIN') return '/admin'
  if (role === 'BUSINESS') return '/business'
  return '/client'
}

export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/ingresar')
  if (user.role !== role) redirect(homeFor(user.role))
  return user
}

export async function requireRoleForAction(role: Role): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user || user.role !== role) throw new Error('UNAUTHORIZED')
  return user
}
