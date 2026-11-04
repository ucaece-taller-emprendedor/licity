import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { nextCookies } from 'better-auth/next-js'
import { pool } from '@/lib/db'
import { env, isAdminEmail } from '@/lib/env'

export const auth = betterAuth({
  database: pool,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  // Google solo se habilita con credenciales reales; sin ellas no se registra el proveedor.
  ...(env.GOOGLE_ENABLED
    ? {
        socialProviders: {
          google: {
            clientId: env.GOOGLE_CLIENT_ID as string,
            clientSecret: env.GOOGLE_CLIENT_SECRET as string,
            // Un usuario nuevo de Google tiene que elegir PyME o contratista antes de entrar al panel.
            mapProfileToUser: () => ({ needsRoleSelection: true }),
          },
        },
      }
    : {}),
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'CLIENT', input: false },
      status: { type: 'string', defaultValue: 'ACTIVE', input: false },
      isDemo: { type: 'boolean', defaultValue: false, input: false },
      needsRoleSelection: { type: 'boolean', defaultValue: false, input: false },
    },
  },
  // El registro público pasa por nuestras server actions, que asignan el rol y crean
  // el perfil en una sola transacción. El endpoint crudo queda cerrado.
  disabledPaths: ['/sign-up/email'],
  databaseHooks: {
    user: {
      create: {
        before: async (newUser) => {
          // Solo un correo verificado (Google) puede convertirse en SUPERADMIN vía ADMIN_EMAILS.
          // El registro con contraseña nunca llega acá con emailVerified=true.
          if (newUser.emailVerified && isAdminEmail(newUser.email)) {
            return { data: { ...newUser, role: 'SUPERADMIN', needsRoleSelection: false } }
          }
          return { data: newUser }
        },
      },
    },
    session: {
      create: {
        before: async (newSession) => {
          const { rows } = await pool.query<{ status: string }>(
            'SELECT status FROM "user" WHERE id = $1',
            [newSession.userId],
          )
          if (rows[0]?.status === 'SUSPENDED') {
            throw new APIError('FORBIDDEN', { message: 'ACCOUNT_SUSPENDED' })
          }
          return { data: newSession }
        },
      },
    },
  },
  trustedOrigins: [
    env.BETTER_AUTH_URL,
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
  ],
  session: {
    // Sesión persistente: 30 días, renovada cada vez que se usa pasado 1 día.
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  // El límite de intentos de Better Auth queda activo en producción; solo los tests E2E en CI
  // (muchos logins seguidos desde una misma IP) lo desactivan con esta variable.
  rateLimit: { enabled: process.env.E2E_DISABLE_RATE_LIMIT === '1' ? false : process.env.NODE_ENV === 'production' },
  plugins: [nextCookies()],
})
