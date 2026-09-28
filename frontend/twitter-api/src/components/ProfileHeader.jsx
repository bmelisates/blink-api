import { useTranslation } from '../hooks/useTranslation'
import { useState } from 'react'
import { useFollow } from '../hooks/useFollow'
import { FOLLOW_CHANGED } from '../services/follow'
import FollowList from './FollowList'
import './Follow.css'

export default function ProfileHeader({ user, action }) {
  const { t } = useTranslation()
  const { stats, loading, error } = useFollow(user?.id)
  const [list, setList] = useState(null)

  return (
    <div className="profile-header">
      <div className="cover-photo"></div>
      <div className="profile-info">
        {action}
        <div className="user-details">
          <h1 className="user-name">{user?.username || 'Loading...'}</h1>
          <p className="user-username">@{user?.username || ''}</p>
          <p className="user-bio">{user?.bio || ''}</p>
          <div className="user-meta">
            {user?.location && <span className="meta-item">📍 {user.location}</span>}
            {user?.website && <span className="meta-item">🔗 {user.website}</span>}
            {user?.joinedDate && <span className="meta-item">📅 {user.joinedDate}</span>}
          </div>
          <div className="user-stats">
            <button type="button" className="stat-item" disabled={!stats || loading}
              aria-expanded={list === 'following'} onClick={() => setList(list === 'following' ? null : 'following')}>
              <strong>{stats?.followingCount ?? '—'}</strong> {t('profile.followingLabel')}</button>
            <button type="button" className="stat-item" disabled={!stats || loading}
              aria-expanded={list === 'followers'} onClick={() => setList(list === 'followers' ? null : 'followers')}>
              <strong>{stats?.followerCount ?? '—'}</strong> {t('profile.followersLabel')}</button>
          </div>
          {error && <p role="alert">{t('follow.loadError')} <button type="button"
            onClick={() => window.dispatchEvent(new Event(FOLLOW_CHANGED))}>{t('follow.retry')}</button></p>}
          {list && user?.id && <FollowList key={`${user.id}-${list}`} userId={user.id} type={list} onClose={() => setList(null)} />}
        </div>
      </div>
    </div>
  )
}
