import { useState, useEffect } from 'react'
import { useSession } from '@/context/SessionContext'
import { updateCustomer, deleteCustomer } from '@/lib/customers'
import { getEntriesByUserAndCustomer } from '@/lib/entries'
import type { Customer } from '@/types/customer'
import type { TimeEntry } from '@/types/entry'
import { NotesContent } from '@/components/NotesContent'
import { formatDisplayDate } from '@/utils/dateFormat'
import './CustomerModal.css'

interface CustomerModalProps {
  customer: Customer
  onClose: () => void
  onUpdated: (updated: Customer) => void
  onDeleted: () => void
}

export function CustomerModal({
  customer,
  onClose,
  onUpdated,
  onDeleted,
}: CustomerModalProps) {
  const { user } = useSession()
  const [editName, setEditName] = useState(customer.name)
  const [saving, setSaving] = useState(false)
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setEditName(customer.name)
  }, [customer.id, customer.name])

  useEffect(() => {
    if (!user) return
    getEntriesByUserAndCustomer(user.id, customer.name).then(setEntries)
  }, [user, customer.name])

  const handleSaveName = async () => {
    if (!user || editName.trim() === customer.name) return
    setSaving(true)
    try {
      const updated = await updateCustomer(customer.id, user.id, {
        name: editName.trim(),
      })
      if (updated) {
        onUpdated(updated)
        setEditName(updated.name)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    setDeleting(true)
    try {
      const ok = await deleteCustomer(customer.id, user.id)
      if (ok) {
        onDeleted()
        onClose()
      }
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const totalMinutes = entries.reduce((s, e) => s + e.durationMinutes, 0)
  const displayMinutes = (n: number) => Math.round(n)

  return (
    <div className="customer-modal-backdrop" onClick={onClose}>
      <div
        className="customer-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="customer-modal-title"
      >
        <div className="customer-modal-header">
          <h2 id="customer-modal-title">Customer</h2>
          <button
            type="button"
            className="customer-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="customer-modal-body">
          <section className="customer-modal-section">
            <label htmlFor="customer-modal-name">Name</label>
            <div className="customer-modal-name-row">
              <input
                id="customer-modal-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={saving || editName.trim() === customer.name}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </section>

          <section className="customer-modal-section">
            <h3>Time entries</h3>
            {entries.length === 0 ? (
              <p className="customer-modal-empty">No time entries for this customer.</p>
            ) : (
              <>
                <p className="customer-modal-summary">
                  {entries.length} entr{entries.length === 1 ? 'y' : 'ies'} · {displayMinutes(totalMinutes)} min total
                </p>
                <ul className="customer-modal-entries">
                  {entries.map((e) => (
                    <li key={e.id}>
                      <span className="entry-date">{formatDisplayDate(e.date)}</span>
                      <span className="entry-duration">{displayMinutes(e.durationMinutes)} min</span>
                      {e.notes && <span className="entry-notes"><NotesContent html={e.notes} /></span>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="customer-modal-section customer-modal-actions">
            {!showDeleteConfirm ? (
              <button
                type="button"
                className="customer-modal-delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete customer
              </button>
            ) : (
              <div className="customer-modal-delete-confirm">
                <p>Remove this customer from your list? Time entries will keep the customer name but it will no longer appear in dropdowns.</p>
                <div className="customer-modal-delete-buttons">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="customer-modal-delete-confirm-btn"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
