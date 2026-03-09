/**
 * Seed 10 demo customers per user. Idempotent: only adds missing names for the user.
 */
import { db } from '@/lib/db'

export const SEED_CUSTOMER_NAMES = [
  'Acme Corp',
  'Globex Industries',
  'Initech',
  'Umbrella Corp',
  'Wayne Enterprises',
  'Stark Industries',
  'Wonka Industries',
  'Cyberdyne Systems',
  'Oscorp',
  'Monsters Inc',
]

/**
 * Ensures the given user has all 10 seed customers. Call when loading customers or on app init.
 * Uses deterministic ids so re-running (e.g. double mount) does not create duplicates.
 */
export async function ensureCustomersSeeded(userId: string): Promise<void> {
  const existing = await db.customers.where('userId').equals(userId).toArray()
  const existingNames = new Set(existing.map((c) => c.name))
  const toAdd = SEED_CUSTOMER_NAMES.filter((name) => !existingNames.has(name))
  if (toAdd.length === 0) return
  const now = new Date().toISOString()
  await db.customers.bulkPut(
    toAdd.map((name) => ({
      id: `${userId}|${name}`,
      userId,
      name,
      createdAt: now,
    }))
  )
}
