import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../services/api'
import CommentItem from './CommentItem'
import UserList from './UserList'
import ReplyForm from './ReplyForm'
import { useTranslation } from '../hooks/useTranslation'
import { formatRelativeTime } from '../utils/formatRelativeTime'
import { useCurrentTime } from '../contexts/TimeContext'
import './TweetCard.css'

function TweetCard({ tweet, currentUserId, onLike, onRetweet, onDelete, onEdit, onToggleLikes, onToggleRetweets, openPanels, likesUsers, retweetsUsers, onReply, onToggleReplyForm, onToggleComments, commentsIndex, onDeleteComment, onCommentLike, onCommentRetweet, onCommentReply, onEditComment, onToggleCommentReplies, onToggleCommentLikes, onToggleCommentRetweets, onToggleCommentComments, commentsData, onTweetClick }) {
  // Retweet için farklı state key kullan
  const stateKey = tweet.isRetweet ? `retweet_${tweet.id}` : tweet.id
  const openPanel = openPanels[stateKey]

  const [fetchedParentTweet, setFetchedParentTweet] = useState(null)
  const parentTweet = tweet.parent || fetchedParentTweet
  const currentTime = useCurrentTime()
  const { t, language } = useTranslation()
  const relativeTime = formatRelativeTime(tweet.createdAt, language, currentTime) || tweet.time || (language === 'tr' ? 'şimdi' : 'now')

  useEffect(() => {
    // Normalize provided parent or fetch when only id is available. Keep deps minimal to avoid loops.
    if (tweet.parent) return

    const parentId = tweet.parentTweetId || tweet.parentId || tweet.parent_id || null
    if (parentId) {
      api.get(`/tweets/${parentId}`)
        .then(response => {
          const p = response.data
          setFetchedParentTweet({
            id: p.id,
            userId: p.user?.id || null,
            user: p.user?.username || 'unknown',
            name: p.user?.username || 'Unknown',
            content: p.content
          })
        })
        .catch(err => {
          console.error('Error fetching parent tweet:', err)
        })
    }
  }, [tweet.parent, tweet.parentTweetId, tweet.parentId, tweet.parent_id])

  return (
    <div
      className={`tweet-card ${tweet.isRetweet ? 'retweet-card' : ''}`}
      onClick={() => onTweetClick && onTweetClick(tweet.id)}
      data-tweet-id={tweet.id}
    >
      {tweet.isRetweet && (
        <div className="retweet-header">
          <span className="retweet-icon">🔄</span>
          <span className="retweet-text">{tweet.retweetedBy} {t('tweet.retweeted')}</span>
        </div>
      )}
      <div className="tweet-content">
        {/* Parent tweet preview (for replies) */}
        {parentTweet && (
          <div className="parent-tweet" onClick={(e) => e.stopPropagation()}>
            <div className="parent-small">
              <span className="parent-user">{parentTweet.name} @{parentTweet.user}</span>
              <p className="parent-text">{parentTweet.content}</p>
            </div>
          </div>
        )}

        <div className="tweet-header">
          {tweet.userId ? (
            <Link
              to={String(tweet.userId) === String(currentUserId) ? '/profile' : `/user/${tweet.userId}`}
              className="tweet-name"
            >
              {tweet.name}
            </Link>
          ) : (
            <span className="tweet-name">{tweet.name}</span>
          )}
          {tweet.userId ? (
            <Link
              to={String(tweet.userId) === String(currentUserId) ? '/profile' : `/user/${tweet.userId}`}
              className="tweet-user"
            >
              @{tweet.user}
            </Link>
          ) : (
            <span className="tweet-user">@{tweet.user}</span>
          )}
          <span className="tweet-time">· {relativeTime}</span>
        </div>
        <p className="tweet-text">{tweet.content}</p>
        <div className="tweet-actions">
          <div className="comment-action-group">
            <button className="action-btn comment" onClick={() => onToggleReplyForm(tweet.id, tweet.isRetweet)}>💬 {tweet.comments}</button>
            {tweet.comments > 0 && (
              <button
                className="action-btn show-likes"
                onClick={() => onToggleComments(tweet.id, tweet.isRetweet)}
              >
                {openPanel === 'comments' ? '▲' : '▼'}
              </button>
            )}
          </div>
          <div className="retweet-action-group">
            <button
              className={`action-btn retweet ${tweet.isRetweeted ? 'retweeted' : ''}`}
              onClick={() => onRetweet(tweet.id)}
            >
              🔄 {tweet.retweets}
            </button>
            {tweet.retweets > 0 && (
              <button
                className="action-btn show-likes"
                onClick={() => onToggleRetweets(tweet.id, tweet.isRetweet)}
              >
                {openPanel === 'retweets' ? '▲' : '▼'}
              </button>
            )}
          </div>
          <div className="like-action-group">
            <button
              className={`action-btn like ${tweet.isLiked ? 'liked' : ''}`}
              onClick={() => onLike(tweet.id)}
            >
              💜 <span className="action-count">{tweet.likes}</span>
            </button>
            {tweet.likes > 0 && (
              <button
                className="action-btn show-likes"
                onClick={() => onToggleLikes(tweet.id, tweet.isRetweet)}
              >
                {openPanel === 'likes' ? '▲' : '▼'}
              </button>
            )}
          </div>
          {tweet.userId && currentUserId && Number(tweet.userId) === Number(currentUserId) && !tweet.isRetweet && (
            <>
              <button className="action-btn update" onClick={() => onEdit(tweet)}>✏️</button>
              <button className="action-btn delete" onClick={() => onDelete(tweet.id)}>❌</button>
            </>
          )}
        </div>
        {openPanel === 'likes' && likesUsers[stateKey] && (
          <UserList users={likesUsers[stateKey]} title="Beğenenler" className="likes-list" currentUserId={currentUserId} />
        )}
        {openPanel === 'retweets' && retweetsUsers[stateKey] && (
          <UserList users={retweetsUsers[stateKey]} title="Blinkleyenler" className="retweets-list" currentUserId={currentUserId} />
        )}
        {openPanel === 'reply' && (
          <ReplyForm
            placeholder="Yanıt yaz..."
            onSubmit={(text) => onReply(tweet.id, text, tweet.isRetweet)}
            className="reply-form"
            inputClassName="reply-input"
            buttonClassName="reply-btn"
          />
        )}
        {openPanel === 'comments' && commentsIndex[stateKey] && commentsIndex[stateKey].length > 0 && (
          <div className="comments-list">
            <div className="comments-header">Yanıtlar:</div>
            {commentsIndex[stateKey].map(commentId => {
              const comment = commentsData[commentId] || { id: commentId, content: '' }
              return (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  onLike={onCommentLike}
                  onRetweet={onCommentRetweet}
                  onReply={(commentIdInner, replyText) => onCommentReply(commentIdInner, replyText, tweet.id, tweet.isRetweet)}
                  onEdit={onEditComment}
                  onDelete={(commentIdInner) => onDeleteComment(commentIdInner, tweet.id, tweet.isRetweet)}
                  onToggleReplies={onToggleCommentReplies}
                  onToggleLikes={onToggleCommentLikes}
                  onToggleRetweets={onToggleCommentRetweets}
                  onToggleComments={onToggleCommentComments}
                  commentsData={commentsData}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TweetCard
