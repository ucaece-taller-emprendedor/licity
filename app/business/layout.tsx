import type { Metadata } from 'next'
import { DashboardShell } from '@/components/dashboard-shell'
import { requireRole } from '@/lib/session'

export const metadata: Metadata = { title: 'Panel contratista' }

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('BUSINESS')
  return (
    <DashboardShell
      user={user}
      items={[
        { href: '/business', label: 'Resumen', exact: true },
        { href: '/business/obras', label: 'Obras disponibles' },
        { href: '/business/ofertas', label: 'Mis ofertas' },
        { href: '/business/trabajos', label: 'Mis trabajos' },
        { href: '/business/perfil', label: 'Perfil' },
      ]}
    >
      {children}
    </DashboardShell>
  )
}
