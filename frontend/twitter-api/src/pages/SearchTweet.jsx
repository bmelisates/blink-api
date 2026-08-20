import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './SearchTweet.css'
import api from '../services/api'
import TweetCard from '../components/TweetCard'
import { useTweetCard } from '../hooks/useTweetCard'
import TweetList from '../components/TweetList'
import useCloseOnOutsideClick from '../hooks/useCloseOnOutsideClick'
import { formatTweet } from '../utils/formatTweet'
import { useTranslation } from '../hooks/useTranslation'

function SearchTweet() {
  const [tweetSearchTerm, setTweetSearchTerm] = useState('')
  const [tweetSearchResults, setTweetSearchResults] = useState([])
  const searchContainerRef = useRef(null)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const tweetCard = useTweetCard()
  const currentUserId = tweetCard.currentUserId

  // Close open lists/forms when clicking outside a tweet card
  useCloseOnOutsideClick(() => tweetCard.closeAll && tweetCard.closeAll(), ['.tweet-card', '.user-list', '.reply-form'])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setTweetSearchResults([])
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const searchTweets = async () => {
    console.log('Tweet search called with term:', tweetSearchTerm)
    if (!tweetSearchTerm.trim()) {
      setTweetSearchResults([])
      return
    }

    try {
      console.log('Making API call to:', `/tweets/search?keyword=${tweetSearchTerm}`)
      const response = await api.get(
        `/tweets/search?keyword=${tweetSearchTerm}`
      )
      console.log('Tweet search response:', response.data)
      console.log('Setting tweet search results:', response.data)
      const formattedTweets = response.data.map(formatTweet)
      setTweetSearchResults(formattedTweets)
    } catch (error) {
      console.error('Error searching tweets:', error)
      setTweetSearchResults([])
    }
  }

  const handleReply = async (tweetId, replyContent, isRetweet) => {
    try {
      const reply = await tweetCard.handleReply(tweetId, replyContent, isRetweet)
      setTweetSearchResults(prev => prev.map(t => t.id === tweetId ? { ...t, comments: (t.comments || 0) + 1 } : t))
      return reply
    } catch (error) {
      console.error('Error creating reply (search wrapper):', error)
    }
  }

  const handleDeleteComment = async (commentId, parentTweetId, isRetweet) => {
    try {
      await tweetCard.handleDeleteComment(commentId, parentTweetId, isRetweet)
      setTweetSearchResults(prev => prev.map(t => t.id === parentTweetId ? { ...t, comments: (t.comments || 1) - 1 } : t))
    } catch (error) {
      console.error('Error deleting comment (search wrapper):', error)
    }
  }

  const handleTweetClick = (tweetId) => {
    setTweetSearchResults([])
    navigate('/home', { state: { scrollToTweet: tweetId } })
  }

  return (
    <div className="tweet-search-container" ref={searchContainerRef}>
      <input
        type="text"
        placeholder={t('home.searchTweet')}
        className="tweet-search-input"
        value={tweetSearchTerm}
        onChange={(e) => setTweetSearchTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            searchTweets()
          }
        }}
      />
      {tweetSearchResults.length > 0 && (
        <div className="tweet-search-results">
          <TweetList
            items={tweetSearchResults}
            currentUserId={currentUserId}
            tweetCard={tweetCard}
            handlers={{ onReply: handleReply, onDeleteComment: handleDeleteComment }}
            onTweetClick={handleTweetClick}
          />
        </div>
      )}
    </div>
  )
}

export default SearchTweet
