import type { Metadata } from 'next'
import { DashboardShell } from '@/components/dashboard-shell'
import { requireRole } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Panel contratista' }

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('BUSINESS')
  return (
    <DashboardShell
      user={user}
      items={[
        { href: '/app/contratista', label: 'Resumen', exact: true },
        { href: '/app/contratista/obras', label: 'Obras disponibles' },
        { href: '/app/contratista/ofertas', label: 'Mis ofertas' },
        { href: '/app/contratista/trabajos', label: 'Mis trabajos' },
        { href: '/app/contratista/perfil', label: 'Perfil' },
      ]}
    >
      {children}
    </DashboardShell>
  )
}
