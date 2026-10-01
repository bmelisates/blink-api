export const TWEET_DELETED = 'blink:tweet-deleted'
export const TWEET_INTERACTIONS_UPDATED = 'blink:tweet-interactions-updated'
export const notifyTweetInteractions = (id, changes) => window.dispatchEvent(
  new CustomEvent(TWEET_INTERACTIONS_UPDATED, { detail: { id, changes } }))

export const updateTweetInteractions = (items, { id, changes }) => items.map(item =>
  String(item.id) === String(id) ? { ...item, ...changes } : item)
export const notifyTweetDeleted = (id, keepPlaceholder = false, threads = []) => window.dispatchEvent(
  new CustomEvent(TWEET_DELETED, { detail: { id, keepPlaceholder, threads } }))

export function removeDeletedTweet(items, id) {
  return items.filter(item => String(item.id) !== String(id)).map(item =>
    String(item.parentTweetId) === String(id)
      ? { ...item, parent: { id, deleted: true, content: null } } : item)
}

const hiddenCommentIds = ({ id, keepPlaceholder, threads = [] }) => new Set([
  ...(!keepPlaceholder ? [String(id)] : []),
  ...threads.filter(({ parent }) => parent.deleted && parent.parentTweetId && parent.comments === 0)
    .map(({ parent }) => String(parent.id))
])

const redactComment = comment => ({ ...comment, deleted: true, content: null, userId: null,
  username: null, user: null, name: null, likes: 0, retweets: 0, isLiked: false, isRetweeted: false,
  likesUsers: [], retweetsUsers: [], showLikes: false, showRetweets: false })

export function removeDeletedCommentData(previous, detail) {
  const { id, keepPlaceholder, threads = [] } = detail
  const hidden = hiddenCommentIds(detail)
  const next = { ...previous }
  if (keepPlaceholder && next[id]) next[id] = redactComment(next[id])
  for (const { parent, replies } of threads) {
    for (const reply of replies || []) {
      const merged = { replies: [], ...next[reply.id], ...reply }
      next[reply.id] = reply.deleted ? redactComment(merged) : merged
    }
    if (next[parent.id]) {
      next[parent.id] = { ...next[parent.id], comments: parent.comments,
        ...(replies ? { replies: replies.map(reply => reply.id) } : {}) }
    }
  }
  for (const [key, comment] of Object.entries(next)) {
    if (hidden.has(String(key))) delete next[key]
    else next[key] = { ...comment, replies: (comment.replies || []).filter(replyId => !hidden.has(String(replyId))) }
  }
  return next
}

export function removeDeletedCommentIndex(previous, detail) {
  const hidden = hiddenCommentIds(detail)
  return Object.fromEntries(Object.entries(previous).map(([key, ids]) => {
    const thread = detail.threads?.find(({ parent }) => key === String(parent.id) || key === `retweet_${parent.id}`)
    const updated = thread?.replies ? thread.replies.map(reply => reply.id) : ids
    return [key, updated.filter(replyId => !hidden.has(String(replyId)))]
  }))
}
