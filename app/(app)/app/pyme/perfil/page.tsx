import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { clientProfiles } from '@/lib/db/schema'
import { requireRole } from '@/lib/session'
import { PageHeader, Section, Notice } from '@/components/ui-kit'
import { ActionForm } from '@/components/action-form'
import { Field } from '@/components/field'
import { updateClientProfile } from '@/lib/actions/client'

export const metadata = { title: 'Perfil de la empresa' }

export default async function ClientProfilePage() {
  const me = await requireRole('CLIENT')
  const [profile] = await db.select().from(clientProfiles).where(eq(clientProfiles.userId, me.id))

  return (
    <>
      <PageHeader title="Perfil de la empresa" description={`Cuenta: ${me.email}`} />
      <div className="max-w-2xl">
        {!profile ? (
          <Notice tone="danger">No encontramos el perfil de tu empresa. Escribinos a licity@gmail.com.</Notice>
        ) : (
          <Section>
            <ActionForm action={updateClientProfile} submitLabel="Guardar cambios">
              <Field name="companyName" label="Nombre de la empresa" required defaultValue={profile.companyName} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="cuit" label="CUIT" inputMode="numeric" defaultValue={profile.cuit ?? ''} />
                <Field name="city" label="Ciudad" required defaultValue={profile.city} />
              </div>
              <Field name="phone" label="Teléfono" type="tel" defaultValue={profile.phone ?? ''} />
            </ActionForm>
          </Section>
        )}
      </div>
    </>
  )
}
