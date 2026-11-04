import type { Metadata } from 'next'
import { DashboardShell } from '@/components/dashboard-shell'
import { requireRole } from '@/lib/session'

export const metadata: Metadata = { title: 'Administración' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('SUPERADMIN')
  return (
    <DashboardShell
      user={user}
      items={[
        { href: '/admin', label: 'Resumen', exact: true },
        { href: '/admin/usuarios', label: 'Usuarios' },
        { href: '/admin/verificaciones', label: 'Verificaciones' },
        { href: '/admin/obras', label: 'Obras' },
        { href: '/admin/pagos', label: 'Pagos y comisiones' },
      ]}
    >
      {children}
    </DashboardShell>
  )
}
