/**
 * Time entry CRUD — all operations scoped by userId. Data stored in IndexedDB via Dexie.
 */
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import type { TimeEntry } from '@/types/entry'
import { SCHEMA_VERSION } from '@/types/entry'
import { trackEvent } from '@/utils/trackEvent'
import {
  trackTimeEntryCreated,
} from '@/lib/launchDarklyEvents'

export type EntrySource = TimeEntry['source']

export async function createEntry(
  userId: string,
  params: {
    customer: string
    project?: string
    notes: string
    date: string
    durationMinutes: number
    source?: EntrySource
    billable?: boolean
    hourlyRate?: number
  }
): Promise<TimeEntry> {
  const now = new Date().toISOString()
  const source = params.source ?? 'manual'
  const entry: TimeEntry = {
    id: uuidv4(),
    userId,
    customer: params.customer.trim(),
    project: params.project?.trim(),
    notes: params.notes.trim(),
    date: params.date,
    durationMinutes: params.durationMinutes,
    createdAt: now,
    updatedAt: now,
    source,
    schemaVersion: SCHEMA_VERSION,
    billable: params.billable ?? true,
    hourlyRate: params.hourlyRate,
  }
  await db.entries.add(entry)
  trackEvent('entry_created', {
    entryId: entry.id,
    userId,
    customer: entry.customer,
    durationMinutes: entry.durationMinutes,
  })
  trackTimeEntryCreated(source, {
    entryId: entry.id,
    userId,
    customer: entry.customer,
    durationMinutes: entry.durationMinutes,
    source,
    date: entry.date,
  })
  return entry
}

export async function updateEntry(
  entryId: string,
  userId: string,
  updates: Partial<Pick<TimeEntry, 'customer' | 'project' | 'notes' | 'date' | 'durationMinutes' | 'billable' | 'hourlyRate'>>
): Promise<TimeEntry | undefined> {
  const entry = await db.entries.get(entryId)
  if (!entry || entry.userId !== userId) return undefined
  const updated: TimeEntry = {
    ...entry,
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  await db.entries.put(updated)
  trackEvent('entry_updated', { entryId, fieldsChanged: Object.keys(updates) })
  return updated
}

export async function deleteEntry(entryId: string, userId: string): Promise<boolean> {
  const entry = await db.entries.get(entryId)
  if (!entry || entry.userId !== userId) return false
  await db.entries.delete(entryId)
  trackEvent('entry_deleted', { entryId })
  return true
}

export async function getEntry(entryId: string, userId: string): Promise<TimeEntry | undefined> {
  const entry = await db.entries.get(entryId)
  return entry && entry.userId === userId ? entry : undefined
}

export async function getEntriesByUserAndDate(
  userId: string,
  date: string
): Promise<TimeEntry[]> {
  return db.entries.where('[userId+date]').equals([userId, date]).sortBy('createdAt')
}

export async function getEntriesByUserInRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<TimeEntry[]> {
  const all = await db.entries.where('userId').equals(userId).toArray()
  return all.filter((e) => e.date >= startDate && e.date <= endDate).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
}

export async function getLastEntry(userId: string): Promise<TimeEntry | undefined> {
  const list = await db.entries.where('userId').equals(userId).sortBy('createdAt')
  return list[list.length - 1]
}

export async function getDistinctCustomers(userId: string): Promise<string[]> {
  const all = await db.entries.where('userId').equals(userId).toArray()
  const set = new Set(all.map((e) => e.customer).filter(Boolean))
  return Array.from(set).sort()
}

/** All entries for a user that have the given customer name. */
export async function getEntriesByUserAndCustomer(
  userId: string,
  customerName: string
): Promise<TimeEntry[]> {
  const all = await db.entries.where('userId').equals(userId).toArray()
  return all
    .filter((e) => e.customer === customerName)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
}

/** Update customer name on all entries that currently have oldName. */
export async function updateEntriesCustomerName(
  userId: string,
  oldName: string,
  newName: string
): Promise<void> {
  const all = await db.entries.where('userId').equals(userId).toArray()
  const toUpdate = all.filter((e) => e.customer === oldName)
  for (const entry of toUpdate) {
    await updateEntry(entry.id, userId, { customer: newName })
  }
}

/** Duplicate an entry (new id, same data; date can be overridden). Returns the new entry. */
export async function duplicateEntry(
  entryId: string,
  userId: string,
  overrides?: { date?: string }
): Promise<TimeEntry | undefined> {
  const entry = await db.entries.get(entryId)
  if (!entry || entry.userId !== userId) return undefined
  const now = new Date().toISOString()
  const newEntry: TimeEntry = {
    ...entry,
    id: uuidv4(),
    date: overrides?.date ?? entry.date,
    createdAt: now,
    updatedAt: now,
  }
  await db.entries.add(newEntry)
  trackEvent('entry_created', {
    entryId: newEntry.id,
    userId,
    customer: newEntry.customer,
    durationMinutes: newEntry.durationMinutes,
    duplicatedFrom: entryId,
  })
  trackTimeEntryCreated('manual', {
    entryId: newEntry.id,
    userId,
    customer: newEntry.customer,
    durationMinutes: newEntry.durationMinutes,
    source: 'manual',
    date: newEntry.date,
    duplicatedFrom: entryId,
  })
  return newEntry
}
