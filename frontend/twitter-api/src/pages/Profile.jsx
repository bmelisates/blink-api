import { useState, useEffect } from 'react'
import './Profile.css'
import api from '../services/api'
import { fetchProfileData } from '../services/profile'
import { useTweetCard } from '../hooks/useTweetCard'
import ProfilePageContent from '../components/ProfilePageContent'
import useCloseOnOutsideClick from '../hooks/useCloseOnOutsideClick'
import { useTimelineState } from '../hooks/useTimelineState'
import { formatRetweet } from '../utils/formatTweet'
import { useTranslation } from '../hooks/useTranslation'
import { deleteTweet } from '../services/deleteTweet'

function Profile() {
  const [user, setUser] = useState(null)
  const timeline = useTimelineState()
  const { setTweets, setRetweets } = timeline

  const tweetCard = useTweetCard()
  const currentUserId = tweetCard.currentUserId
  const { t } = useTranslation()

  // Close open lists/forms when clicking outside a tweet card
  useCloseOnOutsideClick(() => tweetCard.closeAll && tweetCard.closeAll(), ['.tweet-card', '.user-list', '.reply-form'])

  useEffect(() => {
    if (!currentUserId) return

    fetchProfileData(currentUserId)
      .then(data => {
        setUser(data.user)
        setTweets(data.tweets)
        setRetweets(data.retweets)
      })
      .catch(error => {
        console.error('Error fetching profile data:', error)
      })
  }, [currentUserId, setRetweets, setTweets])

  const handleDelete = async (tweetId) => {
    try {
      await deleteTweet(tweetId)
      timeline.removeItem(tweetId)
    } catch (error) {
      console.error('Error deleting tweet:', error)
    }
  }

  const handleRetweet = async (tweetId) => {
    const result = await tweetCard.handleRetweet(tweetId)
    if (!result || result.action === 'failed') return

    timeline.updateItem(tweetId, item => ({
      ...item,
      isRetweeted: result.action === 'created',
      retweets: Math.max(0, (item.retweets || 0) + (result.action === 'created' ? 1 : -1))
    }))

    try {
      const response = await api.get(`/retweets/user/${currentUserId}`)
      const formattedRetweets = response.data.map(formatRetweet)
      setRetweets(formattedRetweets)
    } catch (error) {
      console.error('Error refreshing profile retweets:', error)
    }
  }

  const handleReply = async (tweetId, replyContent, isRetweet) => {
    try {
      const reply = await tweetCard.handleReply(tweetId, replyContent, isRetweet)
      if (reply) timeline.changeCommentCount(tweetId, 1)
      return reply
    } catch (error) {
      console.error('Error creating reply (profile wrapper):', error)
    }
  }

  const handleDeleteComment = async (commentId, parentTweetId, isRetweet) => {
    try {
      const result = await tweetCard.handleDeleteComment(commentId, parentTweetId, isRetweet)
      if (!result?.isTopLevelComment) return
      timeline.changeCommentCount(parentTweetId, -1)
    } catch (error) {
      console.error('Error deleting comment (profile wrapper):', error)
    }
  }

  return (
    <ProfilePageContent
      user={user}
      action={<button className="edit-profile-btn">{t('profile.editProfile')}</button>}
      timeline={timeline}
      currentUserId={currentUserId}
      tweetCard={tweetCard}
      handlers={{
        onLike: timeline.handleLike,
        onRetweet: handleRetweet,
        onDelete: handleDelete,
        onEdit: timeline.startEditing,
        onReply: handleReply,
        onDeleteComment: handleDeleteComment
      }}
    />
  )
}

export default Profile
