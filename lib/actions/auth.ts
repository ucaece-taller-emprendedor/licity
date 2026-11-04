'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  clientProfiles,
  contractorProfiles,
  user,
  verificationRequests,
} from '@/lib/db/schema'
import type { ActionState } from '@/lib/actions/types'

const GENERIC_ERROR = 'No pudimos crear la cuenta con esos datos. Revisalos o ingresá si ya tenés una.'

const text = (label: string, min = 2, max = 120) =>
  z
    .string({ error: `Completá ${label}.` })
    .trim()
    .min(min, `Completá ${label}.`)
    .max(max, `${label} es demasiado largo.`)

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, 'El texto es demasiado largo.')
    .optional()
    .transform((v) => (v ? v : undefined))

const cuit = z
  .string({ error: 'Ingresá el CUIT.' })
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 11, 'El CUIT debe tener 11 dígitos.')

const credentials = {
  name: text('tu nombre', 2, 80),
  email: z.string().trim().toLowerCase().email('Ingresá un correo válido.').max(160),
  password: z
    .string({ error: 'Ingresá una contraseña.' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(128, 'La contraseña es demasiado larga.'),
  terms: z.literal('on', { error: 'Tenés que aceptar los términos y la política de privacidad.' }),
}

const clientSchema = z.object({
  ...credentials,
  companyName: text('el nombre de la empresa', 2, 120),
  cuit: cuit.optional().or(z.literal('').transform(() => undefined)),
  city: text('la ciudad', 2, 80),
  phone: optionalText(40),
})

const contractorSchema = z.object({
  ...credentials,
  displayName: text('el nombre o razón social', 2, 120),
  cuit,
  specialty: text('la especialidad', 2, 80),
  city: text('la ciudad', 2, 80),
  coverageZone: optionalText(160),
  yearsExperience: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || (Number.isInteger(v) && v >= 0 && v <= 80), 'Los años de experiencia deben estar entre 0 y 80.'),
  description: optionalText(1000),
  phone: optionalText(40),
})

async function createAccount(name: string, email: string, password: string) {
  const existing = await db.query.user.findFirst({ where: eq(user.email, email) })
  if (existing) return null
  try {
    const result = await auth.api.signUpEmail({ body: { name, email, password } })
    return result.user.id
  } catch {
    return null
  }
}

export async function registerClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = clientSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data

  const userId = await createAccount(d.name, d.email, d.password)
  if (!userId) return { error: GENERIC_ERROR }

  try {
    await db.transaction(async (tx) => {
      await tx.update(user).set({ role: 'CLIENT' }).where(eq(user.id, userId))
      await tx.insert(clientProfiles).values({
        userId,
        companyName: d.companyName,
        cuit: d.cuit,
        city: d.city,
        phone: d.phone,
      })
    })
  } catch {
    await db.delete(user).where(eq(user.id, userId))
    return { error: GENERIC_ERROR }
  }

  redirect('/client')
}

export async function registerContractor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = contractorSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data

  const userId = await createAccount(d.name, d.email, d.password)
  if (!userId) return { error: GENERIC_ERROR }

  try {
    await db.transaction(async (tx) => {
      await tx.update(user).set({ role: 'BUSINESS' }).where(eq(user.id, userId))
      await tx.insert(contractorProfiles).values({
        userId,
        displayName: d.displayName,
        cuit: d.cuit,
        specialty: d.specialty,
        city: d.city,
        coverageZone: d.coverageZone,
        yearsExperience: d.yearsExperience,
        description: d.description,
        phone: d.phone,
      })
      await tx.insert(verificationRequests).values({
        contractorUserId: userId,
        snapshot: { displayName: d.displayName, cuit: d.cuit, specialty: d.specialty, city: d.city },
      })
    })
  } catch {
    await db.delete(user).where(eq(user.id, userId))
    return { error: GENERIC_ERROR }
  }

  redirect('/business')
}
