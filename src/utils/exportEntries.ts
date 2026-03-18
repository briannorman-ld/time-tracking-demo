/**
 * Export time entries for the selected date range as CSV or PDF.
 */
import type { TimeEntry } from '@/types/entry'
import { formatDisplayDate, parseLocalDate } from '@/utils/dateFormat'
import { minutesToDecimal } from '@/utils/duration'

/** Short date for PDF table so the column doesn't need to be huge. */
function formatPdfDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function stripHtml(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

/**
 * Build CSV content for the given entries. Uses current date range for the filename.
 */
export function buildEntriesCsv(
  entries: TimeEntry[],
  startDate: string,
  endDate: string
): string {
  const header = ['Date', 'Customer', 'Duration (hours)', 'Duration (min)', 'Notes', 'Billable']
  const rows = entries.map((e) => [
    formatDisplayDate(e.date),
    e.customer,
    String(minutesToDecimal(e.durationMinutes)),
    String(e.durationMinutes),
    stripHtml(e.notes ?? ''),
    e.billable !== false ? 'Yes' : 'No',
  ])
  const lines = [header.map(escapeCsvCell).join(','), ...rows.map((r) => r.map(escapeCsvCell).join(','))]
  return lines.join('\r\n')
}

/**
 * Trigger download of entries as CSV.
 */
export function downloadEntriesCsv(
  entries: TimeEntry[],
  startDate: string,
  endDate: string
): void {
  const csv = buildEntriesCsv(entries, startDate, endDate)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `time-entries-${startDate}-to-${endDate}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Trigger download of entries as PDF. Uses jsPDF to build a simple table.
 */
/** Truncate text to fit within maxWidth using doc.getTextWidth; add ellipsis if truncated. */
function truncateToWidth(doc: import('jspdf').jsPDF, text: string, maxWidth: number): string {
  const padding = 4
  const w = maxWidth - padding
  if (doc.getTextWidth(text) <= w) return text
  let s = text
  while (s.length > 0 && doc.getTextWidth(s + '…') > w) s = s.slice(0, -1)
  return s ? s + '…' : '…'
}

export async function downloadEntriesPdf(
  entries: TimeEntry[],
  startDate: string,
  endDate: string
): Promise<void> {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.getPageWidth()
  const margin = 40
  const contentWidth = pageWidth - margin * 2
  const rowHeight = 18
  // Column widths that avoid overlap: Date (short), Customer, Duration, Billable fixed; Notes takes the rest
  const dateW = 72
  const customerW = 95
  const durationW = 42
  const billableW = 32
  const notesW = contentWidth - dateW - customerW - durationW - billableW
  const colWidths = [dateW, customerW, durationW, notesW, billableW]
  let y = margin

  doc.setFontSize(16)
  doc.text('Time entries export', margin, y)
  y += 24
  doc.setFontSize(10)
  doc.text(`Date range: ${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`, margin, y)
  y += 22

  doc.setFontSize(9)
  const headers = ['Date', 'Customer', 'Duration', 'Notes', 'Billable']
  doc.setFont(undefined, 'bold')
  let x = margin
  headers.forEach((h, i) => {
    doc.text(h, x + 2, y - 5)
    x += colWidths[i]
  })
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, y, pageWidth - margin, y)
  y += rowHeight
  doc.setFont(undefined, 'normal')

  const totalMinutes = entries.reduce((s, e) => s + e.durationMinutes, 0)
  const totalHours = (Math.round(totalMinutes * 100) / 100) / 60

  entries.forEach((e) => {
    if (y > 260) {
      doc.addPage()
      y = margin
    }
    const notes = stripHtml(e.notes ?? '')
    const row = [
      formatPdfDate(e.date),
      e.customer,
      `${minutesToDecimal(e.durationMinutes)} hrs`,
      notes,
      e.billable !== false ? 'Yes' : 'No',
    ]
    x = margin
    row.forEach((cell, i) => {
      const cellText = truncateToWidth(doc, cell, colWidths[i])
      doc.text(cellText, x + 2, y - 5)
      x += colWidths[i]
    })
    doc.line(margin, y, pageWidth - margin, y)
    y += rowHeight
  })

  y += 12
  doc.setFontSize(10)
  doc.text(`Total: ${entries.length} entries, ${totalHours.toFixed(2)} hours`, margin, y)

  doc.save(`time-entries-${startDate}-to-${endDate}.pdf`)
}
