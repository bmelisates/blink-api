import { Link } from 'react-router-dom'
import { useState } from 'react'
import UserList from './UserList'
import ReplyForm from './ReplyForm'
import './CommentItem.css'

function CommentItem({ comment, currentUserId, onLike, onRetweet, onReply, onEdit, onDelete, onToggleReplies, onToggleLikes, onToggleRetweets, commentsData, depth = 0 }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isReplying, setIsReplying] = useState(false)
  const [showNestedReplies, setShowNestedReplies] = useState(false)
  // Get nested replies from commentsData
  const nestedReplies = comment.replies?.map(replyId => commentsData[replyId]).filter(Boolean) || []

  return (
    <div className="comment-item" style={{ marginLeft: depth > 0 ? '20px' : '0' }}>
      <div className="comment-header">
        {comment.userId ? (
          <Link
            to={String(comment.userId) === String(currentUserId) ? '/profile' : `/user/${comment.userId}`}
            className="comment-user"
          >
            @{comment.username}
          </Link>
        ) : (
          <div className="comment-user">@{comment.username}</div>
        )}
      </div>
      {isEditing ? (
        <div className="comment-edit-form">
          <textarea value={editContent} onChange={event => setEditContent(event.target.value)} />
          <button onClick={async () => {
            if (!editContent.trim()) return
            await onEdit(comment.id, editContent)
            setIsEditing(false)
          }}>Kaydet</button>
          <button onClick={() => { setEditContent(comment.content); setIsEditing(false) }}>İptal</button>
        </div>
      ) : <div className="comment-text">{comment.content}</div>}
      <div className="comment-actions">
        <div className="comment-action-group">
          <button 
            className="comment-action-btn reply"
            onClick={() => {
              setIsReplying(current => !current)
              setShowNestedReplies(true)
              onToggleReplies(comment.id)
            }}
          >
            💬 {comment.comments || 0}
          </button>
          {comment.comments > 0 && (
            <button
              className="comment-action-btn show-list"
              onClick={() => {
                setShowNestedReplies(current => {
                  const next = !current
                  if (next) onToggleReplies(comment.id)
                  return next
                })
              }}
            >
              {showNestedReplies ? '▲' : '▼'}
            </button>
          )}
        </div>
        <div className="comment-action-group">
          <button 
            className={`comment-action-btn retweet ${comment.isRetweeted ? 'retweeted' : ''}`}
            onClick={() => onRetweet(comment.id)}
          >
            🔄 {comment.retweets || 0}
          </button>
          {comment.retweets > 0 && (
            <button
              className="comment-action-btn show-list"
              onClick={() => onToggleRetweets(comment.id)}
            >
              {comment.showRetweets ? '▲' : '▼'}
            </button>
          )}
        </div>
        <div className="comment-action-group">
          <button 
            className={`comment-action-btn like ${comment.isLiked ? 'liked' : ''}`}
            onClick={() => onLike(comment.id)}
          >
            💜 {comment.likes || 0}
          </button>
          {comment.likes > 0 && (
            <button
              className="comment-action-btn show-list"
              onClick={() => onToggleLikes(comment.id)}
            >
              {comment.showLikes ? '▲' : '▼'}
            </button>
          )}
        </div>
        {comment.userId && currentUserId && Number(comment.userId) === Number(currentUserId) && !isEditing && (
          <div className="comment-owner-actions">
            <button className="comment-action-btn" onClick={() => setIsEditing(true)} aria-label="Yanıtı düzenle">✏️</button>
            <button className="comment-action-btn" onClick={() => onDelete(comment.id)} aria-label="Yanıtı sil">❌</button>
          </div>
        )}
      </div>
      
      {/* Likes List */}
      {comment.showLikes && comment.likesUsers && comment.likesUsers.length > 0 && (
        <UserList users={comment.likesUsers} title="Beğenenler" className="comment-list" currentUserId={currentUserId} />
      )}

      {/* Retweets List */}
      {comment.showRetweets && comment.retweetsUsers && comment.retweetsUsers.length > 0 && (
        <UserList users={comment.retweetsUsers} title="Blinkleyenler" className="comment-list" currentUserId={currentUserId} />
      )}
      
      {/* Reply Form */}
      {isReplying && (
        <ReplyForm
          placeholder="Yanıt yaz..."
          onSubmit={async (text) => {
            await onReply(comment.id, text)
            setIsReplying(false)
            setShowNestedReplies(true)
          }}
          className="comment-reply-form"
          inputClassName="comment-reply-input"
          buttonClassName="comment-reply-btn"
        />
      )}
      
      {/* Nested Replies */}
      {showNestedReplies && nestedReplies.length > 0 && (
        <div className="nested-replies">
          {nestedReplies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onLike={onLike}
              onRetweet={onRetweet}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleReplies={onToggleReplies}
              onToggleLikes={onToggleLikes}
              onToggleRetweets={onToggleRetweets}
              commentsData={commentsData}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CommentItem
