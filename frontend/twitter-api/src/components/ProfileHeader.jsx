import { useTranslation } from '../hooks/useTranslation'

export default function ProfileHeader({ user, action }) {
  const { t } = useTranslation()

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
            <span className="stat-item"><strong>{user?.following || 0}</strong> {t('profile.followingLabel')}</span>
            <span className="stat-item"><strong>{user?.followers || 0}</strong> {t('profile.followersLabel')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
