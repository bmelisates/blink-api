import { useState, useEffect } from 'react'
import './FollowSuggestions.css'
import api from '../services/api'
import UserLink from '../components/UserLink'
import { useTranslation } from '../hooks/useTranslation'
import FollowButton from '../components/FollowButton'

function FollowSuggestions() {
  const [users, setUsers] = useState([])
  const currentUserId = localStorage.getItem('userId')
  const { t } = useTranslation()

  useEffect(() => {
    const fetchUsers = () => {
      api.get('/users')
        .then(response => {
          // Mevcut kullanıcıyı hariç tut ve ilk 3 kullanıcıyı göster
          const filteredUsers = response.data
            .filter(user => user.id !== parseInt(currentUserId))
            .slice(0, 3)
          setUsers(filteredUsers)
        })
        .catch(error => {
          console.error('Error fetching users:', error)
        })
    }

    fetchUsers()
  }, [currentUserId])

  return (
    <div className="follow-card">
      <h3>{t('search.followSuggestions')}</h3>
      {users.map(user => (
        <div key={user.id} className="follow-item">
          <div className="follow-info">
            <UserLink userId={user.id} username={user.username} className="follow-name">
              {user.username}
            </UserLink>
            <UserLink userId={user.id} username={user.username} className="follow-user">
              @{user.username}
            </UserLink>
          </div>
          <FollowButton userId={user.id} />
        </div>
      ))}
    </div>
  )
}

export default FollowSuggestions
