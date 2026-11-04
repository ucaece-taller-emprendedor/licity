import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { awards, works } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth/session'
import { Badge, EmptyState, PageHeader } from '@/components/ui-kit'
import { WORK_STATUS } from '@/lib/constants'
import { formatDate, formatMoney } from '@/lib/format'

export const metadata = { title: 'Mis trabajos' }
export const dynamic = 'force-dynamic'

export default async function MyJobsPage() {
  const me = await requireRole('BUSINESS')
  const rows = await db
    .select({ award: awards, work: works })
    .from(awards)
    .innerJoin(works, eq(works.id, awards.workId))
    .where(eq(awards.contractorUserId, me.id))
    .orderBy(desc(awards.awardedAt))

  return (
    <>
      <PageHeader title="Mis trabajos" description="Obras que te adjudicaron." />
      {rows.length === 0 ? (
        <EmptyState
          title="Todavía no tenés trabajos"
          text="Cuando una PyME acepte tu oferta, la obra aparece acá."
          href="/app/contratista/obras"
          actionLabel="Ver obras disponibles"
        />
      ) : (
        <ul className="grid gap-4">
          {rows.map(({ award, work }) => (
            <li key={work.id}>
              <Link
                href={`/app/contratista/obras/${work.id}`}
                className="card flex flex-col gap-3 p-5 transition-colors hover:border-marron sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 className="text-2xl text-marron">{work.title}</h2>
                  <p className="text-sm text-marron-suave">
                    {work.city} · Adjudicada el {formatDate(award.awardedAt)} · Avance {work.progress}%
                  </p>
                  <p className="font-display text-2xl text-marron">{formatMoney(award.amount)}</p>
                </div>
                <Badge tone={WORK_STATUS[work.status].tone}>{WORK_STATUS[work.status].label}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
