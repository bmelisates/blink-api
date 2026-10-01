import api from './api'
import { formatTweet } from '../utils/formatTweet'
import { notifyTweetDeleted, notifyTweetInteractions } from './tweetEvents'

const asComment = reply => ({ ...formatTweet(reply), username: reply.user?.username })

export async function deleteTweet(id) {
  // Keep the ancestor chain so empty deleted branches disappear in every open view.
  const { data: tweet } = await api.get(`/tweets/${id}`)
  const ancestors = []
  for (let parent = tweet.parentTweet; parent; parent = parent.parentTweet) ancestors.push(parent)
  await api.delete(`/tweets/${id}`)
  try {
    const [{ data: deleted }, threads] = await Promise.all([
      api.get(`/tweets/${id}`),
      Promise.all(ancestors.map(async ancestor => {
        const [{ data: parent }, { data: replies }] = await Promise.all([
          api.get(`/tweets/${ancestor.id}`), api.get(`/tweets/${ancestor.id}/replies`)
        ])
        return { parent: formatTweet(parent), replies: replies.map(asComment) }
      }))
    ])
    notifyTweetDeleted(id, deleted.replyCount > 0, threads)
    for (const { parent } of threads) notifyTweetInteractions(parent.id, { comments: parent.comments })
  } catch (error) {
    // A successful delete stays successful even if refreshing the thread fails.
    const keepPlaceholder = tweet.replyCount > 0
    let removedChild = !keepPlaceholder
    const threads = ancestors.map(ancestor => {
      const parent = formatTweet(ancestor)
      if (removedChild) parent.comments = Math.max(0, parent.comments - 1)
      removedChild = removedChild && parent.deleted && parent.comments === 0
      return { parent }
    })
    notifyTweetDeleted(id, keepPlaceholder, threads)
    for (const { parent } of threads) notifyTweetInteractions(parent.id, { comments: parent.comments })
    console.error('Error refreshing thread after deletion:', error)
  }
}
