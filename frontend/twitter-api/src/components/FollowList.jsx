import { useEffect, useState } from 'react'
import { fetchFollowList, FOLLOW_CHANGED } from '../services/follow'
import { useTranslation } from '../hooks/useTranslation'
import UserLink from './UserLink'
import FollowButton from './FollowButton'

export default function FollowList({ userId, type, onClose }) {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ loading: true })
  useEffect(() => {
    let controller
    function refresh(event) {
      if (event?.detail?.pending) return
      controller?.abort()
      controller = new AbortController()
      const { signal } = controller
      setState({ loading: true })
      fetchFollowList(userId, type, page, signal).then(data => {
        if (signal.aborted) return
        if (page > 0 && page >= data.totalPages) {
          setPage(Math.max(0, data.totalPages - 1))
          return
        }
        setState({ data })
      }).catch(() => {
        if (!signal.aborted) setState({ error: true })
      })
    }
    // Bir işlem başladığında listeyi kaldırma; bitince sayaçlarla birlikte yenile.
    refresh()
    window.addEventListener(FOLLOW_CHANGED, refresh)
    return () => {
      controller?.abort()
      window.removeEventListener(FOLLOW_CHANGED, refresh)
    }
  }, [userId, type, page, attempt])

  return (
    <section className="follow-list" aria-label={t(`profile.${type}`)}>
      <div className="follow-list-heading">
        <h2>{t(`profile.${type}`)}</h2>
        <button type="button" onClick={onClose}>{t('follow.close')}</button>
      </div>
      {state.loading && <p role="status">{t('common.loading')}</p>}
      {state.error && <p role="alert">{t('follow.loadError')} <button type="button"
        onClick={() => setAttempt(value => value + 1)}>{t('follow.retry')}</button></p>}
      {state.data?.content.length === 0 && <p>{t('follow.empty')}</p>}
      {state.data?.content.map(user => (
        <div className="follow-list-row" key={user.id}>
          <UserLink userId={user.id} username={user.username}>@{user.username}</UserLink>
          <FollowButton userId={user.id} />
        </div>
      ))}
      {state.data && state.data.totalPages > 1 && <div className="follow-list-pagination">
        <button type="button" disabled={page === 0} onClick={() => setPage(value => value - 1)}>{t('follow.previous')}</button>
        <span>{page + 1} / {state.data.totalPages}</span>
        <button type="button" disabled={state.data.last} onClick={() => setPage(value => value + 1)}>{t('follow.next')}</button>
      </div>}
    </section>
  )
}
