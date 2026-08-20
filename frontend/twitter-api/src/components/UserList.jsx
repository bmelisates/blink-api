import { Link } from 'react-router-dom'

function UserList({ users, title, className, currentUserId }) {
  if (!users || users.length === 0) return null

  return (
    <div className={className}>
      <div className={`${className}-header`}>{title}:</div>
      {users.map(user => (
        <div key={user.id} className={`${className}-item`}>
          <Link
            to={user.id === currentUserId ? '/profile' : `/user/${user.id}`}
            className={`${className}-user`}
          >
            @{user.username}
          </Link>
        </div>
      ))}
    </div>
  )
}

export default UserList
