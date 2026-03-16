import { useState } from 'react'
import { useTimer } from '@/context/TimerContext'
import { RichNotesEditor } from '@/components/RichNotesEditor'
import { CustomerSelect, CREATE_NEW_VALUE } from './CustomerSelect'
import './Timer.css'

interface TimerProps {
  customerNames: string[]
  onCreateCustomer?: (name: string) => Promise<string>
}

export function Timer({ customerNames, onCreateCustomer }: TimerProps) {
  const timer = useTimer()
  const [newCustomerName, setNewCustomerName] = useState('')
  const [creating, setCreating] = useState(false)
  const showNewCustomerInput = timer.draftCustomer === CREATE_NEW_VALUE

  const handleCreateCustomer = async () => {
    const name = newCustomerName.trim()
    if (!name || !onCreateCustomer) return
    setCreating(true)
    try {
      const created = await onCreateCustomer(name)
      timer.setDraftCustomer(created)
      setNewCustomerName('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="timer-block">
      <h3>Timer</h3>
      <p className="timer-block-hint">Start a timer — it will appear in the entries list below. Pause to save that segment as an entry; resume anytime to continue.</p>
      <div className="timer-customer-wrap">
        <CustomerSelect
          value={showNewCustomerInput ? CREATE_NEW_VALUE : timer.draftCustomer}
          onChange={timer.setDraftCustomer}
          options={customerNames}
          onCreateCustomer={onCreateCustomer}
          placeholder="Select customer"
        />
        {showNewCustomerInput && onCreateCustomer && (
          <div className="timer-new-customer">
            <input
              type="text"
              placeholder="New customer name"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCustomer())}
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreateCustomer}
              disabled={!newCustomerName.trim() || creating}
            >
              {creating ? 'Adding…' : 'Add'}
            </button>
          </div>
        )}
      </div>
      <RichNotesEditor
        value={timer.draftNotes}
        onChange={timer.setDraftNotes}
        placeholder="Notes (optional)"
        minHeight="4rem"
        className="timer-notes-editor"
      />
      <button
        type="button"
        onClick={timer.start}
        className="timer-start"
        disabled={!timer.draftCustomer.trim() || timer.draftCustomer === CREATE_NEW_VALUE}
      >
        Start Timer
      </button>
    </div>
  )
}
