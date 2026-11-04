import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth/session'
import { Badge, EmptyState, PageHeader } from '@/components/ui-kit'
import { ConfirmForm } from '@/components/action-form'
import { ROLE_LABEL } from '@/lib/constants'
import { formatDate } from '@/lib/format'
import { setUserStatus } from '@/lib/actions/admin'

export const metadata = { title: 'Usuarios' }
export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const admin = await requireRole('SUPERADMIN')
  const rows = await db.select().from(user).orderBy(desc(user.createdAt)).limit(200)

  return (
    <>
      <PageHeader title="Usuarios" description="Todas las cuentas de la plataforma. Podés suspender o reactivar PyMEs y contratistas." />
      {rows.length === 0 ? (
        <EmptyState title="Sin usuarios" text="Todavía no hay cuentas registradas." />
      ) : (
        <ul className="grid gap-3">
          {rows.map((u) => (
            <li key={u.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-marron">
                  {u.name} {u.id === admin.id && <span className="text-sm font-normal text-marron-suave">(vos)</span>}
                </p>
                <p className="text-sm text-marron-suave">
                  {u.email} · alta {formatDate(u.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">{ROLE_LABEL[u.role]}</Badge>
                {u.isDemo && <Badge tone="warning">Demo</Badge>}
                <Badge tone={u.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {u.status === 'ACTIVE' ? 'Activo' : 'Suspendido'}
                </Badge>
                {u.role !== 'SUPERADMIN' && (
                  <ConfirmForm
                    action={setUserStatus}
                    fields={{ userId: u.id, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }}
                    label={u.status === 'ACTIVE' ? 'Suspender' : 'Reactivar'}
                    confirmText={
                      u.status === 'ACTIVE'
                        ? `Se suspende a ${u.name} y se cierran sus sesiones.`
                        : `Se reactiva la cuenta de ${u.name}.`
                    }
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

