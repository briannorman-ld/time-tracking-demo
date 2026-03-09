import { useState, useRef, useEffect } from 'react'
import './CustomerSelect.css'

export const CREATE_NEW_VALUE = '__create_new__'

interface CustomerSelectProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  onCreateCustomer?: (name: string) => Promise<string>
  placeholder?: string
  className?: string
  id?: string
}

function filterOptions(options: string[], query: string): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return options
  return options.filter((name) => name.toLowerCase().includes(q))
}

export function CustomerSelect({
  value,
  onChange,
  options,
  onCreateCustomer,
  placeholder = 'Select customer',
  className = '',
  id,
}: CustomerSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredOptions = filterOptions(options, searchQuery)

  useEffect(() => {
    if (!open) return
    setSearchQuery('')
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [open])

  const displayLabel =
    value === CREATE_NEW_VALUE ? '+ Create new customer' : value || placeholder

  return (
    <div ref={ref} className={`customer-select ${className}`.trim()}>
      <button
        type="button"
        id={id}
        className="customer-select-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={placeholder}
      >
        <span className={value === CREATE_NEW_VALUE ? 'customer-select-value create-new' : 'customer-select-value'}>
          {displayLabel}
        </span>
        <span className="customer-select-chevron" aria-hidden>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div className="customer-select-dropdown">
          <div className="customer-select-search-wrap">
            <input
              ref={searchInputRef}
              type="text"
              className="customer-select-search"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              aria-label="Search customers"
            />
          </div>
          <ul
            className="customer-select-list"
            role="listbox"
            aria-label={placeholder}
          >
            {onCreateCustomer && (
              <li
                role="option"
                className="customer-select-option create-new-option"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onChange(CREATE_NEW_VALUE)
                  setOpen(false)
                }}
              >
                + Create new customer
              </li>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((name) => (
                <li
                  key={name}
                  role="option"
                  aria-selected={value === name}
                  className={`customer-select-option ${value === name ? 'selected' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onChange(name)
                    setOpen(false)
                  }}
                >
                  {name}
                </li>
              ))
            ) : (
              <li className="customer-select-option customer-select-empty" role="option">
                No customers match
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
