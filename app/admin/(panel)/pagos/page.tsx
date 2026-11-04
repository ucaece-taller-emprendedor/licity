import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { payments, works } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth/session'
import { Badge, EmptyState, Notice, PageHeader, StatCard } from '@/components/ui-kit'
import { COMMISSION_RATE, PAYMENT_STATUS } from '@/lib/constants'
import { formatDate, formatMoney, formatPercent } from '@/lib/format'

export const metadata = { title: 'Pagos y comisiones' }
export const dynamic = 'force-dynamic'

export default async function AdminPaymentsPage() {
  await requireRole('SUPERADMIN')
  const rows = await db
    .select({ payment: payments, title: works.title })
    .from(payments)
    .innerJoin(works, eq(works.id, payments.workId))
    .orderBy(desc(payments.completedAt))
    .limit(200)

  const volume = rows.reduce((a, r) => a + Number(r.payment.finalAmount), 0)
  const commission = rows.reduce((a, r) => a + Number(r.payment.commissionAmount), 0)

  return (
    <>
      <PageHeader
        title="Pagos y comisiones"
        description={`Se registra el pago final de cada obra finalizada con la comisión de Licity (${formatPercent(COMMISSION_RATE)}).`}
      />
      <div className="mb-6">
        <Notice tone="warning">
          Registro de prueba: Licity todavía no tiene pasarela de pago integrada. Estos montos son registros
          contables, no se procesó dinero real.
        </Notice>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <StatCard label="Volumen registrado" value={formatMoney(volume)} />
        <StatCard label="Comisiones" value={formatMoney(commission)} />
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Sin pagos" text="Los pagos aparecen cuando una PyME confirma la finalización de una obra." />
      ) : (
        <ul className="grid gap-3">
          {rows.map(({ payment, title }) => {
            const st = PAYMENT_STATUS[payment.status]
            return (
              <li key={payment.id} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-marron">{title}</p>
                  <p className="text-sm text-marron-suave">Finalizada el {formatDate(payment.completedAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-marron">
                    {formatMoney(payment.finalAmount)} · comisión {formatMoney(payment.commissionAmount)} (
                    {formatPercent(payment.commissionRate)})
                  </span>
                  {payment.isDemo && <Badge tone="warning">Demo</Badge>}
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
