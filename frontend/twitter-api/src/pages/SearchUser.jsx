import { Link } from 'react-router-dom'
import './SearchUser.css'
import { useTranslation } from '../hooks/useTranslation'
import useClickOutside from '../hooks/useClickOutside'
import useSearch from '../hooks/useSearch'

function SearchUser() {
  const userSearch = useSearch('/users/search')
  const searchContainerRef = useClickOutside(userSearch.clearResults)
  const currentUserId = localStorage.getItem('userId')
  const { t } = useTranslation()

  return (
    <div className="search-bar" ref={searchContainerRef}>
      <input
        type="text"
        placeholder={t('search.searchUser')}
        className="search-input"
        value={userSearch.term}
        onChange={(e) => userSearch.setTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            userSearch.search()
          }
        }}
      />
      {userSearch.results.length > 0 && (
        <div className="search-results">
          {userSearch.results.map((user) => (
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
