import { useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import './RichNotesEditor.css'

function htmlFromValue(value: string): string {
  const v = (value || '').trim()
  if (!v) return '<p></p>'
  if (v.startsWith('<')) return v
  return `<p>${v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
}

interface RichNotesEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function RichNotesEditor({
  value,
  onChange,
  placeholder = 'Optional notes — bold, lists, and more',
  className = '',
  minHeight = '6rem',
}: RichNotesEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: htmlFromValue(value),
    editorProps: {
      attributes: {
        class: 'rich-notes-editor-prose',
        style: `min-height: ${minHeight}`,
      },
    },
  }, [])

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const next = htmlFromValue(value)
    if (next !== current) editor.commands.setContent(next, { emitUpdate: false })
  }, [editor, value])

  const onUpdate = useCallback(() => {
    if (editor) onChange(editor.getHTML())
  }, [editor, onChange])

  useEffect(() => {
    if (!editor) return
    editor.on('update', onUpdate)
    return () => { editor.off('update', onUpdate) }
  }, [editor, onUpdate])

  const setLink = useCallback(() => {
    if (!editor) return
    const previous = editor.getAttributes('link').href
    const url = window.prompt('URL', previous || 'https://')
    if (url != null) {
      if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run()
      else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className={`rich-notes-editor ${className}`}>
      <div
        className="rich-notes-toolbar"
        onMouseDown={(e) => e.preventDefault()}
        role="toolbar"
        aria-label="Text formatting"
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
          title="Bold"
          data-tooltip="Bold"
        >
          <b>B</b>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
          title="Italic"
          data-tooltip="Italic"
        >
          <i>I</i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'active' : ''}
          title="Underline"
          data-tooltip="Underline"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'active' : ''}
          title="Strikethrough"
          data-tooltip="Strikethrough"
        >
          <s>S</s>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'active' : ''}
          title="Inline code"
          data-tooltip="Inline code"
        >
          {'</>'}
        </button>
        <button
          type="button"
          onClick={setLink}
          className={editor.isActive('link') ? 'active' : ''}
          title="Link"
          data-tooltip="Insert link"
        >
          🔗
        </button>
        <span className="rich-notes-toolbar-sep" aria-hidden />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'active' : ''}
          title="Bullet list"
          data-tooltip="Bullet list"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'active' : ''}
          title="Numbered list"
          data-tooltip="Numbered list"
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'active' : ''}
          title="Quote"
          data-tooltip="Block quote"
        >
          “
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'active' : ''}
          title="Code block"
          data-tooltip="Code block"
        >
          {'{ }'}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal line"
          data-tooltip="Horizontal line"
        >
          —
        </button>
        <span className="rich-notes-toolbar-sep" aria-hidden />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
          data-tooltip="Undo"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
          data-tooltip="Redo"
        >
          ↷
        </button>
      </div>
      <div
        className="rich-notes-editor-content"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
