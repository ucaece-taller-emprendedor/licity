import { requireRole } from '@/lib/auth/session'
import { PageHeader, Section } from '@/components/ui-kit'
import { WorkForm } from '@/components/client/work-form'

export const metadata = { title: 'Publicar obra' }

export default async function NewWorkPage() {
  await requireRole('CLIENT')
  return (
    <>
      <PageHeader
        title="Publicar obra"
        description="Describí lo que necesitás. Los contratistas verificados podrán enviarte ofertas."
      />
      <div className="max-w-3xl">
        <Section>
          <WorkForm />
        </Section>
      </div>
    </>
  )
}
