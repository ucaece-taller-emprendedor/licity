import { z } from 'zod'

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v)

const schema = z
  .object({
    DATABASE_URL: z
      .string({ error: 'Falta DATABASE_URL (cadena de conexión a Postgres).' })
      .url('DATABASE_URL debe ser una URL de Postgres válida (postgresql://usuario:clave@host/base).'),
    BETTER_AUTH_SECRET: z
      .string({ error: 'Falta BETTER_AUTH_SECRET.' })
      .min(32, 'BETTER_AUTH_SECRET debe tener al menos 32 caracteres. Generá uno con: openssl rand -base64 32'),
    BETTER_AUTH_URL: z
      .string({ error: 'Falta BETTER_AUTH_URL (URL pública de la app).' })
      .url('BETTER_AUTH_URL debe ser una URL válida, por ejemplo http://localhost:3000'),
    GOOGLE_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().optional()),
    GOOGLE_CLIENT_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
    ADMIN_EMAILS: z.preprocess(emptyToUndefined, z.string().optional()),
  })
  .refine((v) => Boolean(v.GOOGLE_CLIENT_ID) === Boolean(v.GOOGLE_CLIENT_SECRET), {
    message: 'GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET se configuran juntos (o ninguno).',
    path: ['GOOGLE_CLIENT_ID'],
  })

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const detalle = parsed.error.issues.map((i) => `  - ${i.message}`).join('\n')
  throw new Error(
    `Variables de entorno inválidas o faltantes:\n${detalle}\n\nCopiá .env.example a .env y completalo (ver README).`,
  )
}

const data = parsed.data

export const env = {
  DATABASE_URL: data.DATABASE_URL,
  BETTER_AUTH_SECRET: data.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: data.BETTER_AUTH_URL.replace(/\/$/, ''),
  GOOGLE_CLIENT_ID: data.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: data.GOOGLE_CLIENT_SECRET,
  /** El ingreso con Google solo se habilita si hay credenciales reales cargadas. */
  GOOGLE_ENABLED: Boolean(data.GOOGLE_CLIENT_ID && data.GOOGLE_CLIENT_SECRET),
  ADMIN_EMAILS: (data.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
}

export const isAdminEmail = (email: string) => env.ADMIN_EMAILS.includes(email.trim().toLowerCase())
