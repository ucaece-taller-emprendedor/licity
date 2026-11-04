import Link from 'next/link'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { offers, works } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth/session'
import { Badge, EmptyState, PageHeader } from '@/components/ui-kit'
import { WORK_STATUS } from '@/lib/constants'
import { formatDate, formatMoney } from '@/lib/format'

export const metadata = { title: 'Mis obras' }

export default async function ClientWorksPage() {
  const me = await requireRole('CLIENT')
  const rows = await db
    .select({
      work: works,
      offerCount: sql<number>`(select count(*)::int from ${offers} where ${offers.workId} = ${works.id} and ${offers.status} in ('PENDING','ACCEPTED'))`,
    })
    .from(works)
    .where(eq(works.clientUserId, me.id))
    .orderBy(desc(works.createdAt))

  return (
    <>
      <PageHeader
        title="Mis obras"
        description="Todas las obras que publicaste en Licity."
        action={
          <Link href="/app/pyme/obras/nueva" className="btn-primary">
            Publicar obra
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          title="Todavía no publicaste obras"
          text="Cuando publiques una obra, los contratistas verificados podrán enviarte ofertas."
          href="/app/pyme/obras/nueva"
          actionLabel="Publicar mi primera obra"
        />
      ) : (
        <ul className="grid gap-4">
          {rows.map(({ work, offerCount }) => (
            <li key={work.id}>
              <Link
                href={`/app/pyme/obras/${work.id}`}
                className="card flex flex-col gap-3 p-5 transition-colors hover:border-marron sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 className="text-2xl text-marron">{work.title}</h2>
                  <p className="text-sm text-marron-suave">
                    {work.category} · {work.city} · Publicada el {formatDate(work.publishedAt)}
                  </p>
                  {work.budgetEstimate && (
                    <p className="text-sm text-marron-suave">Presupuesto estimado: {formatMoney(work.budgetEstimate)}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-marron">
                    {offerCount} {offerCount === 1 ? 'oferta' : 'ofertas'}
                  </span>
                  <Badge tone={WORK_STATUS[work.status].tone}>{WORK_STATUS[work.status].label}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
