import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { nextCookies } from 'better-auth/next-js'
import { pool } from '@/lib/db'

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'CLIENT', input: false },
      status: { type: 'string', defaultValue: 'ACTIVE', input: false },
      isDemo: { type: 'boolean', defaultValue: false, input: false },
    },
  },
  // Public registration goes through our server actions, which assign the role
  // and create the profile atomically. The raw endpoint stays closed.
  disabledPaths: ['/sign-up/email'],
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const { rows } = await pool.query<{ status: string }>(
            'SELECT status FROM "user" WHERE id = $1',
            [session.userId],
          )
          if (rows[0]?.status === 'SUSPENDED') {
            throw new APIError('FORBIDDEN', { message: 'ACCOUNT_SUSPENDED' })
          }
          return { data: session }
        },
      },
    },
  },
  trustedOrigins: [
    ...(process.env.NODE_ENV === 'development'
      ? [
          'http://localhost:3000',
          ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
          ...(process.env.V0_DEV_APP_URL ? [process.env.V0_DEV_APP_URL] : []),
          ...(process.env.V0_BUILD_URL ? [process.env.V0_BUILD_URL] : []),
          ...(process.env.V0_SANDBOX_URL ? [process.env.V0_SANDBOX_URL] : []),
        ]
      : []),
    ...(process.env.NODE_ENV === 'production'
      ? [
          ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
          ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
            : []),
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // Required by the cross-site v0 preview iframe. Without these
          // attributes, login succeeds but the next request appears signed out.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
  plugins: [nextCookies()],
})
