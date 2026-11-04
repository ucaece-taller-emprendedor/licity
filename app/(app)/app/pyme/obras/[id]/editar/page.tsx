import { notFound, redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { works } from '@/lib/db/schema'
import { requireRole } from '@/lib/session'
import { PageHeader, Section } from '@/components/ui-kit'
import { WorkForm } from '@/components/client/work-form'

export const metadata = { title: 'Editar obra' }

export default async function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole('CLIENT')
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const [work] = await db
    .select()
    .from(works)
    .where(and(eq(works.id, id), eq(works.clientUserId, me.id)))
  if (!work) notFound()
  if (work.status !== 'PUBLISHED') redirect(`/client/obras/${work.id}`)

  return (
    <>
      <PageHeader title="Editar obra" description="Podés editar la obra mientras no haya recibido ofertas." />
      <div className="max-w-3xl">
        <Section>
          <WorkForm work={work} />
        </Section>
      </div>
    </>
  )
}
