import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Sidebar from './Sidebar'
import UserLink from '../components/UserLink'
import { useTranslation } from '../hooks/useTranslation'
import { getConversation, getMessages, listConversations, markMessagesRead,
  sendMessage, notifyMessagesChanged, MESSAGES_CHANGED } from '../services/messages'
import './Messages.css'

function mergeMessages(previous, incoming) {
  const merged = new Map(previous.map(message => [message.id, message]))
  incoming.forEach(message => merged.set(message.id, message))
  return [...merged.values()].sort((a, b) => a.id - b.id)
}

function Conversation({ id }) {
  const { t, language } = useTranslation()
  const viewer = Number(localStorage.getItem('userId'))
  const [participant, setParticipant] = useState(null)
  const [messages, setMessages] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const [olderLoading, setOlderLoading] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const lock = useRef(false)
  const alive = useRef(true)
  const loadedOlder = useRef(false)
  const list = useRef(null)
  const scrollToBottom = useRef(true)

  useEffect(() => {
    alive.current = true
    let controller
    async function refresh() {
      if (document.hidden) return
      controller?.abort()
      controller = new AbortController()
      const { signal } = controller
      try {
        const [conversation, page] = await Promise.all([getConversation(id, signal), getMessages(id, undefined, signal)])
        if (signal.aborted) return
        setParticipant(conversation.participant)
        setMessages(previous => mergeMessages(previous, page.content))
        if (!loadedOlder.current) setHasMore(page.hasMore)
        setError(false)
        setLoading(false)
        // Yalnızca görünür konuşmada yüklenen mesajlara kadar okundu işaretle.
        const incoming = page.content.filter(message => message.senderId !== viewer && !message.readAt)
        if (incoming.length && !document.hidden) {
          await markMessagesRead(id, Math.max(...incoming.map(message => message.id)), signal)
          if (!signal.aborted) notifyMessagesChanged()
        }
      } catch {
        if (!signal.aborted) { setError(true); setLoading(false) }
      }
    }
    refresh()
    const timer = setInterval(refresh, 5000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      alive.current = false
      controller?.abort()
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [id, viewer, attempt])

  useEffect(() => {
    if (scrollToBottom.current && list.current) list.current.scrollTop = list.current.scrollHeight
  }, [messages])

  async function older() {
    setOlderLoading(true)
    scrollToBottom.current = false
    try {
      const page = await getMessages(id, messages[0]?.id)
      if (!alive.current) return
      loadedOlder.current = true
      setMessages(previous => mergeMessages(previous, page.content))
      setHasMore(page.hasMore)
      setError(false)
    } catch {
      if (alive.current) setError(true)
    } finally {
      if (alive.current) setOlderLoading(false)
    }
  }

  async function send(event) {
    event.preventDefault()
    if (lock.current || !content.trim() || content.length > 2000) return
    lock.current = true
    setSending(true)
    setSendError(false)
    try {
      const message = await sendMessage(id, content.trim())
      notifyMessagesChanged()
      if (!alive.current) return
      scrollToBottom.current = true
      setMessages(previous => mergeMessages(previous, [message]))
      setContent('')
    } catch {
      if (alive.current) setSendError(true)
    } finally {
      lock.current = false
      if (alive.current) setSending(false)
    }
  }

  return <section className="message-thread" aria-label={t('messages.conversation')}>
    <header>{participant && <UserLink userId={participant.id} username={participant.username}>@{participant.username}</UserLink>}</header>
    {loading && <p role="status">{t('common.loading')}</p>}
    {error && <p role="alert">{t('messages.error')} <button onClick={() => setAttempt(value => value + 1)}>{t('follow.retry')}</button></p>}
    <div className="message-history" ref={list} onScroll={() => {
      const element = list.current
      scrollToBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80
    }}>
      {hasMore && <button type="button" onClick={older} disabled={olderLoading}>{t('messages.older')}</button>}
      {!loading && !messages.length && !error && <p>{t('messages.emptyThread')}</p>}
      {messages.map(message => <article key={message.id} className={`message-bubble ${message.senderId === viewer ? 'sent' : 'received'}`}>
        <p>{message.content}</p>
        <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')}</time>
        {message.senderId === viewer && message.readAt && <span> · {t('messages.read')}</span>}
      </article>)}
    </div>
    <form onSubmit={send} className="message-compose">
      <label htmlFor="message-content">{t('messages.write')}</label>
      <textarea id="message-content" value={content} onChange={event => setContent(event.target.value)}
        maxLength={2000} disabled={sending || !participant} rows={3} />
      <div><small>{content.length}/2000</small><button disabled={sending || !participant || !content.trim()}>
        {sending ? t('common.loading') : t('messages.send')}</button></div>
      {sendError && <p role="alert">{t('messages.sendError')}</p>}
    </form>
  </section>
}

export default function Messages() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const selected = params.get('conversation')
  const [page, setPage] = useState(0)
  const [state, setState] = useState({ loading: true })
  const [attempt, setAttempt] = useState(0)
  const select = useCallback(id => setParams({ conversation: String(id) }), [setParams])

  useEffect(() => {
    let controller
    async function refresh() {
      if (document.hidden) return
      controller?.abort()
      controller = new AbortController()
      const { signal } = controller
      try {
        const data = await listConversations(page, signal)
        if (!signal.aborted) setState({ data, page })
      } catch {
        if (!signal.aborted) setState({ error: true, page })
      }
    }
    refresh()
    const timer = setInterval(refresh, 5000)
    window.addEventListener(MESSAGES_CHANGED, refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      controller?.abort()
      clearInterval(timer)
      window.removeEventListener(MESSAGES_CHANGED, refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [page, attempt])

  const data = state.page === page ? state.data : null
  return <div className="messages-layout">
    <Sidebar />
    <main className="messages-main">
      <h1>{t('messages.title')}</h1>
      <div className="messages-columns">
        <section className="conversation-list" aria-label={t('messages.title')}>
          {(state.loading || state.page !== page) && <p role="status">{t('common.loading')}</p>}
          {state.error && <p role="alert">{t('messages.error')} <button onClick={() => setAttempt(value => value + 1)}>{t('follow.retry')}</button></p>}
          {data?.content.length === 0 && <p>{t('messages.emptyInbox')}</p>}
          {data?.content.map(conversation => <button key={conversation.id} type="button"
            className={`conversation-item ${String(conversation.id) === selected ? 'selected' : ''}`}
            aria-pressed={String(conversation.id) === selected} onClick={() => select(conversation.id)}>
            <strong>@{conversation.participant.username}</strong>
            {conversation.unreadCount > 0 && <span className="unread-badge">{conversation.unreadCount} {t('messages.unread')}</span>}
            <span className="message-preview">{conversation.lastMessage?.content || t('messages.emptyThread')}</span>
          </button>)}
          {data && data.totalPages > 1 && <div className="conversation-pagination">
            <button disabled={page === 0} onClick={() => setPage(value => value - 1)}>{t('follow.previous')}</button>
            <span>{page + 1}/{data.totalPages}</span>
            <button disabled={data.last} onClick={() => setPage(value => value + 1)}>{t('follow.next')}</button>
          </div>}
        </section>
        {selected && /^[1-9]\d*$/.test(selected) ? <Conversation key={selected} id={selected} />
          : <p className="message-placeholder">{t('messages.select')}</p>}
      </div>
    </main>
  </div>
}
