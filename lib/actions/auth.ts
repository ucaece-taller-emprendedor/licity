'use server'

import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import {
  clientProfiles,
  contractorProfiles,
  user,
  verificationRequests,
} from '@/lib/db/schema'
import { isAdminEmail } from '@/lib/env'
import { UNAUTHORIZED, type ActionState } from '@/lib/actions/types'
import {
  adminLoginSchema,
  onboardClientSchema,
  onboardContractorSchema,
  registerClientSchema,
  registerContractorSchema,
} from '@/lib/validations/auth'

const GENERIC_ERROR = 'No pudimos crear la cuenta con esos datos. Revisalos o ingresá si ya tenés una.'

async function createAccount(name: string, email: string, password: string) {
  // Los correos de ADMIN_EMAILS no se pueden registrar por el flujo público.
  if (isAdminEmail(email)) return null
  const existing = await db.query.user.findFirst({ where: eq(user.email, email) })
  if (existing) return null
  try {
    const result = await auth.api.signUpEmail({ body: { name, email, password } })
    return result.user.id
  } catch {
    return null
  }
}

type ClientData = { companyName: string; cuit?: string; city: string; phone?: string }
type ContractorData = {
  displayName: string
  cuit: string
  specialty: string
  city: string
  coverageZone?: string
  yearsExperience?: number
  description?: string
  phone?: string
}

async function saveClientProfile(userId: string, d: ClientData) {
  await db.transaction(async (tx) => {
    await tx.update(user).set({ role: 'CLIENT', needsRoleSelection: false }).where(eq(user.id, userId))
    await tx.insert(clientProfiles).values({
      userId,
      companyName: d.companyName,
      cuit: d.cuit,
      city: d.city,
      phone: d.phone,
    })
  })
}

async function saveContractorProfile(userId: string, d: ContractorData) {
  await db.transaction(async (tx) => {
    await tx.update(user).set({ role: 'BUSINESS', needsRoleSelection: false }).where(eq(user.id, userId))
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
    // El contratista queda pendiente hasta que un admin lo aprueba.
    await tx.insert(verificationRequests).values({
      contractorUserId: userId,
      snapshot: { displayName: d.displayName, cuit: d.cuit, specialty: d.specialty, city: d.city },
    })
  })
}

export async function registerClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerClientSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data

  const userId = await createAccount(d.name, d.email, d.password)
  if (!userId) return { error: GENERIC_ERROR }
  try {
    await saveClientProfile(userId, d)
  } catch {
    await db.delete(user).where(eq(user.id, userId))
    return { error: GENERIC_ERROR }
  }
  redirect('/app/pyme')
}

export async function registerContractor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerContractorSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data

  const userId = await createAccount(d.name, d.email, d.password)
  if (!userId) return { error: GENERIC_ERROR }
  try {
    await saveContractorProfile(userId, d)
  } catch {
    await db.delete(user).where(eq(user.id, userId))
    return { error: GENERIC_ERROR }
  }
  redirect('/app/contratista')
}

/** Paso obligatorio para quien entra con Google por primera vez: elegir PyME o contratista. */
async function pendingOnboardingUser() {
  const me = await getCurrentUser()
  if (!me || me.role !== 'CLIENT' || !me.needsRoleSelection) throw new Error('UNAUTHORIZED')
  return me
}

export async function onboardClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let me
  try {
    me = await pendingOnboardingUser()
  } catch {
    return UNAUTHORIZED
  }
  const parsed = onboardClientSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  try {
    await saveClientProfile(me.id, parsed.data)
  } catch {
    return { error: 'No pudimos guardar tus datos. Probá de nuevo.' }
  }
  redirect('/app/pyme')
}

export async function onboardContractor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let me
  try {
    me = await pendingOnboardingUser()
  } catch {
    return UNAUTHORIZED
  }
  const parsed = onboardContractorSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  try {
    await saveContractorProfile(me.id, parsed.data)
  } catch {
    return { error: 'No pudimos guardar tus datos. Probá de nuevo.' }
  }
  redirect('/app/contratista')
}

const ADMIN_LOGIN_ERROR = 'Credenciales inválidas o sin permiso de administración.'

/** Login del panel /admin: no crea cuentas y solo deja pasar a SUPERADMIN activos. */
export async function loginAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = adminLoginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: ADMIN_LOGIN_ERROR }
  const { email, password } = parsed.data

  const target = await db.query.user.findFirst({ where: eq(user.email, email) })
  if (!target || target.role !== 'SUPERADMIN' || target.status !== 'ACTIVE') return { error: ADMIN_LOGIN_ERROR }

  try {
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() })
  } catch {
    return { error: ADMIN_LOGIN_ERROR }
  }
  redirect('/admin')
}
