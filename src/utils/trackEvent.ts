/**
 * Centralized event tracking for the app. Events are stored in-memory and persisted to IndexedDB
 * so the Demo Mode drawer can display the last 50 events.
 */
import { db } from '@/lib/db'

export interface LoggedEvent {
  id?: number
  ts: string
  name: string
  payload?: unknown
}

const inMemoryLog: LoggedEvent[] = []
const MAX_MEMORY = 50
const PERSIST_DEBOUNCE_MS = 500
let persistTimer: ReturnType<typeof setTimeout> | null = null

function persistLog() {
  const toAdd = inMemoryLog.slice(-MAX_MEMORY)
  if (toAdd.length === 0) return
  db.eventLog.bulkAdd(
    toAdd.map((e) => ({ ts: e.ts, name: e.name, payload: e.payload }))
  ).catch(() => {})
}

export function trackEvent(name: string, payload?: object): void {
  const event: LoggedEvent = {
    ts: new Date().toISOString(),
    name,
    payload,
  }
  inMemoryLog.push(event)
  if (inMemoryLog.length > MAX_MEMORY) inMemoryLog.shift()

  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    persistLog()
    persistTimer = null
  }, PERSIST_DEBOUNCE_MS)
}

/** Used by Demo Mode Events tab — in-memory + recent from DB, capped at 50. */
export async function getRecentEvents(limit = 50): Promise<LoggedEvent[]> {
  const fromDb = await db.eventLog.orderBy('id').reverse().limit(limit).toArray()
  const fromMem = [...inMemoryLog].reverse()
  const seen = new Set<string>()
  const merged: LoggedEvent[] = []
  for (const e of fromMem) {
    const key = `${e.ts}-${e.name}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(e)
    }
  }
  for (const e of fromDb) {
    const key = `${e.ts}-${e.name}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push({ ...e, id: e.id })
    }
  }
  return merged
    .sort((a, b) => (b.ts > a.ts ? 1 : -1))
    .slice(0, limit)
}
