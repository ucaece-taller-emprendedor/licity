import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contractorProfiles, user, verificationRequests } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth/session'
import { Badge, DefinitionList, PageHeader, Section } from '@/components/ui-kit'
import { ConfirmForm } from '@/components/action-form'
import { VERIFICATION_STATUS } from '@/lib/constants'
import { formatDateTime } from '@/lib/format'
import { reviewVerification } from '@/lib/actions/admin'

export const metadata = { title: 'Verificaciones' }
export const dynamic = 'force-dynamic'

export default async function AdminVerificationsPage() {
  await requireRole('SUPERADMIN')
  const rows = await db
    .select({
      request: verificationRequests,
      profile: contractorProfiles,
      email: user.email,
      isDemo: user.isDemo,
    })
    .from(verificationRequests)
    .innerJoin(contractorProfiles, eq(contractorProfiles.userId, verificationRequests.contractorUserId))
    .innerJoin(user, eq(user.id, verificationRequests.contractorUserId))
    .orderBy(desc(verificationRequests.submittedAt))
    .limit(100)

  const pending = rows.filter((r) => r.request.status === 'PENDING')
  const resolved = rows.filter((r) => r.request.status !== 'PENDING')

  return (
    <>
      <PageHeader
        title="Verificaciones"
        description="Los contratistas solo pueden ofertar después de que los apruebes."
      />
      <Section title={`Pendientes (${pending.length})`}>
        {pending.length === 0 ? (
          <p className="text-marron-suave">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="grid gap-4">
            {pending.map(({ request, profile, email, isDemo }) => (
              <li key={request.id} className="rounded-2xl border border-border bg-background p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl text-marron">{profile.displayName}</h3>
                    <p className="text-sm text-marron-suave">{email} · enviada {formatDateTime(request.submittedAt)}</p>
                  </div>
                  {isDemo && <Badge tone="warning">Demo</Badge>}
                </div>
                <div className="mt-4">
                  <DefinitionList
                    items={[
                      { label: 'CUIT', value: profile.cuit },
                      { label: 'Especialidad', value: profile.specialty },
                      { label: 'Ciudad', value: profile.city },
                      { label: 'Zona de cobertura', value: profile.coverageZone },
                      { label: 'Años de experiencia', value: profile.yearsExperience },
                      { label: 'Teléfono', value: profile.phone },
                    ]}
                  />
                  {profile.description && <p className="mt-4 text-marron">{profile.description}</p>}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <ConfirmForm
                    action={reviewVerification}
                    fields={{ requestId: request.id, decision: 'APPROVED' }}
                    label="Aprobar contratista"
                    confirmText={`Vas a verificar a ${profile.displayName}. Podrá enviar ofertas.`}
                    buttonClassName="btn-primary"
                  />
                  <ConfirmForm
                    action={reviewVerification}
                    fields={{ requestId: request.id, decision: 'REJECTED' }}
                    label="Rechazar"
                    confirmText="Indicá el motivo: lo va a ver el contratista."
                    reasonLabel="Motivo del rechazo"
                    reasonRequired
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Historial" className="mt-6">
        {resolved.length === 0 ? (
          <p className="text-marron-suave">Todavía no resolviste solicitudes.</p>
        ) : (
          <ul className="divide-y divide-border">
            {resolved.map(({ request, profile, email }) => {
              const st = VERIFICATION_STATUS[request.status]
              return (
                <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-bold text-marron">{profile.displayName}</p>
                    <p className="text-sm text-marron-suave">
                      {email} · {formatDateTime(request.reviewedAt)}
                      {request.reason ? ` · ${request.reason}` : ''}
                    </p>
                  </div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </li>
              )
            })}
          </ul>
        )}
      </Section>
    </>
  )
}
