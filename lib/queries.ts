import 'server-only'
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  contractorProfiles,
  notifications,
  offers,
  user,
  workUpdates,
} from '@/lib/db/schema'

export async function getRecentNotifications(userId: string, limit = 6) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
}

export async function getUnreadCount(userId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
  return row?.count ?? 0
}

export async function getTimeline(workId: string) {
  return db
    .select({
      id: workUpdates.id,
      kind: workUpdates.kind,
      toStatus: workUpdates.toStatus,
      progress: workUpdates.progress,
      message: workUpdates.message,
      createdAt: workUpdates.createdAt,
      authorName: user.name,
    })
    .from(workUpdates)
    .leftJoin(user, eq(user.id, workUpdates.authorUserId))
    .where(eq(workUpdates.workId, workId))
    .orderBy(asc(workUpdates.createdAt))
}

export async function getOffersWithContractors(workId: string) {
  return db
    .select({
      id: offers.id,
      amount: offers.amount,
      estimatedDays: offers.estimatedDays,
      description: offers.description,
      notes: offers.notes,
      status: offers.status,
      createdAt: offers.createdAt,
      contractorUserId: offers.contractorUserId,
      displayName: contractorProfiles.displayName,
      specialty: contractorProfiles.specialty,
      city: contractorProfiles.city,
      yearsExperience: contractorProfiles.yearsExperience,
      verificationStatus: contractorProfiles.verificationStatus,
      contractorStatus: user.status,
    })
    .from(offers)
    .innerJoin(contractorProfiles, eq(contractorProfiles.userId, offers.contractorUserId))
    .innerJoin(user, eq(user.id, offers.contractorUserId))
    .where(eq(offers.workId, workId))
    .orderBy(asc(offers.amount))
}
