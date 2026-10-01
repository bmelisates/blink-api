import { TWEET_DELETED, removeDeletedCommentData, removeDeletedCommentIndex, TWEET_INTERACTIONS_UPDATED, notifyTweetInteractions } from '../services/tweetEvents'
import { deleteTweet } from '../services/deleteTweet'
import { useEffect, useState } from 'react'
import api from '../services/api'
import { commentInteractionState } from '../utils/commentInteractionState'

export const useTweetCard = () => {
  // ==================== STATE (DURUM) TANIMLAMALARI ====================

  // Hangi tweetin beğenilenler, retweetler veya yorum pencerelerinin açık olduğunu tutan state'ler
  const [openPanels, setOpenPanels] = useState({})
  const [likesUsers, setLikesUsers] = useState({})
  const [retweetsUsers, setRetweetsUsers] = useState({})

  // Yorumlar ile ilgili state'ler
  const [commentsIndex, setCommentsIndex] = useState({}) // stateKey -> yorum ID'lerinin dizisi (eşleme haritası)
  const [commentsData, setCommentsData] = useState({}) // Yorum detay verileri

  // Giriş yapmış olan kullanıcının ID'sini localStorage'dan güvenli bir şekilde alıyoruz
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null

  const updateComment = (commentId, updater) => {
    setCommentsData(prev => {
      const comment = prev[commentId]
      return comment ? { ...prev, [commentId]: updater(comment) } : prev
    })
  }

  // ==================== BEĞENİ VE RETWEET İŞLEMLERİ ====================

  // Tweet veya retweet beğenme / beğeniyi geri alma (Unlike) fonksiyonu
  const handleLike = async (tweetId) => {
    try {
      // Önce backend'den bu tweetin daha önce beğenilip beğenilmediğini kontrol et
      const likesResponse = await api.get(`/likes/tweet/${tweetId}`)
      const alreadyLiked = likesResponse.data.some(like => like.user?.id === parseInt(currentUserId || '0'))

      if (alreadyLiked) {
        // Zaten beğenilmişse beğeniyi kaldır (Delete)
        await api.delete(`/likes/tweet/${tweetId}`)
      } else {
        // Beğenilmemişse yeni beğeni ekle (Post)
        await api.post('/likes', { tweetId })
      }
    } catch (error) {
      console.error('Error handling like:', error)
    }
  }

  // Tweeti retweetleme veya retweet'i kaldırma fonksiyonu
  const handleRetweet = async (tweetId) => {
    try {
      // Önce backend'den bu tweetin daha önce retweet edilip edilmediğini kontrol et
      const retweetsResponse = await api.get(`/retweets/tweet/${tweetId}`)
      const alreadyRetweeted = retweetsResponse.data.some(retweet => retweet.user?.id === parseInt(currentUserId || '0'))

      if (alreadyRetweeted) {
        // Zaten retweet edilmişse retweet'i kaldır (Delete)
        const userRetweet = retweetsResponse.data.find(r => r.user?.id === parseInt(currentUserId || '0'))
        if (userRetweet) {
          await api.delete(`/retweets/${userRetweet.id}`)
          return { action: 'removed' }
        }
      } else {
        // Retweet edilmemişse yeni retweet ekle (Post)
        await api.post('/retweets', { tweetId })
        return { action: 'created' }
      }
    } catch (error) {
      console.error('Error handling retweet:', error)
      return { action: 'failed' }
    } finally {
      try {
        const { data } = await api.get(`/tweets/${tweetId}`)
        notifyTweetInteractions(tweetId, { retweets: data.retweetCount, isRetweeted: data.retweetedByCurrentUser })
      } catch (error) { console.error('Error refreshing retweet:', error) }
    }
  }

  // ==================== PANEL AÇMA / KAPAMA (TOGGLE) İŞLEMLERİ ====================

  // Bir tweetin beğenilerini listeleyen paneli açıp kapatır
  const handleToggleLikes = async (tweetId, isRetweet) => {
    const stateKey = isRetweet ? `retweet_${tweetId}` : tweetId

    if (openPanels[stateKey] === 'likes') {
      // Zaten açıksa kapat
      setOpenPanels(prev => ({ ...prev, [stateKey]: null }))
    } else {
      // Diğer pencereleri kapatıp sadece beğeniler panelini aç
      setOpenPanels(prev => ({ ...prev, [stateKey]: 'likes' }))

      try {
        // Beğenen kullanıcıların listesini API'den çek ve kaydet
        const response = await api.get(`/likes/tweet/${tweetId}`)
        const users = response.data.map(like => ({
          id: like.user?.id,
          username: like.user?.username
        }))
        setLikesUsers(prev => ({ ...prev, [stateKey]: users }))
      } catch (error) {
        console.error('Error fetching likes:', error)
        setOpenPanels(prev => prev[stateKey] === 'likes' ? { ...prev, [stateKey]: null } : prev)
      }
    }
  }

  // Bir tweetin retweet edenlerini listeleyen paneli açıp kapatır
  const handleToggleRetweets = async (tweetId, isRetweet) => {
    const stateKey = isRetweet ? `retweet_${tweetId}` : tweetId

    if (openPanels[stateKey] === 'retweets') {
      setOpenPanels(prev => ({ ...prev, [stateKey]: null }))
    } else {
      // Diğer pencereleri kapat
      setOpenPanels(prev => ({ ...prev, [stateKey]: 'retweets' }))

      try {
        const response = await api.get(`/retweets/tweet/${tweetId}`)
        const users = response.data.map(retweet => ({
          id: retweet.user?.id,
          username: retweet.user?.username
        }))
        setRetweetsUsers(prev => ({ ...prev, [stateKey]: users }))
      } catch (error) {
        console.error('Error fetching retweets:', error)
        setOpenPanels(prev => prev[stateKey] === 'retweets' ? { ...prev, [stateKey]: null } : prev)
      }
    }
  }

  // Yorum yazma input kutusunu açıp kapatır
  const handleToggleReplyForm = (tweetId, isRetweet) => {
    const stateKey = isRetweet ? `retweet_${tweetId}` : tweetId

    if (openPanels[stateKey] === 'reply') {
      setOpenPanels(prev => ({ ...prev, [stateKey]: null }))
    } else {
      // Çakışmayı önlemek için diğer aktif listeleri sıfırla
      setOpenPanels({ [stateKey]: 'reply' })
    }
  }

  // ==================== YORUM (REPLY) İŞLEMLERİ ====================

  // Bir tweete yeni yorum gönderme fonksiyonu
  const handleReply = async (tweetId, replyText, isRetweet) => {
    try {
      const response = await api.post('/tweets', { content: replyText, parentTweetId: tweetId })
      const data = response.data

      // Oluşturulan yeni yorum nesnesini yapılandır
      const reply = {
        id: data.id,
        userId: data.user?.id,
        username: data.user?.username,
        content: data.content,
        likes: data.likeCount || 0,
        retweets: data.retweetCount || 0,
        comments: data.replyCount || 0,
        isLiked: false,
        isRetweeted: false,
        parentTweetId: data.parentTweetId || tweetId,
        createdAt: data.createdAt || new Date().toISOString(),
        replies: [],
        expanded: false,
        showLikes: false,
        showRetweets: false,
        showComments: false,
        likesUsers: [],
        retweetsUsers: [],
        commentsUsers: []
      }

      const stateKey = isRetweet ? `retweet_${tweetId}` : tweetId

      // Yeni yorumu state verilerine ekle ve yorumlar listesinin en başına yerleştir
      setCommentsData(prev => ({ ...prev, [reply.id]: reply }))
      setCommentsIndex(prev => ({ ...prev, [stateKey]: [reply.id, ...(prev[stateKey] || [])] }))
      // Gönderim sonrası yanıt formunu kapatıp yorumları göster
      setOpenPanels(prev => ({ ...prev, [stateKey]: 'comments' }))

      return reply

    } catch (error) {
      console.error('Error creating reply:', error)
    }
  }

  useEffect(() => {
    const deleted = ({ detail }) => {
      setCommentsData(previous => removeDeletedCommentData(previous, detail))
      setCommentsIndex(previous => removeDeletedCommentIndex(previous, detail))
    }
    window.addEventListener(TWEET_DELETED, deleted)
    const updated = ({ detail: { id, changes } }) => setCommentsData(previous => previous[id]
      ? { ...previous, [id]: { ...previous[id], ...changes } } : previous)
    window.addEventListener(TWEET_INTERACTIONS_UPDATED, updated)
    return () => {
      window.removeEventListener(TWEET_DELETED, deleted)
      window.removeEventListener(TWEET_INTERACTIONS_UPDATED, updated)
    }
  }, [])
  // Tweetin altındaki yorumları açıp kapatır ve API'den getirir
  const handleToggleComments = async (tweetId, isRetweet) => {
    const stateKey = isRetweet ? `retweet_${tweetId}` : tweetId

    if (openPanels[stateKey] === 'comments') {
      setOpenPanels(prev => ({ ...prev, [stateKey]: null }))
    } else {
      // Diğer pencereleri kapatıp yorumlar alanını aç
      setOpenPanels(prev => ({ ...prev, [stateKey]: 'comments' }))

      try {
        const response = await api.get(`/tweets/${tweetId}/replies`)

        const comments = response.data.map(comment => {
          return {
            id: comment.id,
            userId: comment.user?.id,
            username: comment.user?.username,
            content: comment.content, deleted: comment.deleted === true,
            likes: comment.likeCount || 0,
            retweets: comment.retweetCount || 0,
            comments: comment.replyCount || 0,
            ...commentInteractionState(comment),
            replies: [],
            expanded: false,
            showLikes: false,
            showRetweets: false,
            showComments: false,
            likesUsers: [],
            retweetsUsers: [],
            commentsUsers: []
          }
        })

        // Yorum verilerini dictionary (hash) yapısına kaydet
        const newCommentsData = { ...commentsData }
        comments.forEach(comment => {
          newCommentsData[comment.id] = comment
        })
        setCommentsData(newCommentsData)

        // Yorum ID'lerini sırasıyla index listesine kaydet
        setCommentsIndex(prev => ({ ...prev, [stateKey]: comments.map(c => c.id) }))
      } catch (error) {
        console.error('Error fetching comments:', error)
        setOpenPanels(prev => prev[stateKey] === 'comments' ? { ...prev, [stateKey]: null } : prev)
      }
    }
  }

  // Belirli bir yorumu silme fonksiyonu
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteTweet(commentId)
      // Counts are synchronized from the server through the interaction event.
      return { deleted: true, isTopLevelComment: false }
    } catch (error) {
      console.error('Error deleting comment:', error)
      return { deleted: false, isTopLevelComment: false }
    }
  }

  // Yorumu beğenme veya beğeniyi kaldırma fonksiyonu
  const handleCommentLike = async (commentId) => {
    try {
      const likesResponse = await api.get(`/likes/tweet/${commentId}`)
      const alreadyLiked = likesResponse.data.some(like => like.user?.id === parseInt(currentUserId))

      if (alreadyLiked) {
        await api.delete(`/likes/tweet/${commentId}`)
        updateComment(commentId, comment => ({
          ...comment,
          isLiked: false,
          likes: Math.max(0, (comment.likes || 0) - 1)
        }))
      } else {
        await api.post('/likes', { tweetId: commentId })
        updateComment(commentId, comment => ({
          ...comment,
          isLiked: true,
          likes: (comment.likes || 0) + 1
        }))
      }
    } catch (error) {
      console.error('Error handling comment like:', error)
    } finally {
      try {
        const { data } = await api.get(`/tweets/${commentId}`)
        notifyTweetInteractions(commentId, { likes: data.likeCount, isLiked: data.likedByCurrentUser })
      } catch (error) { console.error('Error refreshing comment like:', error) }
    }
  }

  // Yorumu retweetleme fonksiyonu
  const handleCommentRetweet = async (commentId) => {
    try {
      const comment = commentsData[commentId]
      const response = await api.get(`/retweets/tweet/${commentId}`)
      const userRetweet = response.data.find(retweet => retweet.user?.id === parseInt(currentUserId || '0'))

      if (userRetweet) {
        await api.delete(`/retweets/${userRetweet.id}`)
        const updatedComment = {
          ...comment,
          isRetweeted: false,
          retweets: Math.max(0, (comment.retweets || 0) - 1)
        }
        updateComment(commentId, () => updatedComment)
        return { action: 'removed', tweet: updatedComment }
      } else {
        await api.post('/retweets', { tweetId: commentId })
        const updatedComment = {
          ...comment,
          isRetweeted: true,
          retweets: (comment.retweets || 0) + 1
        }
        updateComment(commentId, () => updatedComment)
        return { action: 'created', tweet: updatedComment }
      }
    } catch (error) {
      console.error('Error handling comment retweet:', error)
    } finally {
      try {
        const { data } = await api.get(`/tweets/${commentId}`)
        notifyTweetInteractions(commentId, { retweets: data.retweetCount, isRetweeted: data.retweetedByCurrentUser })
      } catch (error) { console.error('Error refreshing comment retweet:', error) }
    }
  }

  // ==================== İÇ İÇE YANITLAR (NESTED REPLIES) ====================

  // Bir yoruma verilen yanıtı kaydetme fonksiyonu
  const handleCommentReply = async (commentId, replyText) => {
    try {
      const response = await api.post('/tweets', { content: replyText, parentTweetId: commentId })
      const data = response.data
      const reply = {
        id: data.id,
        userId: data.user?.id,
        username: data.user?.username,
        content: data.content,
        likes: data.likeCount || 0,
        retweets: data.retweetCount || 0,
        comments: data.replyCount || 0,
        isLiked: false,
        isRetweeted: false,
        replies: [],
        expanded: false,
        showLikes: false,
        showRetweets: false,
        showComments: false,
        likesUsers: [],
        retweetsUsers: [],
        commentsUsers: []
      }

      // Yeni yanıtı üst yorumun alt yanıtlar listesine ekle
      setCommentsData(prev => {
        const updated = { ...prev, [reply.id]: reply }
        if (updated[commentId]) {
          const currentReplies = updated[commentId].replies || []
          // Keep this thread open so the newly created nested reply is
          // immediately visible beneath its parent comment.
          updated[commentId] = { ...updated[commentId], replies: [reply.id, ...currentReplies], expanded: true }
        } else {
          // Bulunamazsa tarama yaparak eşleşeni güncelle (yedek mekanizma)
          Object.keys(updated).forEach(k => {
            if (updated[k].id === commentId) {
              const currentReplies = updated[k].replies || []
              updated[k] = { ...updated[k], replies: [reply.id, ...currentReplies], expanded: true }
            }
          })
        }
        return updated
      })

      updateComment(commentId, comment => ({
        ...comment,
        comments: (comment.comments || 0) + 1
      }))

    } catch (error) {
      console.error('Error creating nested reply:', error)
    }
  }

  const handleEditComment = async (commentId, content) => {
    try {
      await api.put(`/tweets/${commentId}`, { content })
      updateComment(commentId, comment => ({ ...comment, content }))
    } catch (error) {
      console.error('Error updating comment:', error)
      throw error
    }
  }

  // Yoruma gelen alt yanıtları açıp kapatma fonksiyonu
  const handleToggleCommentReplies = async (commentId) => {
    setCommentsData(prev => {
      const newData = { ...prev }
      Object.keys(newData).forEach(key => {
        if (newData[key].id === commentId) {
          const current = newData[key].expanded
          if (current) {
            newData[key] = { ...newData[key], expanded: false }
          } else {
            newData[key] = { ...newData[key], expanded: true }
            if (newData[key].replies.length === 0) {
              // Alt yanıtlar henüz yüklenmediyse API'den getir
              api.get(`/tweets/${commentId}/replies`)
                .then(async response => {
                  const newReplyIds = []
                  const newRepliesData = { ...commentsData }

                  response.data.forEach(reply => {
                    const replyData = {
                      id: reply.id,
                      userId: reply.user?.id,
                      username: reply.user?.username,
                      content: reply.content, deleted: reply.deleted === true,
                      likes: reply.likeCount || 0,
                      retweets: reply.retweetCount || 0,
                      comments: reply.replyCount || 0,
                      ...commentInteractionState(reply),
                      replies: [],
                      expanded: false,
                      showLikes: false,
                      showRetweets: false,
                      showComments: false,
                      likesUsers: [],
                      retweetsUsers: [],
                      commentsUsers: []
                    }
                    newRepliesData[reply.id] = replyData
                    newReplyIds.push(reply.id)
                  })
                  setCommentsData(prev => ({ ...prev, ...newRepliesData }))
                  setCommentsData(prev => {
                    const updated = { ...prev }
                    Object.keys(updated).forEach(k => {
                      if (updated[k].id === commentId) {
                        updated[k] = { ...updated[k], replies: newReplyIds }
                      }
                    })
                    return updated
                  })
                })
                .catch(error => {
                  console.error('Error fetching nested replies:', error)
                })
            }
          }
        }
      })
      return newData
    })
  }

  // Yorumun beğenilerini gösteren paneli aç/kapat
  const handleToggleCommentLikes = async (commentId) => {
    setCommentsData(prev => {
      const newData = { ...prev }
      Object.keys(newData).forEach(key => {
        if (newData[key].id === commentId) {
          const current = newData[key].showLikes
          if (current) {
            newData[key] = { ...newData[key], showLikes: false }
          } else {
            Object.keys(newData).forEach(k => {
              if (newData[k].id === commentId) {
                newData[k] = {
                  ...newData[k],
                  showLikes: true,
                  showRetweets: false,
                  showComments: false
                }
              }
            })
            api.get(`/likes/tweet/${commentId}`)
              .then(response => {
                const users = response.data.map(like => ({
                  id: like.user?.id,
                  username: like.user?.username
                }))
                setCommentsData(prev => {
                  const updated = { ...prev }
                  Object.keys(updated).forEach(k => {
                    if (updated[k].id === commentId) {
                      updated[k] = { ...updated[k], likesUsers: users }
                    }
                  })
                  return updated
                })
              })
              .catch(error => {
                console.error('Error fetching comment likes:', error)
              })
          }
        }
      })
      return newData
    })
  }

  // Yorumun retweetlerini gösteren paneli aç/kapat
  const handleToggleCommentRetweets = async (commentId) => {
    setCommentsData(prev => {
      const newData = { ...prev }
      Object.keys(newData).forEach(key => {
        if (newData[key].id === commentId) {
          const current = newData[key].showRetweets
          if (current) {
            newData[key] = { ...newData[key], showRetweets: false }
          } else {
            Object.keys(newData).forEach(k => {
              if (newData[k].id === commentId) {
                newData[k] = {
                  ...newData[k],
                  showLikes: false,
                  showRetweets: true,
                  showComments: false
                }
              }
            })
            api.get(`/retweets/tweet/${commentId}`)
              .then(response => {
                const users = response.data.map(retweet => ({
                  id: retweet.user?.id,
                  username: retweet.user?.username
                }))
                setCommentsData(prev => {
                  const updated = { ...prev }
                  Object.keys(updated).forEach(k => {
                    if (updated[k].id === commentId) {
                      updated[k] = { ...updated[k], retweetsUsers: users }
                    }
                  })
                  return updated
                })
              })
              .catch(error => {
                console.error('Error fetching comment retweets:', error)
              })
          }
        }
      })
      return newData
    })
  }

  // Yorumun altındaki yanıt giriş alanını veya yanıt listesini aç/kapat
  const handleToggleCommentComments = async (commentId) => {
    setCommentsData(prev => {
      const newData = { ...prev }
      Object.keys(newData).forEach(key => {
        if (newData[key].id === commentId) {
          const current = newData[key].showComments
          if (current) {
            newData[key] = { ...newData[key], showComments: false }
          } else {
            Object.keys(newData).forEach(k => {
              if (newData[k].id === commentId) {
                newData[k] = {
                  ...newData[k],
                  showLikes: false,
                  showRetweets: false,
                  showComments: true
                }
              }
            })
            api.get(`/tweets/${commentId}/replies`)
              .then(response => {
                const replyIds = []
                const newRepliesData = { ...commentsData }
                response.data.forEach(reply => {
                  const replyData = {
                    id: reply.id,
                    userId: reply.user?.id,
                    username: reply.user?.username,
                    content: reply.content, deleted: reply.deleted === true,
                    likes: reply.likeCount || 0,
                    retweets: reply.retweetCount || 0,
                    comments: reply.replyCount || 0,
                    ...commentInteractionState(reply),
                    replies: [],
                    expanded: false,
                    showLikes: false,
                    showRetweets: false,
                    showComments: false,
                    likesUsers: [],
                    retweetsUsers: [],
                    commentsUsers: []
                  }
                  newRepliesData[reply.id] = { ...newRepliesData[reply.id], ...replyData }
                  replyIds.push(reply.id)
                })
                setCommentsData(prev => ({ ...prev, ...newRepliesData }))
                setCommentsData(prev => {
                  const updated = { ...prev }
                  Object.keys(updated).forEach(k => {
                    if (updated[k].id === commentId) {
                      updated[k] = { ...updated[k], replies: replyIds }
                    }
                  })
                  return updated
                })
              })
              .catch(error => {
                console.error('Error fetching comment replies:', error)
              })
          }
        }
      })
      return newData
    })
  }

  // Tüm açık pencereleri, formları ve listeleri sıfırlayarak kapatır
  const closeAll = () => {
    setOpenPanels({})
  }

  // Hook dışarısından erişilebilecek state, fonksiyon ve yardımcı araçları döndürüyoruz
  return {
    // States (Durumlar)
    openPanels,
    likesUsers,
    retweetsUsers,
    commentsIndex,
    commentsData,
    // Handlers (İşlem Fonksiyonları)
    handleLike,
    handleRetweet,
    handleToggleLikes,
    handleToggleRetweets,
    handleToggleReplyForm,
    handleReply,
    handleToggleComments,
    handleDeleteComment,
    handleCommentLike,
    handleCommentRetweet,
    handleCommentReply,
    handleEditComment,
    handleToggleCommentReplies,
    handleToggleCommentLikes,
    handleToggleCommentRetweets,
    handleToggleCommentComments,

    // Utilities (Yardımcı Araçlar)
    closeAll,
    currentUserId
  }
}
