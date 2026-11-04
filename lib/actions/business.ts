'use server'

import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  awards,
  contractorProfiles,
  offers,
  verificationRequests,
  workUpdates,
  works,
} from '@/lib/db/schema'
import { OPEN_FOR_OFFERS } from '@/lib/constants'
import { requireRoleForAction } from '@/lib/auth/session'
import { notify } from '@/lib/notify'
import { UNAUTHORIZED, type ActionState } from '@/lib/actions/types'

const idSchema = z.string().uuid()

const offerSchema = z.object({
  workId: idSchema,
  amount: z
    .string()
    .transform((v) => Number(v.replace(',', '.')))
    .refine((v) => Number.isFinite(v) && v > 0 && v < 1e11, 'Ingresá un monto mayor a cero.'),
  estimatedDays: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0 && v <= 3650, 'Ingresá un plazo en días (número entero).'),
  description: z.string().trim().min(20, 'Detallá el alcance de tu propuesta (mínimo 20 caracteres).').max(3000),
  notes: z.string().trim().max(1000).optional(),
})

async function currentContractor() {
  const me = await requireRoleForAction('BUSINESS')
  const [profile] = await db.select().from(contractorProfiles).where(eq(contractorProfiles.userId, me.id))
  if (!profile) throw new Error('UNAUTHORIZED')
  return { me, profile }
}

export async function submitOffer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let ctx
  try {
    ctx = await currentContractor()
  } catch {
    return UNAUTHORIZED
  }
  const { me, profile } = ctx
  if (profile.verificationStatus !== 'APPROVED') {
    return { error: 'Tu cuenta debe estar verificada por Licity para enviar ofertas.' }
  }
  const parsed = offerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data

  const outcome = await db.transaction(async (tx): Promise<ActionState> => {
    const [work] = await tx.select().from(works).where(eq(works.id, d.workId)).for('update')
    if (!work || !OPEN_FOR_OFFERS.includes(work.status)) {
      return { error: 'Esta obra ya no recibe ofertas.' }
    }
    const [existing] = await tx
      .select()
      .from(offers)
      .where(and(eq(offers.workId, work.id), eq(offers.contractorUserId, me.id)))
    if (existing && existing.status !== 'WITHDRAWN') {
      return { error: 'Ya enviaste una oferta para esta obra.' }
    }

    const values = {
      amount: d.amount.toFixed(2),
      estimatedDays: d.estimatedDays,
      description: d.description,
      notes: d.notes || null,
      status: 'PENDING' as const,
      updatedAt: new Date(),
    }
    if (existing) {
      await tx.update(offers).set(values).where(eq(offers.id, existing.id))
    } else {
      await tx.insert(offers).values({ workId: work.id, contractorUserId: me.id, ...values })
    }

    if (work.status === 'PUBLISHED') {
      await tx
        .update(works)
        .set({ status: 'RECEIVING_OFFERS', updatedAt: new Date() })
        .where(eq(works.id, work.id))
      await tx.insert(workUpdates).values({
        workId: work.id,
        authorUserId: me.id,
        kind: 'STATUS',
        fromStatus: 'PUBLISHED',
        toStatus: 'RECEIVING_OFFERS',
        message: 'La obra recibió su primera oferta.',
      })
    }
    await notify(
      work.clientUserId,
      {
        title: 'Nueva oferta recibida',
        body: `${profile.displayName} ofertó en "${work.title}".`,
        href: `/app/pyme/obras/${work.id}`,
      },
      tx,
    )
    return { ok: true, message: 'Oferta enviada.' }
  })

  if (outcome.ok) revalidatePath('/app/contratista', 'layout')
  return outcome
}

export async function withdrawOffer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let ctx
  try {
    ctx = await currentContractor()
  } catch {
    return UNAUTHORIZED
  }
  const id = idSchema.safeParse(formData.get('offerId'))
  if (!id.success) return { error: 'Oferta no encontrada.' }

  const outcome = await db.transaction(async (tx): Promise<ActionState> => {
    const [offer] = await tx
      .select()
      .from(offers)
      .where(and(eq(offers.id, id.data), eq(offers.contractorUserId, ctx.me.id)))
    if (!offer || offer.status !== 'PENDING') return { error: 'Esta oferta ya no se puede retirar.' }
    const [work] = await tx.select().from(works).where(eq(works.id, offer.workId)).for('update')
    if (!work || !['PUBLISHED', 'RECEIVING_OFFERS', 'EVALUATING'].includes(work.status)) {
      return { error: 'Esta oferta ya no se puede retirar.' }
    }
    await tx.update(offers).set({ status: 'WITHDRAWN', updatedAt: new Date() }).where(eq(offers.id, offer.id))
    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(offers)
      .where(and(eq(offers.workId, work.id), eq(offers.status, 'PENDING')))
    if (count === 0 && work.status === 'RECEIVING_OFFERS') {
      await tx.update(works).set({ status: 'PUBLISHED', updatedAt: new Date() }).where(eq(works.id, work.id))
    }
    return { ok: true, message: 'Oferta retirada.' }
  })

  if (outcome.ok) revalidatePath('/app/contratista', 'layout')
  return outcome
}

async function awardedWork(workId: string, contractorId: string) {
  const [row] = await db
    .select({ work: works })
    .from(works)
    .innerJoin(awards, eq(awards.workId, works.id))
    .where(and(eq(works.id, workId), eq(awards.contractorUserId, contractorId)))
  return row?.work
}

export async function startWork(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let ctx
  try {
    ctx = await currentContractor()
  } catch {
    return UNAUTHORIZED
  }
  const id = idSchema.safeParse(formData.get('workId'))
  if (!id.success) return { error: 'Obra no encontrada.' }
  const work = await awardedWork(id.data, ctx.me.id)
  if (!work) return { error: 'Obra no encontrada.' }

  const updated = await db
    .update(works)
    .set({ status: 'IN_PROGRESS', startedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(works.id, work.id), eq(works.status, 'AWARDED')))
    .returning({ id: works.id })
  if (updated.length === 0) return { error: 'La obra no está lista para iniciarse.' }

  await db.insert(workUpdates).values({
    workId: work.id,
    authorUserId: ctx.me.id,
    kind: 'STATUS',
    fromStatus: 'AWARDED',
    toStatus: 'IN_PROGRESS',
    message: 'El contratista inició la ejecución.',
  })
  await notify(work.clientUserId, {
    title: 'Tu obra comenzó',
    body: `${ctx.profile.displayName} inició "${work.title}".`,
    href: `/app/pyme/obras/${work.id}`,
  })
  revalidatePath('/app/contratista', 'layout')
  return { ok: true, message: 'Obra iniciada.' }
}

export async function postProgress(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let ctx
  try {
    ctx = await currentContractor()
  } catch {
    return UNAUTHORIZED
  }
  const parsed = z
    .object({
      workId: idSchema,
      progress: z
        .string()
        .transform(Number)
        .refine((v) => Number.isInteger(v) && v >= 0 && v <= 100, 'El avance debe estar entre 0 y 100.'),
      message: z.string().trim().min(3, 'Escribí una breve descripción del avance.').max(1000),
    })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data

  const work = await awardedWork(d.workId, ctx.me.id)
  if (!work || work.status !== 'IN_PROGRESS') return { error: 'La obra no está en ejecución.' }
  if (work.contractorDoneAt) return { error: 'Ya marcaste la obra como terminada.' }
  if (d.progress < work.progress) return { error: 'El avance no puede ser menor al registrado.' }
  if (d.progress >= 100) return { error: 'Para llegar al 100% usá "Marcar como terminada".' }

  await db.update(works).set({ progress: d.progress, updatedAt: new Date() }).where(eq(works.id, work.id))
  await db.insert(workUpdates).values({
    workId: work.id,
    authorUserId: ctx.me.id,
    kind: 'PROGRESS',
    progress: d.progress,
    message: d.message,
  })
  await notify(work.clientUserId, {
    title: 'Nuevo avance de obra',
    body: `"${work.title}" va al ${d.progress}%.`,
    href: `/app/pyme/obras/${work.id}`,
  })
  revalidatePath('/app/contratista', 'layout')
  return { ok: true, message: 'Avance registrado.' }
}

export async function markDone(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let ctx
  try {
    ctx = await currentContractor()
  } catch {
    return UNAUTHORIZED
  }
  const id = idSchema.safeParse(formData.get('workId'))
  if (!id.success) return { error: 'Obra no encontrada.' }
  const work = await awardedWork(id.data, ctx.me.id)
  if (!work || work.status !== 'IN_PROGRESS' || work.contractorDoneAt) {
    return { error: 'La obra no se puede marcar como terminada.' }
  }
  const now = new Date()
  await db
    .update(works)
    .set({ progress: 100, contractorDoneAt: now, updatedAt: now })
    .where(and(eq(works.id, work.id), eq(works.status, 'IN_PROGRESS')))
  await db.insert(workUpdates).values({
    workId: work.id,
    authorUserId: ctx.me.id,
    kind: 'PROGRESS',
    progress: 100,
    message: 'El contratista marcó la obra como terminada. Esperando confirmación de la PyME.',
  })
  await notify(work.clientUserId, {
    title: 'Confirmá la finalización',
    body: `${ctx.profile.displayName} terminó "${work.title}". Revisala y confirmá para cerrar la obra.`,
    href: `/app/pyme/obras/${work.id}`,
  })
  revalidatePath('/app/contratista', 'layout')
  return { ok: true, message: 'Marcaste la obra como terminada. La PyME debe confirmarla.' }
}

export async function reportWork(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let ctx
  try {
    ctx = await currentContractor()
  } catch {
    return UNAUTHORIZED
  }
  const parsed = z
    .object({ workId: idSchema, reason: z.string().trim().min(10, 'Contanos el motivo (mínimo 10 caracteres).').max(500) })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const updated = await db
    .update(works)
    .set({ reportedAt: new Date(), reportReason: parsed.data.reason, reportedBy: ctx.me.id })
    .where(and(eq(works.id, parsed.data.workId), sql`${works.reportedAt} is null`))
    .returning({ id: works.id })
  if (updated.length === 0) return { error: 'Esta obra ya fue reportada o no existe.' }
  revalidatePath('/app/contratista', 'layout')
  revalidatePath('/admin', 'layout')
  return { ok: true, message: 'Reporte enviado al equipo de Licity.' }
}

const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Ingresá el nombre o razón social.').max(120),
  specialty: z.string().trim().min(2, 'Ingresá la especialidad.').max(80),
  city: z.string().trim().min(2, 'Ingresá la ciudad.').max(80),
  coverageZone: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  description: z.string().trim().max(1000).optional(),
  yearsExperience: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || (Number.isInteger(v) && v >= 0 && v <= 80), 'Los años de experiencia deben estar entre 0 y 80.'),
})

export async function updateContractorProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let ctx
  try {
    ctx = await currentContractor()
  } catch {
    return UNAUTHORIZED
  }
  const parsed = profileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data
  await db
    .update(contractorProfiles)
    .set({
      displayName: d.displayName,
      specialty: d.specialty,
      city: d.city,
      coverageZone: d.coverageZone || null,
      phone: d.phone || null,
      description: d.description || null,
      yearsExperience: d.yearsExperience ?? null,
      updatedAt: new Date(),
    })
    .where(eq(contractorProfiles.userId, ctx.me.id))
  revalidatePath('/app/contratista', 'layout')
  return { ok: true, message: 'Perfil actualizado.' }
}

export async function resubmitVerification(): Promise<ActionState> {
  let ctx
  try {
    ctx = await currentContractor()
  } catch {
    return UNAUTHORIZED
  }
  if (ctx.profile.verificationStatus !== 'REJECTED') {
    return { error: 'Tu verificación no está rechazada.' }
  }
  await db.transaction(async (tx) => {
    await tx
      .update(contractorProfiles)
      .set({ verificationStatus: 'PENDING', rejectionReason: null, updatedAt: new Date() })
      .where(eq(contractorProfiles.userId, ctx.me.id))
    await tx.insert(verificationRequests).values({
      contractorUserId: ctx.me.id,
      snapshot: {
        displayName: ctx.profile.displayName,
        cuit: ctx.profile.cuit,
        specialty: ctx.profile.specialty,
        city: ctx.profile.city,
      },
    })
  })
  revalidatePath('/app/contratista', 'layout')
  revalidatePath('/admin', 'layout')
  return { ok: true, message: 'Enviamos tu perfil a revisión nuevamente.' }
}
