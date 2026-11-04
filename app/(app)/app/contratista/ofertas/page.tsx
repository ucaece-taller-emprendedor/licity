import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { offers, works } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth/session'
import { Badge, EmptyState, PageHeader } from '@/components/ui-kit'
import { OFFER_STATUS, WORK_STATUS } from '@/lib/constants'
import { formatDate, formatMoney } from '@/lib/format'

export const metadata = { title: 'Mis ofertas' }
export const dynamic = 'force-dynamic'

export default async function MyOffersPage() {
  const me = await requireRole('BUSINESS')
  const rows = await db
    .select({ offer: offers, work: works })
    .from(offers)
    .innerJoin(works, eq(works.id, offers.workId))
    .where(eq(offers.contractorUserId, me.id))
    .orderBy(desc(offers.updatedAt))

  return (
    <>
      <PageHeader title="Mis ofertas" description="Las propuestas que enviaste y cómo van." />
      {rows.length === 0 ? (
        <EmptyState
          title="Todavía no enviaste ofertas"
          text="Mirá las obras abiertas y mandá tu primera propuesta."
          href="/app/contratista/obras"
          actionLabel="Ver obras disponibles"
        />
      ) : (
        <ul className="grid gap-4">
          {rows.map(({ offer, work }) => (
            <li key={offer.id}>
              <Link
                href={`/app/contratista/obras/${work.id}`}
                className="card flex flex-col gap-3 p-5 transition-colors hover:border-marron sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 className="text-2xl text-marron">{work.title}</h2>
                  <p className="text-sm text-marron-suave">
                    {work.city} · Enviada el {formatDate(offer.createdAt)} · {offer.estimatedDays} días
                  </p>
                  <p className="font-display text-2xl text-marron">{formatMoney(offer.amount)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={OFFER_STATUS[offer.status].tone}>{OFFER_STATUS[offer.status].label}</Badge>
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
