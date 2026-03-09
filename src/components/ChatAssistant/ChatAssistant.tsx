import { useState, useCallback } from 'react'
import { useSession } from '@/context/SessionContext'
import { createEntry } from '@/lib/entries'
import { deleteEntry, getLastEntry } from '@/lib/entries'
import { getEntriesByUserAndDate } from '@/lib/entries'
import { trackEvent } from '@/utils/trackEvent'
import { parse, type ActionProposal } from './RulesEngine'
import type { TimeEntry } from '@/types/entry'

import './ChatAssistant.css'

interface ChatAssistantProps {
  onClose: () => void
}

export function ChatAssistant({ onClose }: ChatAssistantProps) {
  const { user } = useSession()
  const [input, setInput] = useState('')
  const [proposal, setProposal] = useState<ActionProposal | null>(null)
  const [listResult, setListResult] = useState<TimeEntry[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSend = useCallback(() => {
    if (!user || !input.trim()) return
    setListResult(null)
    setMessage(null)
    const result = parse(input.trim())
    setProposal(result)
    if (result.intent === 'list_time_entries') {
      getEntriesByUserAndDate(user.id, result.args.date as string).then(
        setListResult
      )
    }
    setInput('')
  }, [user, input])

  const handleConfirm = useCallback(async () => {
    if (!user || !proposal) return
    if (proposal.intent === 'create_time_entry') {
      const args = proposal.args as {
        durationMinutes: number
        customer: string
        notes?: string
        date: string
      }
      await createEntry(user.id, {
        customer: args.customer,
        notes: args.notes ?? '',
        date: args.date,
        durationMinutes: args.durationMinutes,
        source: 'manual',
      })
      trackEvent('assistant_action_confirmed', {
        intent: 'create_time_entry',
        entry: args,
      })
      setMessage('Entry created.')
    } else if (proposal.intent === 'delete_last_entry') {
      const last = await getLastEntry(user.id)
      if (last) {
        await deleteEntry(last.id, user.id)
        trackEvent('assistant_action_confirmed', {
          intent: 'delete_last_entry',
          entryId: last.id,
        })
        setMessage('Last entry deleted.')
      } else {
        setMessage('No entry to delete.')
      }
    }
    setProposal(null)
  }, [user, proposal])

  const handleCancelProposal = useCallback(() => {
    setProposal(null)
  }, [])

  if (!user) return null

  return (
    <div className="chat-assistant">
      <div className="chat-assistant-header">
        <h3>Chat Assistant</h3>
        <button type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <p className="chat-assistant-hint">
        Try: &quot;Log 45 minutes for Acme today: demo prep&quot; or
        &quot;Delete my last entry&quot;
      </p>
      <div className="chat-assistant-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a command..."
        />
        <button type="button" onClick={handleSend}>
          Send
        </button>
      </div>
      {message && <p className="chat-assistant-message">{message}</p>}
      {proposal && proposal.intent !== 'no_action' && (
        <div className="chat-assistant-proposal">
          <pre>{JSON.stringify(proposal, null, 2)}</pre>
          {proposal.requiresConfirmation ? (
            <div className="chat-assistant-actions">
              <button type="button" onClick={handleConfirm}>
                Confirm
              </button>
              <button type="button" onClick={handleCancelProposal}>
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      )}
      {proposal?.intent === 'no_action' && proposal.confidence === 0 && (
        <p className="chat-assistant-unknown">No matching command. Try logging or listing entries.</p>
      )}
      {listResult && (
        <div className="chat-assistant-list">
          <strong>Today&apos;s entries:</strong>
          <ul>
            {listResult.map((e) => (
              <li key={e.id}>
                {e.customer}: {Math.round(e.durationMinutes)} min
                {e.notes ? ` — ${e.notes}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
