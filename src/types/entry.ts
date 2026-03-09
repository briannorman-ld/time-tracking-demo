/**
 * Time entry — stored per user in IndexedDB.
 */
export type EntrySource = 'manual' | 'timer' | 'import'

export interface TimeEntry {
  id: string
  userId: string
  customer: string
  project?: string // project name (optional, for filtering/display)
  notes: string
  date: string // YYYY-MM-DD
  durationMinutes: number
  createdAt: string // ISO
  updatedAt: string // ISO
  source: EntrySource
  schemaVersion: number
  /** Whether this time is billable (Harvest-style). */
  billable?: boolean
  /** Hourly rate in cents or dollars (optional, for reports). */
  hourlyRate?: number
}

export const SCHEMA_VERSION = 2
