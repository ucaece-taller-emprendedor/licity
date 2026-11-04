import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contractorProfiles } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth/session'
import { Badge, DefinitionList, Notice, PageHeader, Section } from '@/components/ui-kit'
import { ContractorProfileForm, ResubmitVerification } from '@/components/contractor/profile-forms'
import { VERIFICATION_STATUS } from '@/lib/constants'

export const metadata = { title: 'Perfil de contratista' }
export const dynamic = 'force-dynamic'

export default async function ContractorProfilePage() {
  const me = await requireRole('BUSINESS')
  const [profile] = await db.select().from(contractorProfiles).where(eq(contractorProfiles.userId, me.id))

  if (!profile) {
    return (
      <>
        <PageHeader title="Perfil" />
        <Notice tone="danger">No encontramos tu perfil. Escribinos a licity@gmail.com.</Notice>
      </>
    )
  }
  const v = VERIFICATION_STATUS[profile.verificationStatus]

  return (
    <>
      <PageHeader title="Perfil de contratista" description={`Cuenta: ${me.email}`} action={<Badge tone={v.tone}>{v.label}</Badge>} />
      <div className="grid max-w-2xl gap-6">
        {profile.verificationStatus === 'REJECTED' && (
          <Section title="Verificación rechazada">
            <p className="mb-4 text-marron">{profile.rejectionReason ?? 'Sin motivo indicado.'}</p>
            <ResubmitVerification />
          </Section>
        )}
        {profile.verificationStatus === 'PENDING' && (
          <Notice tone="warning">Tu perfil está en revisión. Te avisamos cuando se resuelva.</Notice>
        )}
        <Section title="Datos fiscales">
          <DefinitionList items={[{ label: 'CUIT', value: profile.cuit }]} />
        </Section>
        <Section title="Datos del perfil">
          <ContractorProfileForm profile={profile} />
        </Section>
      </div>
    </>
  )
}
