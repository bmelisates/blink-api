import api from './api'
import {
  formatRetweet,
  formatTweet
} from '../utils/formatTweet'

export async function fetchProfileData(userId) {
  const [userResponse, tweetsResponse, retweetsResponse] = await Promise.all([
    api.get(`/users/${userId}`),
    api.get(`/tweets/user/${userId}`),
    api.get(`/retweets/user/${userId}`)
  ])

  return {
    user: userResponse.data,
    tweets: tweetsResponse.data.map(formatTweet),
    retweets: retweetsResponse.data.map(formatRetweet)
  }
}
