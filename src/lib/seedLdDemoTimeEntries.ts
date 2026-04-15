import { createCustomer } from '@/lib/customers'
import { createEntry } from '@/lib/entries'
import type { TimeEntry } from '@/types/entry'
import { formatDateLocal } from '@/utils/dateFormat'
import { decimalToMinutes } from '@/utils/duration'

/** Fixed demo rows for LD Admin Tools → Seed time entries. */
export const LD_DEMO_TIME_ENTRY_SEEDS: ReadonlyArray<{
  customer: string
  hours: number
  notes: string
}> = [
  { customer: 'Acme Corp', hours: 1, notes: 'built homepage CTA experiement' },
  {
    customer: 'Initech',
    hours: 1,
    notes: 'Implement user authentication for internal dashboard',
  },
  { customer: 'Monsters Inc', hours: 2, notes: 'Developing new scare tactics' },
  { customer: 'Stark Industries', hours: 2, notes: 'Testing new Iron Man' },
  { customer: 'Taco Hut', hours: 0.5, notes: 'Picking tomatoes for salsa' },
  { customer: 'Wayne Enterprises', hours: 0.5, notes: 'Washing the batmobile' },
  { customer: 'Umbrella Corp', hours: 1, notes: 'Doing a rain dance' },
]

/**
 * Creates one manual time entry per seed row for the given user.
 * Uses `options.date` (YYYY-MM-DD) when provided; otherwise today in local time.
 * Ensures each customer exists in the customer list.
 * When `registerAsPausedTimer` is set (same as after manual submit in EntryForm), each created entry is wired into the timer UI so resume works.
 */
export async function seedLdDemoTimeEntries(
  userId: string,
  options?: {
    date?: string
    registerAsPausedTimer?: (entry: TimeEntry) => void
  }
): Promise<number> {
  const date = options?.date ?? formatDateLocal(new Date())
  const register = options?.registerAsPausedTimer
  for (const row of LD_DEMO_TIME_ENTRY_SEEDS) {
    await createCustomer(userId, row.customer)
    const entry = await createEntry(userId, {
      customer: row.customer,
      notes: row.notes,
      date,
      durationMinutes: decimalToMinutes(row.hours),
      source: 'manual',
    })
    register?.(entry)
  }
  return LD_DEMO_TIME_ENTRY_SEEDS.length
}
