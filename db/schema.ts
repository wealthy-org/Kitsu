import { sql } from 'drizzle-orm'
import { check, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

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
