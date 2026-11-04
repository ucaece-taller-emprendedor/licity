import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { awards, contractorProfiles, payments, works } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth/session'
import { getOffersWithContractors } from '@/lib/queries'
import { Badge, DefinitionList, Notice, PageHeader, Section } from '@/components/ui-kit'
import { ConfirmForm } from '@/components/action-form'
import { WorkTimeline } from '@/components/work-timeline'
import { CAN_AWARD, CAN_CANCEL, OFFER_STATUS, PAYMENT_STATUS, VERIFICATION_STATUS, WORK_STATUS } from '@/lib/constants'
import { formatDate, formatDateTime, formatMoney, formatPercent } from '@/lib/format'
import { acceptOffer, cancelWork, confirmCompletion, startEvaluation } from '@/lib/actions/client'

export const metadata = { title: 'Detalle de obra' }

export default async function ClientWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole('CLIENT')
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const [work] = await db
    .select()
    .from(works)
    .where(and(eq(works.id, id), eq(works.clientUserId, me.id)))
  if (!work) notFound()

  const offerRows = await getOffersWithContractors(work.id)
  const visibleOffers = offerRows.filter((o) => o.status !== 'WITHDRAWN')
  const [award] = await db.select().from(awards).where(eq(awards.workId, work.id))
  const [payment] = await db.select().from(payments).where(eq(payments.workId, work.id))
  const [awardedContractor] = award
    ? await db.select().from(contractorProfiles).where(eq(contractorProfiles.userId, award.contractorUserId))
    : []

  const pendingOffers = visibleOffers.filter((o) => o.status === 'PENDING')
  const lowestPrice = pendingOffers.length ? Math.min(...pendingOffers.map((o) => Number(o.amount))) : null
  const shortest = pendingOffers.length ? Math.min(...pendingOffers.map((o) => o.estimatedDays)) : null
  const canAward = CAN_AWARD.includes(work.status)
  const status = WORK_STATUS[work.status]

  return (
    <>
      <PageHeader
        title={work.title}
        description={`${work.category} · ${work.city}`}
        action={<Badge tone={status.tone}>{status.label}</Badge>}
      />

      {work.reportedAt && (
        <div className="mb-6">
          <Notice tone="warning">Esta obra fue reportada y está en revisión por el equipo de Licity.</Notice>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <Section title="Datos de la obra">
            <p className="mb-5 whitespace-pre-line leading-relaxed text-marron">{work.description}</p>
            <DefinitionList
              items={[
                { label: 'Publicada', value: formatDate(work.publishedAt) },
                { label: 'Inicio deseado', value: formatDate(work.desiredStartDate) },
                { label: 'Plazo estimado', value: work.estimatedDays ? `${work.estimatedDays} días` : null },
                { label: 'Presupuesto estimado', value: work.budgetEstimate ? formatMoney(work.budgetEstimate) : null },
              ]}
            />
            {work.status === 'PUBLISHED' && (
              <Link href={`/app/pyme/obras/${work.id}/editar`} className="btn-outline mt-5">
                Editar obra
              </Link>
            )}
          </Section>

          <Section
            title={`Ofertas recibidas (${visibleOffers.length})`}
            action={
              work.status === 'RECEIVING_OFFERS' && pendingOffers.length > 0 ? (
                <ConfirmForm
                  action={startEvaluation}
                  fields={{ workId: work.id }}
                  label="Comenzar evaluación"
                  confirmText="Al comenzar la evaluación se dejan de aceptar ofertas nuevas. ¿Continuar?"
                />
              ) : undefined
            }
          >
            {visibleOffers.length === 0 ? (
              <p className="text-marron-suave">
                Todavía no recibiste ofertas. Te avisaremos cuando un contratista verificado envíe una propuesta.
              </p>
            ) : (
              <ul className="grid gap-4">
                {visibleOffers.map((o) => {
                  const verification = VERIFICATION_STATUS[o.verificationStatus]
                  const offerStatus = OFFER_STATUS[o.status]
                  const eligible =
                    o.status === 'PENDING' && o.verificationStatus === 'APPROVED' && o.contractorStatus === 'ACTIVE'
                  return (
                    <li key={o.id} className="rounded-2xl border border-border bg-background p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-2xl text-marron">{o.displayName}</h3>
                          <p className="text-sm text-marron-suave">
                            {o.specialty} · {o.city}
                            {o.yearsExperience ? ` · ${o.yearsExperience} años de experiencia` : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={verification.tone}>{verification.label}</Badge>
                          <Badge tone={offerStatus.tone}>{offerStatus.label}</Badge>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-marron-suave">Monto</p>
                          <p className="font-display text-3xl text-marron">{formatMoney(o.amount)}</p>
                          {o.status === 'PENDING' && lowestPrice === Number(o.amount) && pendingOffers.length > 1 && (
                            <Badge tone="success">Menor precio</Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-marron-suave">Plazo</p>
                          <p className="font-display text-3xl text-marron">{o.estimatedDays} días</p>
                          {o.status === 'PENDING' && shortest === o.estimatedDays && pendingOffers.length > 1 && (
                            <Badge tone="success">Menor plazo</Badge>
                          )}
                        </div>
                      </div>
                      <p className="mt-4 whitespace-pre-line text-marron">{o.description}</p>
                      {o.notes && <p className="mt-2 text-sm text-marron-suave">Notas: {o.notes}</p>}
                      <p className="mt-2 text-xs text-marron-suave">Enviada el {formatDateTime(o.createdAt)}</p>
                      {canAward && o.status === 'PENDING' && (
                        <div className="mt-4">
                          {eligible ? (
                            <ConfirmForm
                              action={acceptOffer}
                              fields={{ offerId: o.id }}
                              label="Adjudicar a este contratista"
                              confirmText={`Vas a adjudicar la obra a ${o.displayName} por ${formatMoney(o.amount)}. Las demás ofertas serán rechazadas.`}
                              buttonClassName="btn-primary"
                            />
                          ) : (
                            <Notice tone="warning">
                              Este contratista ya no está habilitado para recibir adjudicaciones.
                            </Notice>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>

          {work.status !== 'PUBLISHED' && work.status !== 'RECEIVING_OFFERS' && work.status !== 'EVALUATING' && (
            <WorkTimeline workId={work.id} progress={work.progress} />
          )}
        </div>

        <aside className="flex flex-col gap-6">
          {award && awardedContractor && (
            <Section title="Contratista adjudicado">
              <p className="text-xl font-bold text-marron">{awardedContractor.displayName}</p>
              <p className="text-sm text-marron-suave">
                {awardedContractor.specialty} · {awardedContractor.city}
              </p>
              {awardedContractor.phone && (
                <p className="mt-1 text-sm text-marron">Teléfono: {awardedContractor.phone}</p>
              )}
              <p className="mt-3 font-display text-3xl text-marron">{formatMoney(award.amount)}</p>
              <p className="text-xs text-marron-suave">Adjudicada el {formatDate(award.awardedAt)}</p>
            </Section>
          )}

          {work.status === 'IN_PROGRESS' && (
            <Section title="Finalización">
              {work.contractorDoneAt ? (
                <div className="flex flex-col gap-3">
                  <Notice tone="success">
                    El contratista marcó la obra como terminada el {formatDate(work.contractorDoneAt)}. Revisá el
                    trabajo y confirmá la finalización.
                  </Notice>
                  <ConfirmForm
                    action={confirmCompletion}
                    fields={{ workId: work.id }}
                    label="Confirmar finalización"
                    confirmText="Al confirmar, la obra se da por finalizada y se registra el pago final con la comisión de Licity."
                    buttonClassName="btn-primary"
                  />
                </div>
              ) : (
                <p className="text-sm text-marron-suave">
                  Cuando el contratista marque la obra como terminada vas a poder confirmar la finalización.
                </p>
              )}
            </Section>
          )}

          {payment && (
            <Section title="Pago final">
              <DefinitionList
                items={[
                  { label: 'Monto final', value: formatMoney(payment.finalAmount) },
                  {
                    label: `Comisión Licity (${formatPercent(payment.commissionRate)})`,
                    value: formatMoney(payment.commissionAmount),
                  },
                  { label: 'Finalizada', value: formatDate(payment.completedAt) },
                  {
                    label: 'Estado del pago',
                    value: <Badge tone={PAYMENT_STATUS[payment.status].tone}>{PAYMENT_STATUS[payment.status].label}</Badge>,
                  },
                ]}
              />
              {payment.status === 'PENDING_GATEWAY' && (
                <p className="mt-3 text-xs text-marron-suave">
                  La pasarela de pago todavía no está integrada: el pago queda registrado pero no se procesa dentro de
                  Licity.
                </p>
              )}
            </Section>
          )}

          {CAN_CANCEL.includes(work.status) && (
            <Section title="Cancelar obra">
              <ConfirmForm
                action={cancelWork}
                fields={{ workId: work.id }}
                label="Cancelar obra"
                confirmText="Se cancelará la obra y se avisará a los contratistas involucrados. Esta acción no se puede deshacer."
                reasonLabel="Motivo (opcional)"
                buttonClassName="btn-outline"
                confirmButtonClassName="btn-primary"
              />
            </Section>
          )}
          {work.status === 'CANCELLED' && work.cancelReason && (
            <Notice tone="neutral">Motivo de cancelación: {work.cancelReason}</Notice>
          )}
        </aside>
      </div>
    </>
  )
}
