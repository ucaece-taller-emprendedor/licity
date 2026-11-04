import { z } from 'zod'

export const text = (label: string, min = 2, max = 120) =>
  z
    .string({ error: `Completá ${label}.` })
    .trim()
    .min(min, `Completá ${label}.`)
    .max(max, `${label} es demasiado largo.`)

export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, 'El texto es demasiado largo.')
    .optional()
    .transform((v) => (v ? v : undefined))

export const cuit = z
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

const clientFields = {
  companyName: text('el nombre de la empresa', 2, 120),
  cuit: cuit.optional().or(z.literal('').transform(() => undefined)),
  city: text('la ciudad', 2, 80),
  phone: optionalText(40),
}

const contractorFields = {
  displayName: text('el nombre o razón social', 2, 120),
  cuit,
  specialty: text('la especialidad', 2, 80),
  city: text('la ciudad', 2, 80),
  coverageZone: optionalText(160),
  yearsExperience: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine(
      (v) => v === undefined || (Number.isInteger(v) && v >= 0 && v <= 80),
      'Los años de experiencia deben estar entre 0 y 80.',
    ),
  description: optionalText(1000),
  phone: optionalText(40),
}

export const registerClientSchema = z.object({ ...credentials, ...clientFields })
export const registerContractorSchema = z.object({ ...credentials, ...contractorFields })

/** Usuarios que entraron con Google: ya tienen cuenta, solo falta el perfil. */
export const onboardClientSchema = z.object({
  terms: credentials.terms,
  ...clientFields,
})
export const onboardContractorSchema = z.object({
  terms: credentials.terms,
  ...contractorFields,
})

export const adminLoginSchema = z.object({
  email: credentials.email,
  password: z.string().min(1, 'Ingresá tu contraseña.').max(128),
})
