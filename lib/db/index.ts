import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const globalForDb = globalThis as unknown as { licityPool?: Pool }

export const pool =
  globalForDb.licityPool ?? new Pool({ connectionString: process.env.DATABASE_URL })

if (process.env.NODE_ENV !== 'production') globalForDb.licityPool = pool

export const db = drizzle(pool, { schema })
