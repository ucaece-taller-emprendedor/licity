import type { Metadata } from 'next'
import { DashboardShell } from '@/components/dashboard-shell'
import { requireRole } from '@/lib/session'

export const metadata: Metadata = { title: 'Panel PyME' }

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('CLIENT')
  return (
    <DashboardShell
      user={user}
      items={[
        { href: '/client', label: 'Resumen', exact: true },
        { href: '/client/obras', label: 'Mis obras' },
        { href: '/client/perfil', label: 'Perfil' },
      ]}
    >
      {children}
    </DashboardShell>
  )
}
