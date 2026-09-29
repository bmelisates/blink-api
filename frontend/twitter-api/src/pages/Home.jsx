import { notifyTweetDeleted } from '../services/tweetEvents'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './Home.css'
import api from '../services/api'
import { fetchHomeTimeline } from '../services/homeTimeline'
import SearchUser from './SearchUser'
import SearchTweet from './SearchTweet'
import Sidebar from './Sidebar'
import FollowSuggestions from './FollowSuggestions'
import { useTweetCard } from '../hooks/useTweetCard'
import EditTweetModal from '../components/EditTweetModal'
import TweetList from '../components/TweetList'
import TweetComposer from '../components/TweetComposer'
import useCloseOnOutsideClick from '../hooks/useCloseOnOutsideClick'
import { useTimelineState } from '../hooks/useTimelineState'

function Home() {
  // Sayfa genelinde kullanılacak tweet, retweet ve yeni tweet metni state'leri
  const timeline = useTimelineState()
  const { tweets, setTweets, retweets, setRetweets } = timeline
  const currentUserId = localStorage.getItem('userId')
  const tweetCard = useTweetCard()
  const location = useLocation()

  // Açık olan menü ve formların dışına tıklandığında kapanmasını sağlar
  useCloseOnOutsideClick(() => tweetCard.closeAll && tweetCard.closeAll(), ['.tweet-card', '.user-list', '.reply-form'])

  // Arama sonucundan gelindiğinde ilgili tweete yumuşakça kaydırır ve vurgular
  useEffect(() => {
    if (location.state?.scrollToTweet) {
      const tweetId = location.state.scrollToTweet
      setTimeout(() => {
        const tweetElement = document.querySelector(`[data-tweet-id="${tweetId}"]`)
        if (tweetElement) {
          tweetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          tweetElement.style.transition = 'background-color 0.3s ease'
          tweetElement.style.backgroundColor = 'rgba(30, 144, 255, 0.1)'
          setTimeout(() => {
            tweetElement.style.backgroundColor = ''
          }, 2000)
        }
      }, 500)
    }
  }, [location.state?.scrollToTweet])

  // Sayfa yüklendiğinde backend'den tüm tweetleri ve kullanıcının retweetlerini çeker
  useEffect(() => {
    fetchHomeTimeline(currentUserId)
      .then(data => {
        setTweets(data.tweets)
        setRetweets(data.retweets)
      })
      .catch(error => {
        console.error('Error fetching home timeline:', error)
      })
  }, [currentUserId, setRetweets, setTweets])

  // A child tweet retweet should also appear in the main feed immediately.
  const handleCommentRetweet = async (tweetId) => {
    const result = await tweetCard.handleCommentRetweet(tweetId)
    if (!result?.tweet) return

    if (result.action === 'removed') {
      setRetweets(prev => prev.filter(retweet => retweet.id !== tweetId))
      return
    }

    let username = localStorage.getItem('username')
    if (!username && currentUserId) {
      const userResponse = await api.get(`/users/${currentUserId}`)
      username = userResponse.data.username
      localStorage.setItem('username', username)
    }

    const childTweetRetweet = {
      ...result.tweet,
      user: result.tweet.username || 'unknown',
      name: result.tweet.username || 'Unknown',
      isRetweet: true,
      isRetweeted: true,
      retweetedBy: username || 'unknown',
      originalTweetId: result.tweet.id,
      createdAt: new Date().toISOString()
    }
    setRetweets(prev => [childTweetRetweet, ...prev.filter(retweet => retweet.id !== tweetId)])
  }

  const handleReply = async (tweetId, replyContent, isRetweet) => {
    const reply = await tweetCard.handleReply(tweetId, replyContent, isRetweet)
    if (reply) {
      const feedReply = {
        ...reply,
        user: reply.username || 'unknown',
        name: reply.username || 'Unknown',
        isRetweet: false,
        parentTweetId: reply.parentTweetId || tweetId
      }

      setTweets(prev => [
        feedReply,
        ...prev
          .filter(tweet => tweet.id !== reply.id)
          .map(tweet => tweet.id === tweetId
            ? { ...tweet, comments: (tweet.comments || 0) + 1 }
            : tweet
          )
      ])
      setRetweets(prev => prev.map(retweet => retweet.id === tweetId
        ? { ...retweet, comments: (retweet.comments || 0) + 1 }
        : retweet
      ))
    }
    return reply
  }

  const handleDeleteComment = async (commentId, parentTweetId, isRetweet) => {
    const result = await tweetCard.handleDeleteComment(commentId, parentTweetId, isRetweet)
    if (!result?.deleted) return

    // Child tweet ana akışta da gösterildiği için iki görünümden aynı anda kaldır.
    setTweets(prev => prev.filter(tweet => tweet.id !== commentId))
    setRetweets(prev => prev.filter(tweet => tweet.id !== commentId))

    if (!result.isTopLevelComment) return

    setTweets(prev => prev.map(tweet => tweet.id === parentTweetId
      ? { ...tweet, comments: Math.max(0, (tweet.comments || 0) - 1) }
      : tweet
    ))
    setRetweets(prev => prev.map(retweet => retweet.id === parentTweetId
      ? { ...retweet, comments: Math.max(0, (retweet.comments || 0) - 1) }
      : retweet
    ))
  }

  // Retweet durumunu yönetir; retweet yapıldıysa geri alır, yapılmadıysa yeni retweet oluşturur
  const handleRetweet = async (tweetId) => {
    try {
      const allTweets = [...retweets, ...tweets]
      const tweet = allTweets.find(t => t.id === tweetId)

      if (!tweet) {
        return
      }

      if (tweet.isRetweeted) {
        const retweetList = await api.get(`/retweets/tweet/${tweetId}`)
        const currentUserId = localStorage.getItem('userId')
        const userRetweet = retweetList.data.find(r => r.user?.id === parseInt(currentUserId))
        if (userRetweet) {
          await api.delete(`/retweets/${userRetweet.id}`)

          // Update both representations immediately: remove the shared
          // retweet-card entry and reset the original tweet's action state.
          setRetweets(prev => prev.filter(r => r.id !== tweetId))
          setTweets(prev => prev.map(t => t.id === tweetId
            ? { ...t, isRetweeted: false, retweets: Math.max(0, (t.retweets || 0) - 1) }
            : t
          ))
        }
      } else {
        setTweets(prev => prev.map(t => t.id === tweetId ? { ...t, isRetweeted: true, retweets: t.retweets + 1 } : t))

        let username = localStorage.getItem('username')
        if (!username && currentUserId) {
          const userResponse = await api.get(`/users/${currentUserId}`)
          username = userResponse.data.username
          localStorage.setItem('username', username)
        }

        const newRetweet = {
          ...tweet,
          isRetweet: true,
          isRetweeted: true,
          retweetedBy: username || 'unknown',
          retweets: tweet.retweets + 1,
          createdAt: new Date().toISOString()
        }
        setRetweets(prev => [newRetweet, ...prev])
        await api.post('/retweets', { tweetId })
      }
    } catch (error) {
      console.error('Error handling retweet:', error)
    }
  }

  // Seçilen tweet'i sistemden tamamen siler
  const handleDelete = async (tweetId) => {
    try {
      await api.delete(`/tweets/${tweetId}`)
      notifyTweetDeleted(tweetId)
    } catch (error) {
      console.error('Error deleting tweet:', error)
    }
  }

  // Ana sayfa arayüz yerleşimi (Sidebar, akış, tweet girişi ve sağ panel)
  return (
    <div className="home-container">
      <Sidebar />

      {/* Ana içerik alanı */}
      <main className="main-content">
        <SearchTweet />

        <TweetComposer onCreated={tweet => setTweets(current => [tweet, ...current])} />

        <EditTweetModal
          editingTweet={timeline.editingTweet}
          editContent={timeline.editContent}
          setEditContent={timeline.setEditContent}
          onCancel={timeline.cancelEditing}
          onSave={timeline.saveEditing}
        />

        {/* Tweetlerin listelendiği akış alanı */}
        <div className="tweets-feed">
          <TweetList
            items={timeline.timelineItems}
            currentUserId={currentUserId}
            tweetCard={tweetCard}
            handlers={{
              onLike: timeline.handleLike,
              onRetweet: handleRetweet,
              onDelete: handleDelete,
              onEdit: timeline.startEditing,
              onReply: handleReply,
              onDeleteComment: handleDeleteComment,
              onCommentRetweet: handleCommentRetweet,
            }}
          />
        </div>
      </main>

      {/* Sağ yan panel (Kullanıcı arama ve takip önerileri) */}
      <aside className="right-sidebar">
        <SearchUser />
        <FollowSuggestions />
      </aside>
    </div>
  )
}

export default Home
