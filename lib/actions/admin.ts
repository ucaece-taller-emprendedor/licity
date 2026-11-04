'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  contractorProfiles,
  offers,
  session,
  user,
  verificationRequests,
  workUpdates,
  works,
} from '@/lib/db/schema'
import { requireRoleForAction } from '@/lib/auth/session'
import { notify } from '@/lib/notify'
import { UNAUTHORIZED, type ActionState } from '@/lib/actions/types'

const idSchema = z.string().uuid()

export async function reviewVerification(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let admin
  try {
    admin = await requireRoleForAction('SUPERADMIN')
  } catch {
    return UNAUTHORIZED
  }
  const parsed = z
    .object({
      requestId: idSchema,
      decision: z.enum(['APPROVED', 'REJECTED']),
      reason: z.string().trim().max(500).optional(),
    })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Solicitud inválida.' }
  const d = parsed.data
  if (d.decision === 'REJECTED' && !d.reason) return { error: 'Indicá el motivo del rechazo.' }

  const outcome = await db.transaction(async (tx): Promise<ActionState> => {
    const [request] = await tx
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.id, d.requestId))
      .for('update')
    if (!request || request.status !== 'PENDING') return { error: 'Esta solicitud ya fue resuelta.' }
    const now = new Date()
    await tx
      .update(verificationRequests)
      .set({ status: d.decision, reason: d.reason || null, reviewedAt: now, reviewedBy: admin.id })
      .where(eq(verificationRequests.id, request.id))
    await tx
      .update(contractorProfiles)
      .set({
        verificationStatus: d.decision,
        rejectionReason: d.decision === 'REJECTED' ? d.reason : null,
        verifiedAt: d.decision === 'APPROVED' ? now : null,
        verifiedBy: d.decision === 'APPROVED' ? admin.id : null,
        updatedAt: now,
      })
      .where(eq(contractorProfiles.userId, request.contractorUserId))
    await notify(
      request.contractorUserId,
      d.decision === 'APPROVED'
        ? { title: 'Tu cuenta fue verificada', body: 'Ya podés enviar ofertas.', href: '/app/contratista/obras' }
        : { title: 'Verificación rechazada', body: d.reason, href: '/app/contratista/perfil' },
      tx,
    )
    return {
      ok: true,
      message: d.decision === 'APPROVED' ? 'Contratista verificado.' : 'Solicitud rechazada.',
    }
  })
  if (outcome.ok) revalidatePath('/admin', 'layout')
  return outcome
}

export async function setUserStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let admin
  try {
    admin = await requireRoleForAction('SUPERADMIN')
  } catch {
    return UNAUTHORIZED
  }
  const parsed = z
    .object({ userId: z.string().min(1), status: z.enum(['ACTIVE', 'SUSPENDED']) })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Solicitud inválida.' }
  const { userId, status } = parsed.data
  if (userId === admin.id) return { error: 'No podés suspender tu propia cuenta.' }

  const [target] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId))
  if (!target) return { error: 'Usuario no encontrado.' }
  if (target.role === 'SUPERADMIN') return { error: 'No se puede modificar a otro superadministrador.' }

  await db.transaction(async (tx) => {
    await tx.update(user).set({ status, updatedAt: new Date() }).where(eq(user.id, userId))
    if (status === 'SUSPENDED') await tx.delete(session).where(eq(session.userId, userId))
  })
  revalidatePath('/admin', 'layout')
  return { ok: true, message: status === 'SUSPENDED' ? 'Usuario suspendido.' : 'Usuario reactivado.' }
}

export async function resolveReport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireRoleForAction('SUPERADMIN')
  } catch {
    return UNAUTHORIZED
  }
  const id = idSchema.safeParse(formData.get('workId'))
  if (!id.success) return { error: 'Obra no encontrada.' }
  await db
    .update(works)
    .set({ reportedAt: null, reportReason: null, reportedBy: null })
    .where(eq(works.id, id.data))
  revalidatePath('/admin', 'layout')
  return { ok: true, message: 'Reporte resuelto.' }
}

export async function adminCancelWork(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let admin
  try {
    admin = await requireRoleForAction('SUPERADMIN')
  } catch {
    return UNAUTHORIZED
  }
  const parsed = z
    .object({ workId: idSchema, reason: z.string().trim().min(5, 'Indicá el motivo.').max(500) })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const outcome = await db.transaction(async (tx): Promise<ActionState> => {
    const [work] = await tx.select().from(works).where(eq(works.id, parsed.data.workId)).for('update')
    if (!work || work.status === 'COMPLETED' || work.status === 'CANCELLED') {
      return { error: 'La obra no se puede cancelar.' }
    }
    const affected = await tx
      .select({ contractorUserId: offers.contractorUserId })
      .from(offers)
      .where(and(eq(offers.workId, work.id), inArray(offers.status, ['PENDING', 'ACCEPTED'])))
    await tx
      .update(offers)
      .set({ status: 'REJECTED', updatedAt: new Date() })
      .where(and(eq(offers.workId, work.id), eq(offers.status, 'PENDING')))
    await tx
      .update(works)
      .set({ status: 'CANCELLED', cancelReason: `Moderación: ${parsed.data.reason}`, updatedAt: new Date() })
      .where(eq(works.id, work.id))
    await tx.insert(workUpdates).values({
      workId: work.id,
      authorUserId: admin.id,
      kind: 'STATUS',
      fromStatus: work.status,
      toStatus: 'CANCELLED',
      message: `Cancelada por Licity: ${parsed.data.reason}`,
    })
    await notify(work.clientUserId, {
      title: 'Obra cancelada por Licity',
      body: parsed.data.reason,
      href: `/app/pyme/obras/${work.id}`,
    }, tx)
    for (const o of affected) {
      await notify(o.contractorUserId, {
        title: 'Obra cancelada por Licity',
        body: `"${work.title}": ${parsed.data.reason}`,
        href: `/app/contratista/obras/${work.id}`,
      }, tx)
    }
    return { ok: true, message: 'Obra cancelada.' }
  })
  if (outcome.ok) revalidatePath('/admin', 'layout')
  return outcome
}
