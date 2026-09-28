import { toast } from 'react-toastify'
import { useFollow } from '../hooks/useFollow'
import { useTranslation } from '../hooks/useTranslation'
import { changeFollow, FOLLOW_CHANGED } from '../services/follow'
import './Follow.css'

export default function FollowButton({ userId, className = 'follow-btn' }) {
  const { stats, loading, pending, error } = useFollow(userId)
  const { t } = useTranslation()
  if (!userId || String(userId) === localStorage.getItem('userId')) return null
  const following = stats?.followedByCurrentUser === true

  async function handleClick() {
    if (error) {
      window.dispatchEvent(new Event(FOLLOW_CHANGED))
      return
    }
    try {
      await changeFollow(userId, following)
    } catch {
      toast.error(t('follow.actionError'))
    }
  }

  return (
    <button type="button" className={`${className} ${following ? 'following' : ''}`}
      disabled={loading || pending} aria-pressed={following} aria-busy={loading || pending}
      title={error ? t('follow.loadError') : following ? t('search.unfollow') : t('search.follow')}
      onClick={handleClick}>
      {loading || pending ? t('common.loading') : error ? t('follow.retry')
        : following ? t('search.unfollow') : t('search.follow')}
    </button>
  )
}
