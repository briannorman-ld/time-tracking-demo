import { useState, useEffect } from 'react'
import { useSession } from '@/context/SessionContext'
import { getEntriesByUserInRange } from '@/lib/entries'
import { getCustomers } from '@/lib/customers'
import type { TimeEntry } from '@/types/entry'
import type { Customer } from '@/types/customer'
import { formatDuration } from '@/utils/duration'
import { formatDisplayDate, getWeekStart } from '@/utils/dateFormat'
import { NotesContent } from '@/components/NotesContent'
import './ReportsPage.css'

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(d)
  start.setDate(diff)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: formatDate(start), end: formatDate(end) }
}

export function ReportsPage() {
  const { user } = useSession()
  const thisWeek = getWeekRange(new Date())
  const [startDate, setStartDate] = useState(thisWeek.start)
  const [endDate, setEndDate] = useState(thisWeek.end)
  const [customerFilter, setCustomerFilter] = useState<string>('')
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    if (!user) return
    getCustomers(user.id).then(setCustomers)
  }, [user])

  useEffect(() => {
    if (!user) return
    getEntriesByUserInRange(user.id, startDate, endDate).then((list) => {
      if (customerFilter) {
        setEntries(list.filter((e) => e.customer === customerFilter))
      } else {
        setEntries(list)
      }
    })
  }, [user, startDate, endDate, customerFilter])

  const totalMinutes = entries.reduce((s, e) => s + e.durationMinutes, 0)
  const totalBillable = entries.filter((e) => e.billable !== false).reduce((s, e) => s + e.durationMinutes, 0)
  const byCustomer = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.customer] = (acc[e.customer] ?? 0) + e.durationMinutes
    return acc
  }, {})

  /** Entries grouped by date (YYYY-MM-DD). */
  const byDay = entries.reduce<Record<string, TimeEntry[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = []
    acc[e.date].push(e)
    return acc
  }, {})
  const sortedDays = Object.keys(byDay).sort()

  /** Entries grouped by week start, then by date. */
  const byWeek = entries.reduce<Record<string, Record<string, TimeEntry[]>>>((acc, e) => {
    const weekStart = getWeekStart(e.date)
    if (!acc[weekStart]) acc[weekStart] = {}
    if (!acc[weekStart][e.date]) acc[weekStart][e.date] = []
    acc[weekStart][e.date].push(e)
    return acc
  }, {})
  const sortedWeekStarts = Object.keys(byWeek).sort()

  if (!user) return null

  return (
    <div className="reports-page">
      <h1>Reports</h1>
      <div className="reports-filters">
        <label>
          From
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <label>
          Customer
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          >
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="reports-summary">
        <div className="reports-summary-card">
          <span className="reports-summary-label">Total time</span>
          <span className="reports-summary-value">{formatDuration(totalMinutes)}</span>
        </div>
        <div className="reports-summary-card">
          <span className="reports-summary-label">Billable</span>
          <span className="reports-summary-value">{formatDuration(totalBillable)}</span>
        </div>
      </div>
      <section className="reports-by-customer">
        <h2>By customer</h2>
        <ul>
          {Object.entries(byCustomer)
            .sort((a, b) => b[1] - a[1])
            .map(([name, mins]) => (
              <li key={name}>
                <span className="reports-customer-name">{name}</span>
                <span className="reports-customer-hours">{formatDuration(mins)}</span>
              </li>
            ))}
        </ul>
      </section>
      <section className="reports-entries">
        <h2>Entries by day ({entries.length})</h2>
        {sortedDays.length === 0 ? (
          <p className="reports-no-entries">No entries in this range.</p>
        ) : (
          sortedDays.map((date) => {
            const dayEntries = byDay[date]
            const dayMinutes = dayEntries.reduce((s, e) => s + e.durationMinutes, 0)
            return (
            <div key={date} className="reports-day-group">
              <h3 className="reports-day-heading">
                {formatDisplayDate(date)}
                <span className="reports-day-total">{formatDuration(dayMinutes)}</span>
              </h3>
              <ul className="reports-entries-list">
                {dayEntries.map((e) => (
                  <li key={e.id}>
                    <span>{e.customer}</span>
                    {e.project && <span>{e.project}</span>}
                    <span>{formatDuration(e.durationMinutes)}</span>
                    {e.notes && <span className="reports-entry-notes"><NotesContent html={e.notes} /></span>}
                  </li>
                ))}
              </ul>
            </div>
            )
          })
        )}
      </section>
      <section className="reports-entries reports-entries-by-week">
        <h2>Entries by week ({entries.length})</h2>
        {sortedWeekStarts.length === 0 ? (
          <p className="reports-no-entries">No entries in this range.</p>
        ) : (
          sortedWeekStarts.map((weekStart) => {
            const weekDays = byWeek[weekStart]
            const weekMinutes = Object.values(weekDays).flat().reduce((s, e) => s + e.durationMinutes, 0)
            return (
            <div key={weekStart} className="reports-week-group">
              <h3 className="reports-week-heading">
                Week of {formatDisplayDate(weekStart)}
                <span className="reports-week-total">{formatDuration(weekMinutes)}</span>
              </h3>
              {Object.keys(weekDays)
                .sort()
                .map((date) => {
                  const dayEntries = weekDays[date]
                  const dayMinutes = dayEntries.reduce((s, e) => s + e.durationMinutes, 0)
                  return (
                  <div key={date} className="reports-day-in-week">
                    <h4 className="reports-day-subheading">
                      {formatDisplayDate(date)}
                      <span className="reports-day-total">{formatDuration(dayMinutes)}</span>
                    </h4>
                    <ul className="reports-entries-list">
                      {dayEntries.map((e) => (
                        <li key={e.id}>
                          <span>{e.customer}</span>
                          {e.project && <span>{e.project}</span>}
                          <span>{formatDuration(e.durationMinutes)}</span>
                          {e.notes && <span className="reports-entry-notes"><NotesContent html={e.notes} /></span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                  )
                })}
            </div>
            )
          })
        )}
      </section>
    </div>
  )
}
