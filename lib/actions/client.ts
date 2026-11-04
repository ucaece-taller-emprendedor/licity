'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  awards,
  clientProfiles,
  contractorProfiles,
  offers,
  payments,
  user,
  workUpdates,
  works,
} from '@/lib/db/schema'
import { CAN_AWARD, CAN_CANCEL, COMMISSION_RATE, WORK_CATEGORIES } from '@/lib/constants'
import { requireRoleForAction } from '@/lib/session'
import { notify } from '@/lib/notify'
import { UNAUTHORIZED, type ActionState } from '@/lib/actions/types'

const optionalNumber = (label: string) =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? Number(v.replace(',', '.')) : undefined))
    .refine((v) => v === undefined || (Number.isFinite(v) && v > 0 && v < 1e11), `${label} no es válido.`)

const workSchema = z.object({
  title: z.string().trim().min(5, 'El título debe tener al menos 5 caracteres.').max(120, 'El título es demasiado largo.'),
  category: z.enum(WORK_CATEGORIES, { error: 'Elegí un tipo de obra.' }),
  description: z.string().trim().min(20, 'Describí la obra con al menos 20 caracteres.').max(3000, 'La descripción es demasiado larga.'),
  city: z.string().trim().min(2, 'Ingresá la ubicación.').max(120),
  desiredStartDate: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || /^\d{4}-\d{2}-\d{2}$/.test(v), 'La fecha de inicio no es válida.'),
  estimatedDays: optionalNumber('El plazo estimado').refine(
    (v) => v === undefined || (Number.isInteger(v) && v <= 3650),
    'El plazo estimado debe ser un número entero de días.',
  ),
  budgetEstimate: optionalNumber('El presupuesto estimado'),
})

const idSchema = z.string().uuid()

export async function createWork(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let me
  try {
    me = await requireRoleForAction('CLIENT')
  } catch {
    return UNAUTHORIZED
  }
  const parsed = workSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data

  const [work] = await db
    .insert(works)
    .values({
      clientUserId: me.id,
      title: d.title,
      category: d.category,
      description: d.description,
      city: d.city,
      desiredStartDate: d.desiredStartDate,
      estimatedDays: d.estimatedDays,
      budgetEstimate: d.budgetEstimate?.toString(),
    })
    .returning({ id: works.id })

  await db.insert(workUpdates).values({
    workId: work.id,
    authorUserId: me.id,
    kind: 'STATUS',
    toStatus: 'PUBLISHED',
    message: 'Obra publicada.',
  })

  revalidatePath('/client', 'layout')
  redirect(`/client/obras/${work.id}`)
}

export async function updateWork(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let me
  try {
    me = await requireRoleForAction('CLIENT')
  } catch {
    return UNAUTHORIZED
  }
  const id = idSchema.safeParse(formData.get('workId'))
  const parsed = workSchema.safeParse(Object.fromEntries(formData))
  if (!id.success) return { error: 'Obra no encontrada.' }
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data

  const updated = await db
    .update(works)
    .set({
      title: d.title,
      category: d.category,
      description: d.description,
      city: d.city,
      desiredStartDate: d.desiredStartDate ?? null,
      estimatedDays: d.estimatedDays ?? null,
      budgetEstimate: d.budgetEstimate?.toString() ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(works.id, id.data), eq(works.clientUserId, me.id), eq(works.status, 'PUBLISHED')))
    .returning({ id: works.id })

  if (updated.length === 0) {
    return { error: 'Solo podés editar una obra que todavía no recibió ofertas.' }
  }
  revalidatePath('/client', 'layout')
  redirect(`/client/obras/${id.data}`)
}

export async function startEvaluation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let me
  try {
    me = await requireRoleForAction('CLIENT')
  } catch {
    return UNAUTHORIZED
  }
  const id = idSchema.safeParse(formData.get('workId'))
  if (!id.success) return { error: 'Obra no encontrada.' }

  const updated = await db
    .update(works)
    .set({ status: 'EVALUATING', updatedAt: new Date() })
    .where(and(eq(works.id, id.data), eq(works.clientUserId, me.id), eq(works.status, 'RECEIVING_OFFERS')))
    .returning({ id: works.id })
  if (updated.length === 0) return { error: 'No se puede iniciar la evaluación en el estado actual.' }

  await db.insert(workUpdates).values({
    workId: id.data,
    authorUserId: me.id,
    kind: 'STATUS',
    fromStatus: 'RECEIVING_OFFERS',
    toStatus: 'EVALUATING',
    message: 'La PyME inició la evaluación de ofertas.',
  })
  revalidatePath('/client', 'layout')
  return { ok: true, message: 'Evaluación iniciada. Ya no se aceptan ofertas nuevas.' }
}

export async function acceptOffer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let me
  try {
    me = await requireRoleForAction('CLIENT')
  } catch {
    return UNAUTHORIZED
  }
  const offerId = idSchema.safeParse(formData.get('offerId'))
  if (!offerId.success) return { error: 'Oferta no encontrada.' }

  const result = await db.transaction(async (tx): Promise<ActionState & { workId?: string }> => {
    const [offer] = await tx.select().from(offers).where(eq(offers.id, offerId.data)).limit(1)
    if (!offer) return { error: 'Oferta no encontrada.' }

    const [work] = await tx
      .select()
      .from(works)
      .where(and(eq(works.id, offer.workId), eq(works.clientUserId, me.id)))
      .for('update')
    if (!work) return { error: 'Oferta no encontrada.' }
    if (!CAN_AWARD.includes(work.status)) return { error: 'Esta obra ya no admite adjudicación.' }
    if (offer.status !== 'PENDING') return { error: 'Esta oferta ya no está disponible.' }

    const [contractor] = await tx
      .select({ status: user.status, verification: contractorProfiles.verificationStatus })
      .from(user)
      .innerJoin(contractorProfiles, eq(contractorProfiles.userId, user.id))
      .where(eq(user.id, offer.contractorUserId))
    if (!contractor || contractor.status !== 'ACTIVE' || contractor.verification !== 'APPROVED') {
      return { error: 'El contratista ya no está habilitado para recibir adjudicaciones.' }
    }

    const others = await tx
      .select({ id: offers.id, contractorUserId: offers.contractorUserId })
      .from(offers)
      .where(and(eq(offers.workId, work.id), eq(offers.status, 'PENDING')))

    await tx.update(offers).set({ status: 'ACCEPTED', updatedAt: new Date() }).where(eq(offers.id, offer.id))
    await tx
      .update(offers)
      .set({ status: 'REJECTED', updatedAt: new Date() })
      .where(and(eq(offers.workId, work.id), eq(offers.status, 'PENDING')))
    await tx.insert(awards).values({
      workId: work.id,
      offerId: offer.id,
      contractorUserId: offer.contractorUserId,
      clientUserId: me.id,
      amount: offer.amount,
    })
    await tx
      .update(works)
      .set({ status: 'AWARDED', awardedAt: new Date(), updatedAt: new Date() })
      .where(eq(works.id, work.id))
    await tx.insert(workUpdates).values({
      workId: work.id,
      authorUserId: me.id,
      kind: 'STATUS',
      fromStatus: work.status,
      toStatus: 'AWARDED',
      message: 'La PyME adjudicó la obra.',
    })

    for (const other of others) {
      if (other.id === offer.id) continue
      await notify(
        other.contractorUserId,
        {
          title: 'Oferta no seleccionada',
          body: `La obra "${work.title}" fue adjudicada a otro contratista.`,
          href: `/business/obras/${work.id}`,
        },
        tx,
      )
    }
    await notify(
      offer.contractorUserId,
      {
        title: 'Te adjudicaron una obra',
        body: `"${work.title}" fue adjudicada a tu oferta. Ya podés iniciar la ejecución.`,
        href: `/business/obras/${work.id}`,
      },
      tx,
    )
    return { ok: true, message: 'Obra adjudicada.', workId: work.id }
  })

  if (result.ok) revalidatePath('/client', 'layout')
  return { ok: result.ok, error: result.error, message: result.message }
}

export async function cancelWork(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let me
  try {
    me = await requireRoleForAction('CLIENT')
  } catch {
    return UNAUTHORIZED
  }
  const id = idSchema.safeParse(formData.get('workId'))
  if (!id.success) return { error: 'Obra no encontrada.' }
  const reason = z.string().trim().max(500).optional().safeParse(formData.get('reason') ?? undefined)

  const outcome = await db.transaction(async (tx): Promise<ActionState> => {
    const [work] = await tx
      .select()
      .from(works)
      .where(and(eq(works.id, id.data), eq(works.clientUserId, me.id)))
      .for('update')
    if (!work || !CAN_CANCEL.includes(work.status)) {
      return { error: 'Esta obra no se puede cancelar en su estado actual.' }
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
      .set({
        status: 'CANCELLED',
        cancelReason: reason.success ? reason.data || null : null,
        updatedAt: new Date(),
      })
      .where(eq(works.id, work.id))
    await tx.insert(workUpdates).values({
      workId: work.id,
      authorUserId: me.id,
      kind: 'STATUS',
      fromStatus: work.status,
      toStatus: 'CANCELLED',
      message: 'La PyME canceló la obra.',
    })
    for (const o of affected) {
      await notify(
        o.contractorUserId,
        { title: 'Obra cancelada', body: `La PyME canceló "${work.title}".`, href: `/business/obras/${work.id}` },
        tx,
      )
    }
    return { ok: true, message: 'Obra cancelada.' }
  })

  if (outcome.ok) revalidatePath('/client', 'layout')
  return outcome
}

export async function confirmCompletion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let me
  try {
    me = await requireRoleForAction('CLIENT')
  } catch {
    return UNAUTHORIZED
  }
  const id = idSchema.safeParse(formData.get('workId'))
  if (!id.success) return { error: 'Obra no encontrada.' }

  const outcome = await db.transaction(async (tx): Promise<ActionState> => {
    const [work] = await tx
      .select()
      .from(works)
      .where(and(eq(works.id, id.data), eq(works.clientUserId, me.id)))
      .for('update')
    if (!work || work.status !== 'IN_PROGRESS') return { error: 'La obra no está en ejecución.' }
    if (!work.contractorDoneAt) return { error: 'El contratista todavía no marcó la obra como terminada.' }

    const [award] = await tx.select().from(awards).where(eq(awards.workId, work.id))
    if (!award) return { error: 'La obra no tiene una adjudicación.' }

    const now = new Date()
    const amount = Number(award.amount)
    const commission = Math.round(amount * COMMISSION_RATE * 100) / 100

    await tx
      .update(works)
      .set({ status: 'COMPLETED', completedAt: now, progress: 100, updatedAt: now })
      .where(eq(works.id, work.id))
    await tx
      .insert(payments)
      .values({
        workId: work.id,
        finalAmount: amount.toFixed(2),
        commissionRate: COMMISSION_RATE.toString(),
        commissionAmount: commission.toFixed(2),
        status: work.isDemo ? 'TEST_RECORD' : 'PENDING_GATEWAY',
        completedAt: now,
        isDemo: work.isDemo,
      })
      .onConflictDoNothing({ target: payments.workId })
    await tx.insert(workUpdates).values({
      workId: work.id,
      authorUserId: me.id,
      kind: 'STATUS',
      fromStatus: 'IN_PROGRESS',
      toStatus: 'COMPLETED',
      message: 'La PyME confirmó la finalización de la obra.',
    })
    await notify(
      award.contractorUserId,
      { title: 'Obra finalizada', body: `La PyME confirmó la finalización de "${work.title}".`, href: `/business/obras/${work.id}` },
      tx,
    )
    return { ok: true, message: 'Obra finalizada. Registramos el pago y la comisión.' }
  })

  if (outcome.ok) revalidatePath('/client', 'layout')
  return outcome
}

const profileSchema = z.object({
  companyName: z.string().trim().min(2, 'Ingresá el nombre de la empresa.').max(120),
  cuit: z
    .string()
    .optional()
    .transform((v) => (v ? v.replace(/\D/g, '') : ''))
    .refine((v) => v === '' || v.length === 11, 'El CUIT debe tener 11 dígitos.'),
  city: z.string().trim().min(2, 'Ingresá la ciudad.').max(80),
  phone: z.string().trim().max(40).optional(),
})

export async function updateClientProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let me
  try {
    me = await requireRoleForAction('CLIENT')
  } catch {
    return UNAUTHORIZED
  }
  const parsed = profileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data
  await db
    .update(clientProfiles)
    .set({
      companyName: d.companyName,
      cuit: d.cuit || null,
      city: d.city,
      phone: d.phone || null,
      updatedAt: new Date(),
    })
    .where(eq(clientProfiles.userId, me.id))
  revalidatePath('/client', 'layout')
  return { ok: true, message: 'Perfil actualizado.' }
}
