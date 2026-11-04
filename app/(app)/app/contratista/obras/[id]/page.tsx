import { notFound } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { awards, clientProfiles, contractorProfiles, offers, works } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth/session'
import { Badge, DefinitionList, Notice, PageHeader, Section } from '@/components/ui-kit'
import { ConfirmForm } from '@/components/action-form'
import { OfferForm } from '@/components/contractor/offer-form'
import { MarkDoneButton, ProgressForm, ReportWorkButton, StartWorkButton } from '@/components/contractor/work-actions'
import { WorkTimeline } from '@/components/work-timeline'
import { OFFER_STATUS, OPEN_FOR_OFFERS, WORK_STATUS } from '@/lib/constants'
import { formatDate, formatMoney } from '@/lib/format'
import { withdrawOffer } from '@/lib/actions/business'

export const metadata = { title: 'Detalle de obra' }
export const dynamic = 'force-dynamic'

export default async function ContractorWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole('BUSINESS')
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const [work] = await db.select().from(works).where(eq(works.id, id))
  if (!work) notFound()

  const [profile] = await db.select().from(contractorProfiles).where(eq(contractorProfiles.userId, me.id))
  const [myOffer] = await db
    .select()
    .from(offers)
    .where(and(eq(offers.workId, work.id), eq(offers.contractorUserId, me.id)))
  const [award] = await db.select().from(awards).where(eq(awards.workId, work.id))
  const isMine = award?.contractorUserId === me.id

  const open = OPEN_FOR_OFFERS.includes(work.status)
  // Una obra cerrada solo la ve quien ofertó o ganó.
  if (!open && !myOffer && !isMine) notFound()

  const [client] = isMine
    ? await db.select().from(clientProfiles).where(eq(clientProfiles.userId, work.clientUserId))
    : []
  const verified = profile?.verificationStatus === 'APPROVED'
  const hasActiveOffer = myOffer && myOffer.status !== 'WITHDRAWN'
  const status = WORK_STATUS[work.status]

  return (
    <>
      <PageHeader
        title={work.title}
        description={`${work.category} · ${work.city}`}
        action={<Badge tone={status.tone}>{status.label}</Badge>}
      />
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
          </Section>

          {isMine && (
            <Section title="Tu trabajo">
              <div className="flex flex-col gap-4">
                {client && (
                  <p className="text-sm text-marron-suave">
                    PyME: <span className="font-bold text-marron">{client.companyName}</span>
                    {client.phone ? ` · Tel. ${client.phone}` : ''}
                  </p>
                )}
                {work.status === 'AWARDED' && <StartWorkButton workId={work.id} />}
                {work.status === 'IN_PROGRESS' && !work.contractorDoneAt && (
                  <>
                    <ProgressForm workId={work.id} current={work.progress} />
                    <MarkDoneButton workId={work.id} />
                  </>
                )}
                {work.status === 'IN_PROGRESS' && work.contractorDoneAt && (
                  <Notice tone="success">Marcaste la obra como terminada. Falta que la PyME confirme la finalización.</Notice>
                )}
                {work.status === 'COMPLETED' && <Notice tone="success">Obra finalizada. ¡Gracias por tu trabajo!</Notice>}
                {!work.reportedAt && work.status !== 'COMPLETED' && <ReportWorkButton workId={work.id} />}
                {work.reportedAt && <Notice tone="warning">Reportaste esta obra: está en revisión por Licity.</Notice>}
              </div>
            </Section>
          )}

          {work.status !== 'PUBLISHED' && work.status !== 'RECEIVING_OFFERS' && work.status !== 'EVALUATING' && isMine && (
            <WorkTimeline workId={work.id} progress={work.progress} />
          )}
        </div>

        <aside className="flex flex-col gap-6">
          {isMine && award && (
            <Section title="Adjudicada a vos">
              <p className="font-display text-3xl text-marron">{formatMoney(award.amount)}</p>
              <p className="text-xs text-marron-suave">Adjudicada el {formatDate(award.awardedAt)}</p>
            </Section>
          )}

          {myOffer && (
            <Section title="Tu oferta">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-3xl text-marron">{formatMoney(myOffer.amount)}</p>
                  <Badge tone={OFFER_STATUS[myOffer.status].tone}>{OFFER_STATUS[myOffer.status].label}</Badge>
                </div>
                <p className="text-sm text-marron-suave">Plazo: {myOffer.estimatedDays} días</p>
                <p className="whitespace-pre-line text-sm text-marron">{myOffer.description}</p>
                {myOffer.status === 'PENDING' && open && (
                  <ConfirmForm
                    action={withdrawOffer}
                    fields={{ offerId: myOffer.id }}
                    label="Retirar oferta"
                    confirmText="Vas a retirar tu oferta. Podés volver a enviar otra mientras la obra siga abierta."
                  />
                )}
              </div>
            </Section>
          )}

          {open && !hasActiveOffer && (
            <Section title="Enviar oferta">
              {verified ? (
                <OfferForm workId={work.id} />
              ) : (
                <Notice tone="warning">
                  Tu cuenta tiene que estar verificada por Licity para enviar ofertas.
                </Notice>
              )}
            </Section>
          )}
        </aside>
      </div>
    </>
  )
}
