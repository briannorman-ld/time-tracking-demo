import { useState, useEffect } from 'react'
import { getEntriesByUserAndDate, getEntriesByUserInRange } from '@/lib/entries'
import { useTimeTotalsInvalidatorVersion } from '@/context/TimeTotalsInvalidatorContext'

/** YYYY-MM-DD in local time (matches date picker and entry list). */
function formatDateLocal(d: Date): string {
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
  return { start: formatDateLocal(start), end: formatDateLocal(end) }
}

export function useTimeTotals(userId: string | undefined) {
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [weekMinutes, setWeekMinutes] = useState(0)
  const invalidatorVersion = useTimeTotalsInvalidatorVersion()

  useEffect(() => {
    if (!userId) {
      setTodayMinutes(0)
      setWeekMinutes(0)
      return
    }
    const today = formatDateLocal(new Date())
    const { start, end } = getWeekRange(new Date())
    Promise.all([
      getEntriesByUserAndDate(userId, today),
      getEntriesByUserInRange(userId, start, end),
    ]).then(([dayEntries, weekEntries]) => {
      setTodayMinutes(dayEntries.reduce((s, e) => s + e.durationMinutes, 0))
      setWeekMinutes(weekEntries.reduce((s, e) => s + e.durationMinutes, 0))
    })
  }, [userId, invalidatorVersion])

  return { todayMinutes, weekMinutes }
}
