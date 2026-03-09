/**
 * Rules-based intent parser for the Chat Assistant. No AI or remote calls.
 * Replace the parse() implementation with a call to your AI backend when migrating.
 */
export type Intent =
  | 'create_time_entry'
  | 'update_time_entry'
  | 'delete_last_entry'
  | 'list_time_entries'
  | 'no_action'

export interface ActionProposal {
  intent: Intent
  args: Record<string, unknown>
  requiresConfirmation: boolean
  confidence: number
}

const TODAY = new Date().toISOString().slice(0, 10)

function extractMinutes(text: string): number | null {
  const patterns = [
    /(\d+)\s*min(?:ute)?s?/i,
    /(\d+)\s*h(?:our)?s?/i,
    /(\d+)\s*hrs?/i,
    /for\s+(\d+)/i,
    /(\d+)\s+min/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const n = parseInt(m[1], 10)
      if (re.source.includes('h')) return n * 60
      return n
    }
  }
  return null
}

function extractCustomer(text: string): string | null {
  const logFor = /log\s+(?:\d+\s*(?:min|minutes?|h|hours?)\s+)?(?:for\s+)?([^:]+?)(?:\s*today|\s*:|\s*$)/i.exec(text)
  if (logFor) return logFor[1].trim() || null
  const forAcme = /for\s+([A-Za-z0-9\s]+?)(?:\s+today|:|\s*$)/i.exec(text)
  if (forAcme) return forAcme[1].trim() || null
  return null
}

function extractNotes(text: string): string | null {
  const afterColon = /:\s*(.+)$/.exec(text)
  if (afterColon) return afterColon[1].trim() || null
  return null
}

/**
 * Parse user message into a structured action proposal.
 * In production: replace with a call to your AI API and map response to ActionProposal.
 */
export function parse(message: string): ActionProposal {
  const normalized = message.trim().toLowerCase()
  // normalized reserved for future case-insensitive patterns
  void normalized

  // "delete my last entry" / "remove last entry"
  if (
    /delete\s+(?:my\s+)?last\s+entry/i.test(message) ||
    /remove\s+(?:my\s+)?last\s+entry/i.test(message) ||
    /undo\s+last\s+entry/i.test(message)
  ) {
    return {
      intent: 'delete_last_entry',
      args: {},
      requiresConfirmation: true,
      confidence: 0.95,
    }
  }

  // "What did I log today?" / "list today's entries"
  if (
    /what\s+did\s+I\s+log/i.test(message) ||
    /list\s+(?:my\s+)?(?:time\s+)?entries/i.test(message) ||
    /show\s+(?:my\s+)?entries/i.test(message) ||
    /today'?s?\s+entries/i.test(message)
  ) {
    return {
      intent: 'list_time_entries',
      args: { date: TODAY },
      requiresConfirmation: false,
      confidence: 0.9,
    }
  }

  // "Log X minutes for Customer [today]: notes"
  const createMatch =
    /log\s+(\d+)\s*(?:min(?:ute)?s?|h(?:our)?s?|hrs?)\s+for\s+([^:]+?)(?:\s+today)?(?:\s*:\s*(.+))?$/i.exec(
      message
    ) ||
    /log\s+(\d+)\s*(?:min|minutes?|h|hours?)\s+for\s+([^:]+?)(?:\s*:\s*(.+))?$/i.exec(
      message
    )
  if (createMatch) {
    const rawMinutes = parseInt(createMatch[1], 10)
    const isHours = /h|hour/i.test(createMatch[0])
    const durationMinutes = isHours ? rawMinutes * 60 : rawMinutes
    const customer = createMatch[2].trim()
    const notes = (createMatch[3] || '').trim()
    return {
      intent: 'create_time_entry',
      args: {
        durationMinutes,
        customer,
        notes: notes || undefined,
        date: TODAY,
      },
      requiresConfirmation: true,
      confidence: 0.9,
    }
  }

  const mins = extractMinutes(message)
  const customer = extractCustomer(message)
  const notes = extractNotes(message)
  if (mins != null && mins > 0 && customer) {
    return {
      intent: 'create_time_entry',
      args: {
        durationMinutes: mins,
        customer,
        notes: notes || undefined,
        date: TODAY,
      },
      requiresConfirmation: true,
      confidence: 0.75,
    }
  }

  return {
    intent: 'no_action',
    args: {},
    requiresConfirmation: false,
    confidence: 0,
  }
}
