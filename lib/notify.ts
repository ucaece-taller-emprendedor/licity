import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'

type Executor = Pick<typeof db, 'insert'>

export async function notify(
  userId: string,
  input: { title: string; body?: string; href?: string },
  executor: Executor = db,
) {
  await executor.insert(notifications).values({ userId, ...input })
}
