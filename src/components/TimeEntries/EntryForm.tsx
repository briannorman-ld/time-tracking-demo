import { useState, useEffect } from 'react'
import { useSession } from '@/context/SessionContext'
import { useTimer } from '@/context/TimerContext'
import { createEntry } from '@/lib/entries'
import type { RoundingMinutes } from '@/lib/preferences'
import { roundToNearest } from '@/lib/preferences'
import { decimalToMinutes, minutesToDecimal } from '@/utils/duration'
import { RichNotesEditor } from '@/components/RichNotesEditor'
import { CustomerSelect, CREATE_NEW_VALUE } from './CustomerSelect'
import './EntryForm.css'

function notesTrimmedForSubmit(html: string): string {
  const v = (html || '').trim()
  if (!v || v === '<p></p>' || v === '<p><br></p>') return ''
  return v
}

interface EntryFormProps {
  focusDate: string
  customerNames: string[]
  onCreateCustomer?: (name: string) => Promise<string>
  onCreated?: () => void
  onSave?: (updates: {
    customer?: string
    notes?: string
    date?: string
    durationMinutes?: number
    billable?: boolean
    hourlyRate?: number
  }) => void
  onCancel?: () => void
  uxVariant?: 'form' | 'quickAdd'
  rounding?: RoundingMinutes
  entryId?: string
  initialCustomer?: string
  initialNotes?: string
  initialDuration?: number
  initialBillable?: boolean
}

/** Default billable when not shown in UI (checkbox removed). */
const DEFAULT_BILLABLE = true

export function EntryForm({
  focusDate,
  customerNames,
  onCreateCustomer,
  onCreated,
  onSave,
  onCancel,
  uxVariant = 'form',
  rounding = 0,
  entryId,
  initialCustomer = '',
  initialNotes = '',
  initialDuration = 0,
  initialBillable = true,
}: EntryFormProps) {
  const { user } = useSession()
  const timer = useTimer()
  const [customer, setCustomer] = useState(initialCustomer)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [creating, setCreating] = useState(false)
  const [notes, setNotes] = useState(initialNotes)
  const [date, setDate] = useState(focusDate)
  const [durationHours, setDurationHours] = useState(
    () => (initialDuration ? minutesToDecimal(initialDuration) : 0.5)
  )
  const billable = initialBillable ?? DEFAULT_BILLABLE
  const isEdit = Boolean(entryId)
  const customerOptions =
    initialCustomer && !customerNames.includes(initialCustomer)
      ? [initialCustomer, ...customerNames]
      : customerNames
  const showNewCustomerInput = customer === CREATE_NEW_VALUE

  const handleCreateCustomer = async () => {
    const name = newCustomerName.trim()
    if (!name || !onCreateCustomer) return
    setCreating(true)
    try {
      const created = await onCreateCustomer(name)
      setCustomer(created)
      setNewCustomerName('')
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    if (!isEdit) setDate(focusDate)
  }, [focusDate, isEdit])

  useEffect(() => {
    if (isEdit && initialDuration != null) setDurationHours(minutesToDecimal(initialDuration))
  }, [isEdit, initialDuration])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || customer === CREATE_NEW_VALUE) return
    const durationMinutes = decimalToMinutes(durationHours)
    const rounded = roundToNearest(durationMinutes, rounding)
    if (isEdit && onSave) {
      onSave({
        customer: customer.trim(),
        notes: notesTrimmedForSubmit(notes),
        date,
        durationMinutes: rounded,
        billable,
      })
    } else {
      const entry = await createEntry(user.id, {
        customer: customer.trim(),
        notes: notesTrimmedForSubmit(notes),
        date,
        durationMinutes: rounded,
        source: 'manual',
        billable,
      })
      timer.addPausedTimer(entry)
      setCustomer('')
      setNotes('')
      setDurationHours(0.5)
      setDate(focusDate)
      onCreated?.()
    }
  }

  if (uxVariant === 'quickAdd') {
    return (
      <form
        className="entry-form quick-add"
        onSubmit={handleSubmit}
      >
        <div className="entry-form-customer-wrap">
          <CustomerSelect
            value={customer}
            onChange={setCustomer}
            options={customerOptions}
            onCreateCustomer={onCreateCustomer}
            placeholder="Select customer"
            className="customer-select-quick-add"
          />
          {showNewCustomerInput && onCreateCustomer && (
            <div className="entry-form-new-customer">
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
        <input
          type="number"
          min={0}
          max={24}
          step={0.01}
          value={durationHours}
          onChange={(e) => setDurationHours(Number(e.target.value))}
          title="Hours"
        />
        <span className="entry-form-suffix">hrs</span>
        <input type="hidden" name="date" value={date} />
        <button type="submit">{isEdit ? 'Save' : 'Add'}</button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            {isEdit ? 'Cancel' : 'Discard'}
          </button>
        )}
      </form>
    )
  }

  return (
    <form className="entry-form entry-form-block" onSubmit={handleSubmit}>
      <h3 className="entry-form-title">Manual entry</h3>
      <div className="entry-form-customer-wrap">
        <CustomerSelect
          value={customer}
          onChange={setCustomer}
          options={customerOptions}
          onCreateCustomer={onCreateCustomer}
          placeholder="Select customer"
        />
        {showNewCustomerInput && onCreateCustomer && (
          <div className="entry-form-new-customer">
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
      <div className="entry-form-date-duration">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="entry-form-date"
          aria-label="Date"
        />
        <input
          type="number"
          min={0}
          max={24}
          step={0.01}
          value={durationHours}
          onChange={(e) => setDurationHours(Number(e.target.value))}
          className="entry-form-duration"
          aria-label="Duration (hours)"
          title="Hours"
        />
        <span className="entry-form-duration-suffix">hrs</span>
      </div>
      <RichNotesEditor
        value={notes}
        onChange={setNotes}
        placeholder="Notes (optional)"
        minHeight="4rem"
        className="entry-form-notes-editor"
      />
      <div className="entry-form-actions">
        <button type="submit" className="entry-form-submit">
          {isEdit ? 'Save' : 'Create entry'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="entry-form-cancel">
            {isEdit ? 'Cancel' : 'Discard'}
          </button>
        )}
      </div>
    </form>
  )
}
