import Link from 'next/link'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { awards, contractorProfiles, offers, works } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth/session'
import { Badge, Notice, PageHeader, StatCard } from '@/components/ui-kit'
import { NotificationsCard } from '@/components/notifications-card'
import { VERIFICATION_STATUS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function ContractorHome() {
  const me = await requireRole('BUSINESS')
  const [profile] = await db.select().from(contractorProfiles).where(eq(contractorProfiles.userId, me.id))
  const verification = profile ? VERIFICATION_STATUS[profile.verificationStatus] : null

  const [pendingOffers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(offers)
    .where(and(eq(offers.contractorUserId, me.id), eq(offers.status, 'PENDING')))
  const [active] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(awards)
    .innerJoin(works, eq(works.id, awards.workId))
    .where(and(eq(awards.contractorUserId, me.id), sql`${works.status} in ('AWARDED','IN_PROGRESS')`))
  const [open] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(works)
    .where(sql`${works.status} in ('PUBLISHED','RECEIVING_OFFERS')`)

  return (
    <>
      <PageHeader
        title={`Hola, ${me.name.split(' ')[0]}`}
        description="Encontrá obras, enviá ofertas y seguí tus trabajos."
        action={
          <Link href="/app/contratista/obras" className="btn-primary">
            Ver obras disponibles
          </Link>
        }
      />
      {profile && profile.verificationStatus !== 'APPROVED' && (
        <div className="mb-6">
          <Notice tone={profile.verificationStatus === 'REJECTED' ? 'danger' : 'warning'}>
            {profile.verificationStatus === 'PENDING'
              ? 'Tu cuenta está pendiente de verificación. Cuando el equipo de Licity la apruebe vas a poder enviar ofertas.'
              : `Tu verificación fue rechazada${profile.rejectionReason ? `: ${profile.rejectionReason}` : ''}. Corregí tu perfil y pedí una nueva revisión.`}{' '}
            <Link href="/app/contratista/perfil" className="font-bold underline underline-offset-4">
              Ir a mi perfil
            </Link>
          </Notice>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Obras abiertas" value={open?.count ?? 0} />
        <StatCard label="Ofertas pendientes" value={pendingOffers?.count ?? 0} />
        <StatCard label="Trabajos activos" value={active?.count ?? 0} />
        <div className="card p-5">
          <p className="text-sm font-bold text-marron-suave">Verificación</p>
          <div className="mt-3">{verification && <Badge tone={verification.tone}>{verification.label}</Badge>}</div>
        </div>
      </div>
      <div className="mt-8 max-w-xl">
        <NotificationsCard userId={me.id} />
      </div>
    </>
  )
}
