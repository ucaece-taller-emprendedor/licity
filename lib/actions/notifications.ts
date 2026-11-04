'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/session'
import type { ActionState } from '@/lib/actions/types'

export async function markNotificationsRead(): Promise<ActionState> {
  const me = await getCurrentUser()
  if (!me) return { error: 'Tu sesión venció.' }
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, me.id), isNull(notifications.readAt)))
  revalidatePath('/', 'layout')
  return { ok: true }
}
