import Link from 'next/link'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contractorProfiles, payments, user, works } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth/session'
import { PageHeader, Section, StatCard } from '@/components/ui-kit'
import { formatMoney } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function AdminHome() {
  await requireRole('SUPERADMIN')

  const [users] = await db.select({ count: sql<number>`count(*)::int` }).from(user)
  const [pending] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contractorProfiles)
    .where(eq(contractorProfiles.verificationStatus, 'PENDING'))
  const [open] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(works)
    .where(sql`${works.status} in ('PUBLISHED','RECEIVING_OFFERS','EVALUATING')`)
  const [reported] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(works)
    .where(sql`${works.reportedAt} is not null`)
  const [money] = await db
    .select({
      volume: sql<string>`coalesce(sum(${payments.finalAmount}), 0)`,
      commission: sql<string>`coalesce(sum(${payments.commissionAmount}), 0)`,
    })
    .from(payments)

  return (
    <>
      <PageHeader title="Resumen" description="Estado general de la plataforma." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Usuarios" value={users?.count ?? 0} />
        <StatCard label="Verificaciones pendientes" value={pending?.count ?? 0} />
        <StatCard label="Obras abiertas" value={open?.count ?? 0} />
        <StatCard label="Obras reportadas" value={reported?.count ?? 0} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Volumen de obras finalizadas" value={formatMoney(money?.volume)} hint="Registro de prueba" />
        <StatCard label="Comisiones registradas" value={formatMoney(money?.commission)} hint="Registro de prueba" />
      </div>
      <Section title="Accesos rápidos" className="mt-6">
        <ul className="flex flex-wrap gap-3">
          <li><Link href="/admin/verificaciones" className="btn-primary">Revisar verificaciones</Link></li>
          <li><Link href="/admin/usuarios" className="btn-outline">Usuarios</Link></li>
          <li><Link href="/admin/obras" className="btn-outline">Obras</Link></li>
          <li><Link href="/admin/pagos" className="btn-outline">Pagos y comisiones</Link></li>
        </ul>
      </Section>
    </>
  )
}
