import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '@/context/SessionContext'
import { getCustomers } from '@/lib/customers'
import type { Customer } from '@/types/customer'
import { CustomerModal } from '@/components/CustomerModal'
import './CustomersPage.css'

export function CustomersPage() {
  const { user } = useSession()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const loadCustomers = () => {
    if (!user) return
    getCustomers(user.id).then(setCustomers)
  }

  useEffect(() => {
    loadCustomers()
  }, [user])

  if (!user) return null

  return (
    <div className="customers-page">
      <h1>Customers</h1>
      <p className="customers-page-intro">
        All customers for your account. Use this list when logging time.
      </p>
      <Link to="/" className="customers-page-back">
        ← Back to Time
      </Link>
      <ul className="customers-list">
        {customers.map((c) => (
          <li
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedCustomer(c)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSelectedCustomer(c)
              }
            }}
          >
            <span className="customer-name">{c.name}</span>
          </li>
        ))}
      </ul>
      {selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdated={(updated) => {
            setCustomers((prev) =>
              prev.map((x) => (x.id === updated.id ? updated : x))
            )
            setSelectedCustomer(updated)
          }}
          onDeleted={() => {
            loadCustomers()
            setSelectedCustomer(null)
          }}
        />
      )}
    </div>
  )
}
