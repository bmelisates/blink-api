import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './SearchUser.css'
import api from '../services/api'
import { useTranslation } from '../hooks/useTranslation'

function SearchUser() {
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userSearchResults, setUserSearchResults] = useState([])
  const searchContainerRef = useRef(null)
  const currentUserId = localStorage.getItem('userId')
  const { t } = useTranslation()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setUserSearchResults([])
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const searchUsers = async () => {
    console.log('Search called with term:', userSearchTerm)
    if (!userSearchTerm.trim()) {
      setUserSearchResults([])
      return
    }

    try {
      console.log('Making API call to:', `/users/search?keyword=${userSearchTerm}`)
      const response = await api.get(
        `/users/search?keyword=${userSearchTerm}`
      )
      console.log('Search response:', response.data)
      console.log('Setting search results:', response.data)
      setUserSearchResults(response.data)
    } catch (error) {
      console.error('Error searching users:', error)
      setUserSearchResults([])
    }
  }

  return (
    <div className="search-bar" ref={searchContainerRef}>
      <input
        type="text"
        placeholder={t('search.searchUser')}
        className="search-input"
        value={userSearchTerm}
        onChange={(e) => setUserSearchTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            searchUsers()
          }
        }}
      />
      {userSearchResults.length > 0 && (
        <div className="search-results">
          {userSearchResults.map((user) => (
            <Link
              key={user.id}
              to={String(user.id) === String(currentUserId) ? '/profile' : `/user/${user.id}`}
              className="search-result-item"
            >
              <div className="search-result-name">{user.username}</div>
              <div className="search-result-username">@{user.username}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchUser
