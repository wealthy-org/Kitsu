import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
export const authNonces = pgTable(
  'auth_nonces',
  {
    nonce: text('nonce').primaryKey(),
    walletAddress: text('wallet_address').notNull(),
    purpose: text('purpose').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    check('auth_nonces_purpose_check', sql`${table.purpose} in ('login', 'submit')`),
  ],
)

export const sessions = pgTable('sessions', {
  token: text('token').primaryKey(),
  walletAddress: text('wallet_address').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const dailyCourses = pgTable(
  'daily_courses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    courseDate: date('course_date').notNull().unique(),
    seed: text('seed').notNull(),
    segments: jsonb('segments').notNull(),
    status: text('status').notNull().default('draft'),
    onchainTxHash: text('onchain_tx_hash'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    check('daily_courses_status_check', sql`${table.status} in ('draft', 'published')`),
  ],
)

export const runs = pgTable(
  'runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    walletAddress: text('wallet_address').notNull(),
    courseDate: date('course_date').notNull(),
    inputLog: jsonb('input_log').notNull(),
    claimedScore: numeric('claimed_score').notNull(),
    claimedTimeMs: integer('claimed_time_ms').notNull(),
    verifiedScore: numeric('verified_score'),
    verifiedTimeMs: integer('verified_time_ms'),
    status: text('status').default('submitted'),
    onchainTxHash: text('onchain_tx_hash'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    check(
      'runs_status_check',
      sql`${table.status} in ('submitted', 'verified', 'rejected', 'relayed')`,
    ),
    index('runs_wallet_course_created_idx').on(
      table.walletAddress,
      table.courseDate,
      table.createdAt,
    ),
    index('runs_status_created_idx').on(table.status, table.createdAt),
  ],
)

export const leaderboardDaily = pgTable(
  'leaderboard_daily',
  {
    courseDate: date('course_date').notNull(),
    walletAddress: text('wallet_address').notNull(),
    bestScore: numeric('best_score').notNull(),
    bestTimeMs: integer('best_time_ms').notNull(),
    rank: integer('rank'),
  },
  (table) => [
    primaryKey({ columns: [table.courseDate, table.walletAddress] }),
    index('leaderboard_daily_course_time_idx').on(table.courseDate, table.bestTimeMs),
  ],
)

export const seasonRewards = pgTable(
  'season_rewards',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    seasonLabel: text('season_label').notNull(),
    walletAddress: text('wallet_address').notNull(),
    finalRank: integer('final_rank').notNull(),
    rewardAmount: numeric('reward_amount').notNull(),
    claimed: boolean('claimed').default(false),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [index('season_rewards_label_rank_idx').on(table.seasonLabel, table.finalRank)],
)

export const seasons = pgTable('seasons', {
  id: uuid('id').defaultRandom().primaryKey(),
  label: text('label').notNull().unique(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  pool: numeric('pool').notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventType: text('event_type').notNull(),
    actorWallet: text('actor_wallet'),
    detail: jsonb('detail'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [index('audit_logs_event_created_idx').on(table.eventType, table.createdAt)],
)
