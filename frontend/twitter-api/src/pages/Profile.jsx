import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Profile.css'
import Sidebar from './Sidebar'
import SearchUser from './SearchUser'
import FollowSuggestions from './FollowSuggestions'
import TweetCard from '../components/TweetCard'
import api from '../services/api'
import { useTweetCard } from '../hooks/useTweetCard'
import EditTweetModal from '../components/EditTweetModal'
import TweetList from '../components/TweetList'
import useCloseOnOutsideClick from '../hooks/useCloseOnOutsideClick'
import { formatTweet } from '../utils/formatTweet'
import { useTranslation } from '../hooks/useTranslation'

function Profile() {
  const [activeTab, setActiveTab] = useState('tweets')
  const [user, setUser] = useState(null)
  const [tweets, setTweets] = useState([])
  const [trending, setTrending] = useState([])
  const [editingTweet, setEditingTweet] = useState(null)
  const [editContent, setEditContent] = useState('')

  const tweetCard = useTweetCard()
  const currentUserId = tweetCard.currentUserId
  const { t } = useTranslation()

  // Close open lists/forms when clicking outside a tweet card
  useCloseOnOutsideClick(() => tweetCard.closeAll && tweetCard.closeAll(), ['.tweet-card', '.user-list', '.reply-form'])

  useEffect(() => {
    const fetchUserData = () => {
      if (currentUserId) {
        // Kullanıcı bilgilerini çek
        api.get(`/users/${currentUserId}`)
          .then(response => {
            setUser(response.data)
          })
          .catch(error => {
            console.error('Error fetching user data:', error)
          })

        // Kullanıcının tweetlerini çek
        api.get(`/tweets/user/${currentUserId}`)
          .then(response => {
            const formattedTweets = response.data.map(formatTweet)
            setTweets(formattedTweets)
          })
          .catch(error => {
            console.error('Error fetching user tweets:', error)
          })
      }
    }

    fetchUserData()
  }, [currentUserId])

  const handleDelete = async (tweetId) => {
    try {
      await api.delete(`/tweets/${tweetId}`)
      // Tweets listesinden kaldır
      setTweets(tweets.filter(t => t.id !== tweetId))
    } catch (error) {
      console.error('Error deleting tweet:', error)
    }
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
    const tweet = tweets.find(item => item.id === tweetId)
    if (!tweet) return

    const wasLiked = tweet.isLiked
    const updateLike = item => item.id === tweetId
      ? { ...item, isLiked: !wasLiked, likes: Math.max(0, (item.likes || 0) + (wasLiked ? -1 : 1)) }
      : item

    setTweets(prev => prev.map(updateLike))

    try {
      if (wasLiked) {
        await api.delete(`/likes/tweet/${tweetId}`)
      } else {
        await api.post('/likes', { tweetId })
      }
    } catch (error) {
      setTweets(prev => prev.map(item => item.id === tweetId ? tweet : item))
      console.error('Error handling like (profile):', error)
    }
  }

  const handleReply = async (tweetId, replyContent, isRetweet) => {
    try {
      const reply = await tweetCard.handleReply(tweetId, replyContent, isRetweet)
      setTweets(prev => prev.map(t => t.id === tweetId ? { ...t, comments: (t.comments || 0) + 1 } : t))
      return reply
    } catch (error) {
      console.error('Error creating reply (profile wrapper):', error)
    }
  }

  const handleDeleteComment = async (commentId, parentTweetId, isRetweet) => {
    try {
      const result = await tweetCard.handleDeleteComment(commentId, parentTweetId, isRetweet)
      if (!result?.isTopLevelComment) return
      setTweets(prev => prev.map(t => t.id === parentTweetId ? { ...t, comments: (t.comments || 1) - 1 } : t))
    } catch (error) {
      console.error('Error deleting comment (profile wrapper):', error)
    }
  }

  return (
    <div className="profile-container">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="profile-main">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="cover-photo"></div>
          <div className="profile-info">
            <button className="edit-profile-btn">{t('profile.editProfile')}</button>
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
          {tweets.map(tweet => (
            <TweetCard
              key={tweet.id}
              tweet={tweet}
              currentUserId={currentUserId}
              onLike={handleLike}
              onRetweet={tweetCard.handleRetweet}
              onDelete={handleDelete}
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

export default Profile
