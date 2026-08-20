import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import './Profile.css'
import api from '../services/api'
import SearchUser from './SearchUser'
import FollowSuggestions from './FollowSuggestions'
import Sidebar from './Sidebar'
import TweetCard from '../components/TweetCard'
import { useTweetCard } from '../hooks/useTweetCard'
import { formatTweet, formatRetweet } from '../utils/formatTweet'
import EditTweetModal from '../components/EditTweetModal'
import TweetList from '../components/TweetList'
import useCloseOnOutsideClick from '../hooks/useCloseOnOutsideClick'
import { useTranslation } from '../hooks/useTranslation'

function UserProfile() {
  const { userId } = useParams()
  const [activeTab, setActiveTab] = useState('tweets')
  const [user, setUser] = useState(null)
  const [tweets, setTweets] = useState([])
  const [retweets, setRetweets] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [editingTweet, setEditingTweet] = useState(null)
  const [editContent, setEditContent] = useState('')

  const tweetCard = useTweetCard()
  const currentUserId = tweetCard.currentUserId
  const { t } = useTranslation()

  // Close open lists/forms when clicking outside a tweet card
  useCloseOnOutsideClick(() => tweetCard.closeAll && tweetCard.closeAll(), ['.tweet-card', '.user-list', '.reply-form'])

  useEffect(() => {
    const fetchUserProfile = () => {
      api.get(`/users/${userId}`)
        .then(response => {
          setUser(response.data)
        })
        .catch(error => {
          console.error('Error fetching user profile:', error)
        })
    }

    const fetchUserTweets = () => {
      api.get(`/tweets/user/${userId}`)
        .then(response => {
          const formattedTweets = response.data.map(formatTweet)
          setTweets(formattedTweets)
        })
        .catch(error => {
          console.error('Error fetching user tweets:', error)
        })
    }

    const fetchUserRetweets = () => {
      api.get(`/retweets/user/${userId}`)
        .then(async response => {
          const formattedRetweets = await Promise.all(response.data.map(async retweet => {
            // Fetch the current retweet count for the original tweet
            let currentRetweetCount = retweet.tweet?.retweetCount || 0
            try {
              const countResponse = await api.get(`/retweets/tweet/${retweet.tweet?.id}/count`)
              currentRetweetCount = countResponse.data
            } catch (error) {
              console.error('Error fetching retweet count:', error)
            }

            // Fetch the current like count for the original tweet
            let currentLikeCount = retweet.tweet?.likeCount || 0
            try {
              const likeCountResponse = await api.get(`/likes/tweet/${retweet.tweet?.id}/count`)
              currentLikeCount = likeCountResponse.data
            } catch (error) {
              console.error('Error fetching like count:', error)
            }

            const baseRetweet = formatRetweet(retweet)
            return {
              ...baseRetweet,
              likes: currentLikeCount,
              retweets: currentRetweetCount
            }
          }))
          setRetweets(formattedRetweets)
        })
        .catch(error => {
          console.error('Error fetching user retweets:', error)
        })
    }

    // Fetch current user info to get username if not in localStorage
    const currentUserId = localStorage.getItem('userId')
    const fetchUserInfo = () => {
      if (currentUserId && !localStorage.getItem('username')) {
        api.get(`/users/${currentUserId}`)
          .then(response => {
            localStorage.setItem('username', response.data.username)
          })
          .catch(error => {
            console.error('Error fetching user info:', error)
          })
      }
    }

    if (userId) {
      fetchUserProfile()
      fetchUserTweets()
      fetchUserRetweets()
    }
    fetchUserInfo()
  }, [userId])

  const handleFollow = () => {
    // Takip etme/iptal etme mantığı
    setIsFollowing(!isFollowing)
  }

  const handleEdit = (tweet) => {
    setEditingTweet(tweet)
    setEditContent(tweet.content)
  }

  const handleUpdate = async () => {
    try {
      await api.put(`/tweets/${editingTweet.id}`, { content: editContent })
      setTweets(tweets.map(t =>
        t.id === editingTweet.id ? { ...t, content: editContent } : t
      ))
      setRetweets(retweets.map(r =>
        r.id === editingTweet.id ? { ...r, content: editContent } : r
      ))
      setEditingTweet(null)
      setEditContent('')
    } catch (error) {
      console.error('Error updating tweet:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingTweet(null)
    setEditContent('')
  }

  const handleLike = async (tweetId) => {
    const tweet = [...tweets, ...retweets].find(item => item.id === tweetId)
    if (!tweet) return

    const wasLiked = tweet.isLiked
    const updateLike = item => item.id === tweetId
      ? { ...item, isLiked: !wasLiked, likes: Math.max(0, (item.likes || 0) + (wasLiked ? -1 : 1)) }
      : item

    setTweets(prev => prev.map(updateLike))
    setRetweets(prev => prev.map(updateLike))

    try {
      if (wasLiked) {
        await api.delete(`/likes/tweet/${tweetId}`)
      } else {
        await api.post('/likes', { tweetId })
      }
    } catch (error) {
      setTweets(prev => prev.map(item => item.id === tweetId ? tweet : item))
      setRetweets(prev => prev.map(item => item.id === tweetId ? tweet : item))
      console.error('Error handling like (user profile):', error)
    }
  }

  const handleReply = async (tweetId, replyContent, isRetweet) => {
    try {
      const reply = await tweetCard.handleReply(tweetId, replyContent, isRetweet)
      setTweets(prev => prev.map(t => t.id === tweetId ? { ...t, comments: (t.comments || 0) + 1 } : t))
      setRetweets(prev => prev.map(r => r.id === tweetId ? { ...r, comments: (r.comments || 0) + 1 } : r))
      return reply
    } catch (error) {
      console.error('Error creating reply (userprofile wrapper):', error)
    }
  }

  const handleDeleteComment = async (commentId, parentTweetId, isRetweet) => {
    try {
      const result = await tweetCard.handleDeleteComment(commentId, parentTweetId, isRetweet)
      if (!result?.isTopLevelComment) return
      setTweets(prev => prev.map(t => t.id === parentTweetId ? { ...t, comments: (t.comments || 1) - 1 } : t))
      setRetweets(prev => prev.map(r => r.id === parentTweetId ? { ...r, comments: (r.comments || 1) - 1 } : r))
    } catch (error) {
      console.error('Error deleting comment (userprofile wrapper):', error)
    }
  }

  return (
    <div className="profile-container">
      <Sidebar />

      {/* Main Content */}
      <main className="profile-main">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="cover-photo"></div>
          <div className="profile-info">
            <button
              className={`edit-profile-btn ${isFollowing ? 'following' : ''}`}
              onClick={handleFollow}
            >
              {isFollowing ? t('search.following') : t('search.follow')}
            </button>
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

        {/* Profile Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'tweets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tweets')}
          >
            {t('profile.tweetsTab')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'replies' ? 'active' : ''}`}
            onClick={() => setActiveTab('replies')}
          >
            {t('profile.repliesTab')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            {t('profile.mediaTab')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'likes' ? 'active' : ''}`}
            onClick={() => setActiveTab('likes')}
          >
            {t('profile.likesTab')}
          </button>
        </div>

        <EditTweetModal
          editingTweet={editingTweet}
          editContent={editContent}
          setEditContent={setEditContent}
          onCancel={handleCancelEdit}
          onSave={handleUpdate}
        />

        {/* Tweets */}
        <div className="profile-tweets">
          {[...retweets, ...tweets]
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .map(tweet => (
            <TweetCard
              key={`${tweet.isRetweet ? 'retweet' : 'tweet'}-${tweet.id}`}
              tweet={tweet}
              currentUserId={currentUserId}
              onLike={handleLike}
              onRetweet={tweetCard.handleRetweet}
              onEdit={handleEdit}
              onToggleLikes={tweetCard.handleToggleLikes}
              onToggleRetweets={tweetCard.handleToggleRetweets}
              expandedLikes={tweetCard.expandedLikes}
              expandedRetweets={tweetCard.expandedRetweets}
              likesUsers={tweetCard.likesUsers}
              retweetsUsers={tweetCard.retweetsUsers}
              onReply={handleReply}
              showReplyForm={tweetCard.showReplyForm}
              onToggleReplyForm={tweetCard.handleToggleReplyForm}
              onToggleComments={tweetCard.handleToggleComments}
              expandedComments={tweetCard.expandedComments}
              commentsIndex={tweetCard.commentsIndex}
              onDeleteComment={handleDeleteComment}
              onCommentLike={tweetCard.handleCommentLike}
              onCommentRetweet={tweetCard.handleCommentRetweet}
              onCommentReply={tweetCard.handleCommentReply}
              onEditComment={tweetCard.handleEditComment}
              onToggleCommentReplies={tweetCard.handleToggleCommentReplies}
              onToggleCommentLikes={tweetCard.handleToggleCommentLikes}
              onToggleCommentRetweets={tweetCard.handleToggleCommentRetweets}
              onToggleCommentComments={tweetCard.handleToggleCommentComments}
              commentsData={tweetCard.commentsData}
            />
          ))}
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="right-sidebar">
          <SearchUser />
        <FollowSuggestions />
      </aside>
    </div>
  )
}

export default UserProfile
