import DOMPurify from 'dompurify'

interface NotesContentProps {
  html: string
  className?: string
}

/**
 * Renders notes as HTML (sanitized). Handles legacy plain text: if the string
 * doesn't look like HTML, it's rendered as text to preserve existing entries.
 */
export function NotesContent({ html, className = '' }: NotesContentProps) {
  const trimmed = (html || '').trim()
  if (!trimmed) return null

  const isHtml = trimmed.includes('<')
  const sanitized = isHtml
    ? DOMPurify.sanitize(trimmed, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'code', 'a',
          'ul', 'ol', 'li', 'blockquote', 'pre', 'hr', 'h1', 'h2', 'h3',
        ],
        ALLOWED_ATTR: ['href'],
      })
    : ''

  if (isHtml && sanitized) {
    return (
      <span
        className={`notes-content ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    )
  }
  return <span className={`notes-content notes-content-plain ${className}`}>{trimmed}</span>
}
