import api from './api'
import { formatTweet } from '../utils/formatTweet'
import { notifyTweetDeleted, notifyTweetInteractions } from './tweetEvents'

const asComment = reply => ({ ...formatTweet(reply), username: reply.user?.username })

export async function deleteTweet(id) {
  // Capture the visible parent before erasing the reply so every view can be updated.
  const { data: tweet } = await api.get(`/tweets/${id}`)
  const children = tweet.parentTweet && tweet.replyCount > 0
    ? (await api.get(`/tweets/${id}/replies`)).data.map(asComment) : []
  await api.delete(`/tweets/${id}`)
  if (!tweet.parentTweet) {
    notifyTweetDeleted(id)
    return
  }
  const parentId = tweet.parentTweet.id
  try {
    const [{ data: parent }, { data: replies }] = await Promise.all([
      api.get(`/tweets/${parentId}`), api.get(`/tweets/${parentId}/replies`)
    ])
    notifyTweetDeleted(id, formatTweet(parent), replies.map(asComment), children)
    notifyTweetInteractions(parentId, { comments: parent.replyCount })
  } catch (error) {
    // A successful delete stays successful even if refreshing the thread fails.
    const parent = formatTweet(tweet.parentTweet)
    parent.comments = Math.max(0, parent.comments - 1 + (tweet.replyCount || 0))
    notifyTweetDeleted(id, parent, undefined, children)
    notifyTweetInteractions(parentId, { comments: parent.comments })
    console.error('Error refreshing thread after deletion:', error)
  }
}
