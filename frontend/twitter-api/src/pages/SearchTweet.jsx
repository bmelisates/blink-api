import { useNavigate } from 'react-router-dom'
import './SearchTweet.css'
import { useTweetCard } from '../hooks/useTweetCard'
import TweetList from '../components/TweetList'
import useCloseOnOutsideClick from '../hooks/useCloseOnOutsideClick'
import { formatTweet } from '../utils/formatTweet'
import { useTranslation } from '../hooks/useTranslation'
import useClickOutside from '../hooks/useClickOutside'
import useSearch from '../hooks/useSearch'

function SearchTweet() {
  const tweetSearch = useSearch('/tweets/search', formatTweet)
  const searchContainerRef = useClickOutside(tweetSearch.clearResults)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const tweetCard = useTweetCard()
  const currentUserId = tweetCard.currentUserId

  // Close open lists/forms when clicking outside a tweet card
  useCloseOnOutsideClick(() => tweetCard.closeAll && tweetCard.closeAll(), ['.tweet-card', '.user-list', '.reply-form'])

  const handleReply = async (tweetId, replyContent, isRetweet) => {
    try {
      const reply = await tweetCard.handleReply(tweetId, replyContent, isRetweet)
      tweetSearch.setResults(prev => prev.map(t => t.id === tweetId ? { ...t, comments: (t.comments || 0) + 1 } : t))
      return reply
    } catch (error) {
      console.error('Error creating reply (search wrapper):', error)
    }
  }

  const handleDeleteComment = async (commentId, parentTweetId, isRetweet) => {
    try {
      const result = await tweetCard.handleDeleteComment(commentId, parentTweetId, isRetweet)
      if (!result?.isTopLevelComment) return
      tweetSearch.setResults(prev => prev.map(t => t.id === parentTweetId ? { ...t, comments: Math.max(0, (t.comments || 0) - 1) } : t))
    } catch (error) {
      console.error('Error deleting comment (search wrapper):', error)
    }
  }

  const handleTweetClick = (tweetId) => {
    tweetSearch.clear()
    navigate('/home', { state: { scrollToTweet: tweetId } })
  }

  return (
    <div className="tweet-search-container" ref={searchContainerRef}>
      <input
        type="text"
        placeholder={t('home.searchTweet')}
        className="tweet-search-input"
        value={tweetSearch.term}
        onChange={(e) => tweetSearch.setTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            tweetSearch.search()
          }
        }}
      />
      {tweetSearch.results.length > 0 && (
        <div className="tweet-search-results">
          <TweetList
            items={tweetSearch.results}
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
