import type { Metadata } from 'next'
import { DashboardShell } from '@/components/dashboard-shell'
import { requireRole } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Panel PyME' }

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('CLIENT')
  return (
    <DashboardShell
      user={user}
      items={[
        { href: '/app/pyme', label: 'Resumen', exact: true },
        { href: '/app/pyme/obras', label: 'Mis obras' },
        { href: '/app/pyme/perfil', label: 'Perfil' },
      ]}
    >
      {children}
    </DashboardShell>
  )
}
