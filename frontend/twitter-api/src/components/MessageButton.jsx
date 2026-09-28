import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { openConversation } from '../services/messages'
import { useTranslation } from '../hooks/useTranslation'

export default function MessageButton({ userId }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [pending, setPending] = useState(false)
  const locked = useRef(false)
  if (String(userId) === localStorage.getItem('userId')) return null
  async function open() {
    if (locked.current) return
    locked.current = true
    setPending(true)
    try {
      const conversation = await openConversation(userId)
      navigate(`/messages?conversation=${conversation.id}`)
    } catch {
      toast.error(t('messages.error'))
    } finally {
      locked.current = false
      setPending(false)
    }
  }
  return <button className="message-profile-btn" type="button" disabled={pending} onClick={open}>
    {pending ? t('common.loading') : t('messages.start')}</button>
}
