/**
 * IndexedDB schema via Dexie. All data is per-user; we filter by userId at query time.
 * To add a real backend later: add sync layer that reads/writes from API and keeps Dexie as cache.
 */
import Dexie, { type Table } from 'dexie'
import type { TimeEntry } from '@/types/entry'
import type { Customer } from '@/types/customer'
import type { Project } from '@/types/project'

const DB_NAME = 'time-tracker-demo'

export class TimeTrackerDB extends Dexie {
  entries!: Table<TimeEntry, string>
  eventLog!: Table<{ id?: number; ts: string; name: string; payload: unknown }, number>
  customers!: Table<Customer, string>
  projects!: Table<Project, string>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      entries: 'id, userId, date, [userId+date]',
      eventLog: '++id, ts, name',
    })
    this.version(2).stores({
      entries: 'id, userId, date, [userId+date]',
      eventLog: '++id, ts, name',
      customers: 'id, userId',
    })
    this.version(3).stores({
      entries: 'id, userId, date, [userId+date]',
      eventLog: '++id, ts, name',
      customers: 'id, userId',
      projects: 'id, userId, customerId, [userId+customerId]',
    })
  }
}

export const db = new TimeTrackerDB()
