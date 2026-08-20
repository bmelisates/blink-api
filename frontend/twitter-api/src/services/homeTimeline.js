import api from './api'
import { formatRetweet, formatTweet } from '../utils/formatTweet'

async function fetchTweets() {
  const response = await api.get('/tweets')
  return response.data.map(formatTweet)
}

async function fetchRetweets(currentUserId) {
  if (!currentUserId) return []
  const response = await api.get(`/retweets/user/${currentUserId}`)
  return response.data.map(formatRetweet)
}

async function ensureUsername(currentUserId) {
  if (!currentUserId || localStorage.getItem('username')) return
  const response = await api.get(`/users/${currentUserId}`)
  localStorage.setItem('username', response.data.username)
}

export async function fetchHomeTimeline(currentUserId) {
  const [tweets, retweets] = await Promise.all([
    fetchTweets(),
    fetchRetweets(currentUserId),
    ensureUsername(currentUserId)
  ])
  return { tweets, retweets }
}
