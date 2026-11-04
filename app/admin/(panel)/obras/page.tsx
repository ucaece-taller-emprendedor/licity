import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { clientProfiles, offers, works } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth/session'
import { Badge, EmptyState, PageHeader } from '@/components/ui-kit'
import { ConfirmForm } from '@/components/action-form'
import { CAN_CANCEL, WORK_STATUS } from '@/lib/constants'
import { formatDate, formatMoney } from '@/lib/format'
import { adminCancelWork, resolveReport } from '@/lib/actions/admin'

export const metadata = { title: 'Obras' }
export const dynamic = 'force-dynamic'

export default async function AdminWorksPage() {
  await requireRole('SUPERADMIN')
  const rows = await db
    .select({
      work: works,
      companyName: clientProfiles.companyName,
      offerCount: sql<number>`(select count(*)::int from ${offers} where ${offers.workId} = ${works.id})`,
    })
    .from(works)
    .leftJoin(clientProfiles, eq(clientProfiles.userId, works.clientUserId))
    .orderBy(sql`${works.reportedAt} is null`, desc(works.createdAt))
    .limit(200)

  return (
    <>
      <PageHeader title="Obras" description="Todas las obras publicadas. Las reportadas aparecen primero." />
      {rows.length === 0 ? (
        <EmptyState title="Sin obras" text="Todavía no se publicó ninguna obra." />
      ) : (
        <ul className="grid gap-4">
          {rows.map(({ work, companyName, offerCount }) => {
            const st = WORK_STATUS[work.status]
            return (
              <li key={work.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl text-marron">{work.title}</h2>
                    <p className="text-sm text-marron-suave">
                      {companyName ?? 'PyME'} · {work.category} · {work.city} · {formatDate(work.publishedAt)}
                    </p>
                    <p className="text-sm text-marron-suave">
                      {offerCount} {offerCount === 1 ? 'oferta' : 'ofertas'}
                      {work.budgetEstimate ? ` · Presupuesto ${formatMoney(work.budgetEstimate)}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {work.isDemo && <Badge tone="warning">Demo</Badge>}
                    {work.reportedAt && <Badge tone="danger">Reportada</Badge>}
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                </div>
                {work.reportedAt && (
                  <div className="mt-4 rounded-xl bg-[#f6d6cf] p-4 text-sm text-[#7a1f10]">
                    <p className="font-bold">Motivo del reporte</p>
                    <p>{work.reportReason}</p>
                    <div className="mt-3">
                      <ConfirmForm
                        action={resolveReport}
                        fields={{ workId: work.id }}
                        label="Marcar reporte como resuelto"
                        confirmText="El reporte se cierra y la obra deja de figurar como reportada."
                      />
                    </div>
                  </div>
                )}
                {CAN_CANCEL.includes(work.status) && (
                  <div className="mt-4">
                    <ConfirmForm
                      action={adminCancelWork}
                      fields={{ workId: work.id }}
                      label="Cancelar por moderación"
                      confirmText="Se cancela la obra y se avisa a la PyME y a los contratistas involucrados."
                      reasonLabel="Motivo (obligatorio)"
                      reasonRequired
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
