import { useCallback, useEffect, useMemo, useState } from 'react'
import { TWEET_DELETED, removeDeletedTweet, TWEET_INTERACTIONS_UPDATED, notifyTweetInteractions, updateTweetInteractions } from '../services/tweetEvents'
import api from '../services/api'

export function useTimelineState() {
  const [tweets, setTweets] = useState([])
  const [retweets, setRetweets] = useState([])
  const [editingTweet, setEditingTweet] = useState(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    const deleted = event => {
      setTweets(items => removeDeletedTweet(items, event.detail.id))
      setRetweets(items => removeDeletedTweet(items, event.detail.id))
    }
    window.addEventListener(TWEET_DELETED, deleted)
    const updated = event => {
      setTweets(items => updateTweetInteractions(items, event.detail))
      setRetweets(items => updateTweetInteractions(items, event.detail))
    }
    window.addEventListener(TWEET_INTERACTIONS_UPDATED, updated)
    return () => {
      window.removeEventListener(TWEET_DELETED, deleted)
      window.removeEventListener(TWEET_INTERACTIONS_UPDATED, updated)
    }
  }, [])

  const timelineItems = useMemo(
    () => [...retweets, ...tweets].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [retweets, tweets]
  )

  const updateItem = useCallback((tweetId, updater) => {
    const updateMatchingItem = item => item.id === tweetId ? updater(item) : item
    setTweets(current => current.map(updateMatchingItem))
    setRetweets(current => current.map(updateMatchingItem))
  }, [])

  const removeItem = useCallback((tweetId) => {
    setTweets(current => current.filter(item => item.id !== tweetId))
    setRetweets(current => current.filter(item => item.id !== tweetId))
  }, [])

  const changeCommentCount = useCallback((tweetId, amount) => {
    updateItem(tweetId, item => ({
      ...item,
      comments: Math.max(0, (item.comments || 0) + amount)
    }))
  }, [updateItem])

  const handleLike = async (tweetId) => {
    const tweet = tweets.find(item => item.id === tweetId) || retweets.find(item => item.id === tweetId)
    if (!tweet) return

    const wasLiked = tweet.isLiked
    updateItem(tweetId, item => ({
      ...item,
      isLiked: !wasLiked,
      likes: Math.max(0, (item.likes || 0) + (wasLiked ? -1 : 1))
    }))

    try {
      if (wasLiked) {
        await api.delete(`/likes/tweet/${tweetId}`)
      } else {
        await api.post('/likes', { tweetId })
      }
      const { data } = await api.get(`/tweets/${tweetId}`)
      notifyTweetInteractions(tweetId, { likes: data.likeCount, isLiked: data.likedByCurrentUser })
    } catch (error) {
      updateItem(tweetId, item => ({
        ...item,
        isLiked: wasLiked,
        likes: Math.max(0, (item.likes || 0) + (wasLiked ? 1 : -1))
      }))
      console.error('Error handling timeline like:', error)
    }
  }

  const startEditing = useCallback((tweet) => {
    setEditingTweet(tweet)
    setEditContent(tweet.content)
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingTweet(null)
    setEditContent('')
  }, [])

  const saveEditing = async () => {
    if (!editingTweet || !editContent.trim()) return

    try {
      await api.put(`/tweets/${editingTweet.id}`, { content: editContent })
      updateItem(editingTweet.id, item => ({ ...item, content: editContent }))
      cancelEditing()
    } catch (error) {
      console.error('Error updating tweet:', error)
    }
  }

  return {
    tweets,
    setTweets,
    retweets,
    setRetweets,
    timelineItems,
    updateItem,
    removeItem,
    changeCommentCount,
    handleLike,
    editingTweet,
    editContent,
    setEditContent,
    startEditing,
    cancelEditing,
    saveEditing
  }
}
