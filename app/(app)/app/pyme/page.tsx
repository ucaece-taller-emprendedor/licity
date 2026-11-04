import Link from 'next/link'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { offers, works } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth/session'
import { PageHeader, StatCard, Section, Badge, EmptyState } from '@/components/ui-kit'
import { NotificationsCard } from '@/components/notifications-card'
import { WORK_STATUS } from '@/lib/constants'
import { formatDate } from '@/lib/format'

export default async function ClientHome() {
  const me = await requireRole('CLIENT')

  const counts = await db
    .select({ status: works.status, count: sql<number>`count(*)::int` })
    .from(works)
    .where(eq(works.clientUserId, me.id))
    .groupBy(works.status)
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.count]))
  const total = counts.reduce((a, c) => a + c.count, 0)
  const open = (byStatus.PUBLISHED ?? 0) + (byStatus.RECEIVING_OFFERS ?? 0) + (byStatus.EVALUATING ?? 0)
  const running = (byStatus.AWARDED ?? 0) + (byStatus.IN_PROGRESS ?? 0)

  const [pending] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(offers)
    .innerJoin(works, eq(works.id, offers.workId))
    .where(and(eq(works.clientUserId, me.id), eq(offers.status, 'PENDING')))

  const recent = await db
    .select()
    .from(works)
    .where(eq(works.clientUserId, me.id))
    .orderBy(desc(works.updatedAt))
    .limit(5)

  return (
    <>
      <PageHeader
        title={`Hola, ${me.name.split(' ')[0]}`}
        description="Seguí tus obras, compará ofertas y elegí a tu contratista."
        action={
          <Link href="/app/pyme/obras/nueva" className="btn-primary">
            Publicar obra
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Obras publicadas" value={total} />
        <StatCard label="Recibiendo ofertas" value={open} />
        <StatCard label="Ofertas por revisar" value={pending?.count ?? 0} />
        <StatCard label="En marcha" value={running} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Section
          title="Obras recientes"
          action={
            <Link href="/app/pyme/obras" className="text-sm font-bold text-marron underline underline-offset-4">
              Ver todas
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              title="Todavía no publicaste obras"
              text="Publicá tu primera obra y empezá a recibir ofertas de contratistas verificados."
              href="/app/pyme/obras/nueva"
              actionLabel="Publicar obra"
            />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((w) => (
                <li key={w.id}>
                  <Link
                    href={`/app/pyme/obras/${w.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-bold text-marron">{w.title}</p>
                      <p className="text-sm text-marron-suave">
                        {w.city} · Publicada el {formatDate(w.publishedAt)}
                      </p>
                    </div>
                    <Badge tone={WORK_STATUS[w.status].tone}>{WORK_STATUS[w.status].label}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <NotificationsCard userId={me.id} />
      </div>
    </>
  )
}
