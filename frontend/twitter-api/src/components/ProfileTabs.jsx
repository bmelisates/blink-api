import { useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'

const tabs = ['tweets', 'replies', 'media', 'likes']

export default function ProfileTabs() {
  const [activeTab, setActiveTab] = useState('tweets')
  const { t } = useTranslation()

  return (
    <div className="profile-tabs">
      {tabs.map(tab => (
        <button
          key={tab}
          className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
          onClick={() => setActiveTab(tab)}
        >
          {t(`profile.${tab}Tab`)}
        </button>
      ))}
    </div>
  )
}
