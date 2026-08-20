import { useState } from 'react'

function ReplyForm({ placeholder, onSubmit, className, inputClassName, buttonClassName }) {
  const [replyText, setReplyText] = useState('')

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    const text = replyText.trim()
    if (!text) return
    const maybePromise = onSubmit(text)
    // clear input immediately for snappy UX
    setReplyText('')
    // If the parent returns a promise, allow it to resolve (no await here)
    return maybePromise
  }

  return (
    <form className={className} onSubmit={handleSubmit}>
      <textarea
        className={inputClassName}
        placeholder={placeholder}
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
          }
        }}
      />
      <button type="submit" className={buttonClassName} disabled={!replyText.trim()}>
        Yanıtla
      </button>
    </form>
  )
}

export default ReplyForm
