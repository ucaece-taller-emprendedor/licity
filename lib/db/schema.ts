import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  unique,
} from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  role: text('role', { enum: ['SUPERADMIN', 'BUSINESS', 'CLIENT'] })
    .notNull()
    .default('CLIENT'),
  status: text('status', { enum: ['ACTIVE', 'SUSPENDED'] })
    .notNull()
    .default('ACTIVE'),
  isDemo: boolean('isDemo').notNull().default(false),
  // true para quien entró con Google y todavía no eligió si es PyME o contratista
  needsRoleSelection: boolean('needsRoleSelection').notNull().default(false),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

const uuid = sql`gen_random_uuid()::text`
const tz = (name: string) => timestamp(name, { withTimezone: true })

export const clientProfiles = pgTable('client_profiles', {
  id: text('id').primaryKey().default(uuid),
  userId: text('userId')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  companyName: text('companyName').notNull(),
  cuit: text('cuit'),
  city: text('city').notNull(),
  phone: text('phone'),
  createdAt: tz('createdAt').notNull().defaultNow(),
  updatedAt: tz('updatedAt').notNull().defaultNow(),
})

export const contractorProfiles = pgTable('contractor_profiles', {
  id: text('id').primaryKey().default(uuid),
  userId: text('userId')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  displayName: text('displayName').notNull(),
  cuit: text('cuit').notNull(),
  specialty: text('specialty').notNull(),
  city: text('city').notNull(),
  coverageZone: text('coverageZone'),
  description: text('description'),
  phone: text('phone'),
  yearsExperience: integer('yearsExperience'),
  verificationStatus: text('verificationStatus', {
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
  })
    .notNull()
    .default('PENDING'),
  rejectionReason: text('rejectionReason'),
  verifiedAt: tz('verifiedAt'),
  verifiedBy: text('verifiedBy'),
  createdAt: tz('createdAt').notNull().defaultNow(),
  updatedAt: tz('updatedAt').notNull().defaultNow(),
})

export const verificationRequests = pgTable(
  'verification_requests',
  {
    id: text('id').primaryKey().default(uuid),
    contractorUserId: text('contractorUserId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status', { enum: ['PENDING', 'APPROVED', 'REJECTED'] })
      .notNull()
      .default('PENDING'),
    snapshot: jsonb('snapshot'),
    reason: text('reason'),
    submittedAt: tz('submittedAt').notNull().defaultNow(),
    reviewedAt: tz('reviewedAt'),
    reviewedBy: text('reviewedBy'),
  },
  (t) => [index('verification_requests_status_idx').on(t.status)],
)

export const works = pgTable(
  'works',
  {
    id: text('id').primaryKey().default(uuid),
    clientUserId: text('clientUserId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    city: text('city').notNull(),
    desiredStartDate: date('desiredStartDate', { mode: 'string' }),
    estimatedDays: integer('estimatedDays'),
    budgetEstimate: numeric('budgetEstimate', { precision: 14, scale: 2 }),
    status: text('status', {
      enum: [
        'PUBLISHED',
        'RECEIVING_OFFERS',
        'EVALUATING',
        'AWARDED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
      ],
    })
      .notNull()
      .default('PUBLISHED'),
    progress: integer('progress').notNull().default(0),
    publishedAt: tz('publishedAt').notNull().defaultNow(),
    awardedAt: tz('awardedAt'),
    startedAt: tz('startedAt'),
    contractorDoneAt: tz('contractorDoneAt'),
    completedAt: tz('completedAt'),
    reportedAt: tz('reportedAt'),
    reportReason: text('reportReason'),
    reportedBy: text('reportedBy'),
    cancelReason: text('cancelReason'),
    isDemo: boolean('isDemo').notNull().default(false),
    createdAt: tz('createdAt').notNull().defaultNow(),
    updatedAt: tz('updatedAt').notNull().defaultNow(),
  },
  (t) => [
    index('works_status_idx').on(t.status),
    index('works_client_idx').on(t.clientUserId),
  ],
)

export const offers = pgTable(
  'offers',
  {
    id: text('id').primaryKey().default(uuid),
    workId: text('workId')
      .notNull()
      .references(() => works.id, { onDelete: 'cascade' }),
    contractorUserId: text('contractorUserId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    description: text('description').notNull(),
    estimatedDays: integer('estimatedDays').notNull(),
    notes: text('notes'),
    status: text('status', {
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
    })
      .notNull()
      .default('PENDING'),
    createdAt: tz('createdAt').notNull().defaultNow(),
    updatedAt: tz('updatedAt').notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.workId, t.contractorUserId),
    uniqueIndex('offers_one_accepted_per_work')
      .on(t.workId)
      .where(sql`status = 'ACCEPTED'`),
    index('offers_work_idx').on(t.workId),
    index('offers_contractor_idx').on(t.contractorUserId),
  ],
)

export const awards = pgTable('awards', {
  id: text('id').primaryKey().default(uuid),
  workId: text('workId')
    .notNull()
    .unique()
    .references(() => works.id, { onDelete: 'cascade' }),
  offerId: text('offerId')
    .notNull()
    .unique()
    .references(() => offers.id, { onDelete: 'cascade' }),
  contractorUserId: text('contractorUserId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  clientUserId: text('clientUserId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  awardedAt: tz('awardedAt').notNull().defaultNow(),
})

export const workUpdates = pgTable(
  'work_updates',
  {
    id: text('id').primaryKey().default(uuid),
    workId: text('workId')
      .notNull()
      .references(() => works.id, { onDelete: 'cascade' }),
    authorUserId: text('authorUserId').references(() => user.id, {
      onDelete: 'set null',
    }),
    kind: text('kind', { enum: ['STATUS', 'PROGRESS', 'NOTE'] }).notNull(),
    fromStatus: text('fromStatus'),
    toStatus: text('toStatus'),
    progress: integer('progress'),
    message: text('message'),
    createdAt: tz('createdAt').notNull().defaultNow(),
  },
  (t) => [index('work_updates_work_idx').on(t.workId, t.createdAt)],
)

export const payments = pgTable('payments', {
  id: text('id').primaryKey().default(uuid),
  workId: text('workId')
    .notNull()
    .unique()
    .references(() => works.id, { onDelete: 'cascade' }),
  finalAmount: numeric('finalAmount', { precision: 14, scale: 2 }).notNull(),
  commissionRate: numeric('commissionRate', { precision: 6, scale: 4 }).notNull(),
  commissionAmount: numeric('commissionAmount', { precision: 14, scale: 2 }).notNull(),
  status: text('status', { enum: ['PENDING_GATEWAY', 'TEST_RECORD'] })
    .notNull()
    .default('PENDING_GATEWAY'),
  providerRef: text('providerRef'),
  completedAt: tz('completedAt').notNull(),
  isDemo: boolean('isDemo').notNull().default(false),
  createdAt: tz('createdAt').notNull().defaultNow(),
})

export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey().default(uuid),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body'),
    href: text('href'),
    readAt: tz('readAt'),
    createdAt: tz('createdAt').notNull().defaultNow(),
  },
  (t) => [index('notifications_user_idx').on(t.userId, t.createdAt)],
)

export type Role = (typeof user.$inferSelect)['role']
export type WorkStatus = (typeof works.$inferSelect)['status']
export type OfferStatus = (typeof offers.$inferSelect)['status']
