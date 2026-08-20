import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import './Profile.css'
import api from '../services/api'
import { fetchProfileData } from '../services/profile'
import { useTweetCard } from '../hooks/useTweetCard'
import ProfilePageContent from '../components/ProfilePageContent'
import useCloseOnOutsideClick from '../hooks/useCloseOnOutsideClick'
import { useTimelineState } from '../hooks/useTimelineState'
import { useTranslation } from '../hooks/useTranslation'

function UserProfile() {
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const timeline = useTimelineState()
  const { setTweets, setRetweets } = timeline

  const tweetCard = useTweetCard()
  const currentUserId = tweetCard.currentUserId
  const { t } = useTranslation()

  // Close open lists/forms when clicking outside a tweet card
  useCloseOnOutsideClick(() => tweetCard.closeAll && tweetCard.closeAll(), ['.tweet-card', '.user-list', '.reply-form'])

  useEffect(() => {
    // Fetch current user info to get username if not in localStorage
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
      fetchProfileData(userId)
        .then(data => {
          setUser(data.user)
          setTweets(data.tweets)
          setRetweets(data.retweets)
        })
        .catch(error => {
          console.error('Error fetching user profile data:', error)
        })
    }
    fetchUserInfo()
  }, [currentUserId, setRetweets, setTweets, userId])

  const handleFollow = () => {
    // Takip etme/iptal etme mantığı
    setIsFollowing(current => !current)
  }

  const handleReply = async (tweetId, replyContent, isRetweet) => {
    try {
      const reply = await tweetCard.handleReply(tweetId, replyContent, isRetweet)
      if (reply) timeline.changeCommentCount(tweetId, 1)
      return reply
    } catch (error) {
      console.error('Error creating reply (userprofile wrapper):', error)
    }
  }

  const handleDeleteComment = async (commentId, parentTweetId, isRetweet) => {
    try {
      const result = await tweetCard.handleDeleteComment(commentId, parentTweetId, isRetweet)
      if (!result?.isTopLevelComment) return
      timeline.changeCommentCount(parentTweetId, -1)
    } catch (error) {
      console.error('Error deleting comment (userprofile wrapper):', error)
    }
  }

  return (
    <ProfilePageContent
      user={user}
      action={(
        <button
          className={`edit-profile-btn ${isFollowing ? 'following' : ''}`}
          onClick={handleFollow}
        >
          {isFollowing ? t('search.following') : t('search.follow')}
        </button>
      )}
      timeline={timeline}
      currentUserId={currentUserId}
      tweetCard={tweetCard}
      handlers={{
        onLike: timeline.handleLike,
        onEdit: timeline.startEditing,
        onReply: handleReply,
        onDeleteComment: handleDeleteComment
      }}
    />
  )
}

export default UserProfile
