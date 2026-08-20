import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Home.css'
import api from '../services/api'
import SearchUser from './SearchUser'
import SearchTweet from './SearchTweet'
import Sidebar from './Sidebar'
import FollowSuggestions from './FollowSuggestions'
import TweetCard from '../components/TweetCard'
import { useTweetCard } from '../hooks/useTweetCard'
import { useTranslation } from '../hooks/useTranslation'
import { formatTweet } from '../utils/formatTweet'
import EditTweetModal from '../components/EditTweetModal'
import TweetList from '../components/TweetList'
import useCloseOnOutsideClick from '../hooks/useCloseOnOutsideClick'

function Home() {
  // Sayfa genelinde kullanılacak tweet, retweet ve yeni tweet metni state'leri
  const [tweets, setTweets] = useState([])
  const [retweets, setRetweets] = useState([])
  // inputa yazdığımız yeni tweet metni
  const [newTweet, setNewTweet] = useState('')

  const currentUserId = localStorage.getItem('userId')
  const tweetCard = useTweetCard()
  const location = useLocation()
  const { t } = useTranslation()

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

  const [expandedLikes, setExpandedLikes] = useState({})
  const [likesUsers, setLikesUsers] = useState({})
  const [expandedRetweets, setExpandedRetweets] = useState({})
  const [retweetsUsers, setRetweetsUsers] = useState({})
  const [editingTweet, setEditingTweet] = useState(null)
  const [editContent, setEditContent] = useState('')

  // Sayfa yüklendiğinde backend'den tüm tweetleri ve kullanıcının retweetlerini çeker
  useEffect(() => {
    const fetchTweets = () => {
      api.get('/tweets')
          .then(async response => {
          const formattedTweets = response.data
              .map(tweet => ({
                ...formatTweet(tweet),
                isLiked: tweet.likedByCurrentUser || false
              }))

            const parentIds = [...new Set(formattedTweets.filter(t => t.parentTweetId).map(t => t.parentTweetId))]
            const parentMap = {}
            if (parentIds.length) {
              await Promise.all(parentIds.map(async id => {
                try {
                  const r = await api.get(`/tweets/${id}`)
                  const p = r.data
                  parentMap[id] = {
                    id: p.id,
                    userId: p.user?.id || null,
                    user: p.user?.username || 'unknown',
                    name: p.user?.username || 'Unknown',
                    content: p.content
                  }
                } catch (err) {
                  console.error('Error fetching parent tweet:', err)
                }
              }))
            }

            const enriched = formattedTweets.map(t => ({ ...t, parent: t.parentTweetId ? parentMap[t.parentTweetId] || null : null }))
            setTweets(enriched)
          })
          .catch(error => {
            console.error('Error fetching tweets:', error)
          })
      }

    const fetchRetweets = () => {
      if (currentUserId) {
        api.get(`/retweets/user/${currentUserId}`)
          .then(async response => {
            const formattedRetweets = await Promise.all(response.data.map(async retweet => {
              let currentRetweetCount = retweet.tweet?.retweetCount || 0
              try {
                const countResponse = await api.get(`/retweets/tweet/${retweet.tweet?.id}/count`)
                currentRetweetCount = countResponse.data
              } catch (error) {
                console.error('Error fetching retweet count:', error)
              }

              let currentLikeCount = retweet.tweet?.likeCount || 0
              try {
                const likeCountResponse = await api.get(`/likes/tweet/${retweet.tweet?.id}/count`)
                currentLikeCount = likeCountResponse.data
              } catch (error) {
                console.error('Error fetching like count:', error)
              }

              return {
                id: retweet.tweet?.id || retweet.id,
                userId: retweet.tweet?.user?.id || null,
                user: retweet.tweet?.user?.username || 'unknown',
                name: retweet.tweet?.user?.username || 'Unknown',
                content: retweet.tweet?.content || '',
                likes: currentLikeCount,
                retweets: currentRetweetCount,
                comments: retweet.tweet?.replyCount || 0,
                createdAt: retweet.createdAt || retweet.tweet?.createdAt,
                isRetweeted: true,
                isRetweet: true,
                retweetedBy: retweet.user?.username || 'unknown',
                originalTweetId: retweet.tweet?.id
              }
            }))
            setRetweets(formattedRetweets)
          })
          .catch(error => {
            console.error('Error fetching retweets:', error)
          })
      }
    }

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

    fetchTweets()
    fetchRetweets()
    fetchUserInfo()
  }, [currentUserId])

  // Yeni bir tweet oluşturur ve backend'e gönderdikten sonra akışa ekler
  const handleTweet = () => {
    if (newTweet.trim()) {
      api.post('/tweets', { content: newTweet })
        .then(response => {
          const tweet = {
            id: response.data.id,
            userId: response.data.user?.id || null,
            user: response.data.user?.username || 'ben',
            name: response.data.user?.username || 'Ben',
            content: response.data.content,
            likes: response.data.likeCount || 0,
            retweets: response.data.retweetCount || 0,
            comments: response.data.replyCount || 0,
            createdAt: response.data.createdAt,
            isLiked: false,
            isRetweeted: false
          }
          setTweets([tweet, ...tweets])
          setNewTweet('')
        })
        .catch(error => {
          console.error('Error creating tweet:', error)
        })
    }
  }

  // Beğeni durumunu yönetir; beğenildiyse kaldırır, beğenilmediyse ekler
  const handleLike = async (tweetId) => {
    try {
      const allTweets = [...retweets, ...tweets]
      const tweet = allTweets.find(t => t.id === tweetId)

      if (tweet.isLiked) {
        setTweets(tweets.map(t => t.id === tweetId ? { ...t, isLiked: false, likes: t.likes - 1 } : t))
        setRetweets(retweets.map(r => r.id === tweetId ? { ...r, isLiked: false, likes: r.likes - 1 } : r))
        await api.delete(`/likes/tweet/${tweetId}`)
      } else {
        setTweets(tweets.map(t => t.id === tweetId ? { ...t, isLiked: true, likes: t.likes + 1 } : t))
        setRetweets(retweets.map(r => r.id === tweetId ? { ...r, isLiked: true, likes: r.likes + 1 } : r))
        await api.post('/likes', { tweetId })
      }
    } catch (error) {
      console.error('Error handling like:', error)
    }
  }

  const handleLikeWrapper = (tweetId, isRetweet) => handleLike(tweetId)
  const handleRetweetWrapper = (tweetId) => handleRetweet(tweetId)

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
        setTweets(tweets.map(t => t.id === tweetId ? { ...t, isRetweeted: true, retweets: t.retweets + 1 } : t))

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
        setRetweets([newRetweet, ...retweets])
        await api.post('/retweets', { tweetId })
      }
    } catch (error) {
      console.error('Error handling retweet:', error)
    }
  }

  // Seçilen tweet'i sistemden tamamen siler
  const handleDelete = async (tweetId) => {
    try {
      const deletedTweet = [...tweets, ...retweets].find(tweet => tweet.id === tweetId)
      const parentTweet = deletedTweet?.parentTweetId
        ? [...tweets, ...retweets].find(tweet => tweet.id === deletedTweet.parentTweetId)
        : null
      await api.delete(`/tweets/${tweetId}`)
      setTweets(prev => prev.filter(tweet => tweet.id !== tweetId))
      setRetweets(prev => prev.filter(tweet => tweet.id !== tweetId))

      if (deletedTweet?.parentTweetId) {
        const result = tweetCard.removeCommentFromState(tweetId)
        // Yorum paneli açık değilken de bağımsız akıştaki child tweetin
        // doğrudan bir ana tweete ait olup olmadığını kontrol ederiz.
        const isDirectReply = !parentTweet?.parentTweetId
        if (result.isTopLevelComment || isDirectReply) {
          setTweets(prev => prev.map(tweet => tweet.id === deletedTweet.parentTweetId
            ? { ...tweet, comments: Math.max(0, (tweet.comments || 0) - 1) }
            : tweet
          ))
          setRetweets(prev => prev.map(tweet => tweet.id === deletedTweet.parentTweetId
            ? { ...tweet, comments: Math.max(0, (tweet.comments || 0) - 1) }
            : tweet
          ))
        }
      }
    } catch (error) {
      console.error('Error deleting tweet:', error)
    }
  }

  // Düzenleme modunu açar ve mevcut içeriği form state'ine aktarır
  const handleEdit = (tweet) => {
    setEditingTweet(tweet)
    setEditContent(tweet.content)
  }

  // Yapılan değişiklikleri backend'e göndererek tweet içeriğini günceller
  const handleUpdate = async () => {
    try {
      await api.put(`/tweets/${editingTweet.id}`, { content: editContent })
      setTweets(tweets.map(t => t.id === editingTweet.id ? { ...t, content: editContent } : t))
      setRetweets(retweets.map(r => r.id === editingTweet.id ? { ...r, content: editContent } : r))
      setEditingTweet(null)
      setEditContent('')
    } catch (error) {
      console.error('Error updating tweet:', error)
    }
  }

  // Düzenleme işlemini iptal eder
  const handleCancelEdit = () => {
    setEditingTweet(null)
    setEditContent('')
  }

  // Ana sayfa arayüz yerleşimi (Sidebar, akış, tweet girişi ve sağ panel)
  return (
    <div className="home-container">
      <Sidebar />

      {/* Ana içerik alanı */}
      <main className="main-content">
        <SearchTweet />

        {/* Yeni tweet yazma alanı */}
        <div className="tweet-input-container">
          <textarea
            className="tweet-input"
            placeholder={t('home.tweetInput')}
            value={newTweet}
            onChange={(e) => setNewTweet(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleTweet()
              }
            }}
          />
          <button className="tweet-btn" onClick={handleTweet}>
            {t('home.tweetButton')}
          </button>
        </div>

        <EditTweetModal
          editingTweet={editingTweet}
          editContent={editContent}
          setEditContent={setEditContent}
          onCancel={handleCancelEdit}
          onSave={handleUpdate}
        />

        {/* Tweetlerin listelendiği akış alanı */}
        <div className="tweets-feed">
          <TweetList
            items={[...retweets, ...tweets].sort(
              (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            )}
            currentUserId={currentUserId}
            tweetCard={tweetCard}
            handlers={{
              onLike: handleLike,
              onRetweet: handleRetweet,
              onDelete: handleDelete,
              onEdit: handleEdit,
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
