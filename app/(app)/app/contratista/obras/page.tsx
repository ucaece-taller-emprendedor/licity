import Link from 'next/link'
import { desc, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { offers, works } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth/session'
import { Badge, EmptyState, PageHeader } from '@/components/ui-kit'
import { WORK_STATUS } from '@/lib/constants'
import { formatDate, formatMoney } from '@/lib/format'

export const metadata = { title: 'Obras disponibles' }
export const dynamic = 'force-dynamic'

export default async function AvailableWorksPage() {
  const me = await requireRole('BUSINESS')
  const rows = await db
    .select({
      work: works,
      offerCount: sql<number>`(select count(*)::int from ${offers} where ${offers.workId} = ${works.id} and ${offers.status} = 'PENDING')`,
      mine: sql<boolean>`exists (select 1 from ${offers} where ${offers.workId} = ${works.id} and ${offers.contractorUserId} = ${me.id} and ${offers.status} = 'PENDING')`,
    })
    .from(works)
    .where(sql`${works.status} in ('PUBLISHED','RECEIVING_OFFERS')`)
    .orderBy(desc(works.publishedAt))

  return (
    <>
      <PageHeader title="Obras disponibles" description="Obras de PyMEs que están recibiendo ofertas." />
      {rows.length === 0 ? (
        <EmptyState title="No hay obras abiertas" text="Cuando una PyME publique una obra la vas a ver acá." />
      ) : (
        <ul className="grid gap-4">
          {rows.map(({ work, offerCount, mine }) => (
            <li key={work.id}>
              <Link
                href={`/app/contratista/obras/${work.id}`}
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
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-bold text-marron">
                    {offerCount} {offerCount === 1 ? 'oferta' : 'ofertas'}
                  </span>
                  {mine && <Badge tone="success">Ya ofertaste</Badge>}
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
