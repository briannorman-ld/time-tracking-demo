import { useState } from 'react'
import type { TimeEntry } from '@/types/entry'
import type { RoundingMinutes } from '@/lib/preferences'
import { EntryForm } from './EntryForm'
import './EntryEditModal.css'

export interface EntryEditModalUpdates {
  customer?: string
  notes?: string
  date?: string
  durationMinutes?: number
  billable?: boolean
  hourlyRate?: number
}

interface EntryEditModalProps {
  entry: TimeEntry
  focusDate: string
  customerNames: string[]
  onCreateCustomer?: (name: string) => Promise<string>
  onSave: (updates: EntryEditModalUpdates) => void | Promise<void>
  onClose: () => void
  onDelete: () => void
  rounding?: RoundingMinutes
}

export function EntryEditModal({
  entry,
  customerNames,
  onCreateCustomer,
  onSave,
  onClose,
  onDelete,
  rounding = 0,
}: EntryEditModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSave = async (updates: EntryEditModalUpdates) => {
    await onSave(updates)
    onClose()
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = () => {
    onDelete()
    onClose()
  }

  return (
    <div className="entry-edit-modal-backdrop" onClick={onClose}>
      <div
        className="entry-edit-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="entry-edit-modal-title"
      >
        <div className="entry-edit-modal-header">
          <h2 id="entry-edit-modal-title">Edit time entry</h2>
          <div className="entry-edit-modal-header-actions">
            {!showDeleteConfirm ? (
              <button
                type="button"
                className="entry-edit-modal-delete"
                onClick={handleDeleteClick}
              >
                Delete
              </button>
            ) : (
              <span className="entry-edit-modal-delete-confirm-label">Delete this entry?</span>
            )}
            <button
              type="button"
              className="entry-edit-modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
        {showDeleteConfirm ? (
          <div className="entry-edit-modal-body entry-edit-modal-delete-section">
            <div className="entry-edit-modal-delete-buttons">
              <button
                type="button"
                className="entry-edit-modal-delete-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="entry-edit-modal-delete-confirm"
                onClick={handleDeleteConfirm}
              >
                Delete entry
              </button>
            </div>
          </div>
        ) : (
          <div className="entry-edit-modal-body">
            <EntryForm
              focusDate={entry.date}
              customerNames={customerNames}
              onCreateCustomer={onCreateCustomer}
              initialCustomer={entry.customer}
              initialNotes={entry.notes}
              initialDuration={entry.durationMinutes}
              initialBillable={entry.billable ?? true}
              entryId={entry.id}
              onSave={handleSave}
              onCancel={onClose}
              rounding={rounding}
              uxVariant="form"
            />
          </div>
        )}
      </div>
    </div>
  )
}
