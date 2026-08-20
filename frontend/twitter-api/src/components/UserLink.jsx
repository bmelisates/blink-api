import { Link } from 'react-router-dom'

function UserLink({ userId, username, className, children }) {
  const currentUserId = localStorage.getItem('userId')
  const to = String(userId) === String(currentUserId) ? '/profile' : `/user/${userId}`

  if (!userId) {
    return <span className={className}>{children || username}</span>
  }

  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  )
}

export default UserLink
