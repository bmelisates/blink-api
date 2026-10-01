export const TWEET_DELETED = 'blink:tweet-deleted'
export const TWEET_INTERACTIONS_UPDATED = 'blink:tweet-interactions-updated'
export const notifyTweetInteractions = (id, changes) => window.dispatchEvent(
  new CustomEvent(TWEET_INTERACTIONS_UPDATED, { detail: { id, changes } }))

export const updateTweetInteractions = (items, { id, changes }) => items.map(item =>
  String(item.id) === String(id) ? { ...item, ...changes } : item)
export const notifyTweetDeleted = (id, parent, replies, children = []) => window.dispatchEvent(
  new CustomEvent(TWEET_DELETED, { detail: { id, parent, replies, children } }))

export function removeDeletedTweet(items, id, parent = { id, deleted: true, content: null }) {
  return items.filter(item => String(item.id) !== String(id)).map(item =>
    String(item.parentTweetId) === String(id)
      ? { ...item, parentTweetId: parent.id, parent } : item)
}

const replaceDeletedId = (ids, id, children) => ids.flatMap(replyId =>
  String(replyId) === String(id) ? children.map(child => child.id) : [replyId])

export function removeDeletedCommentData(previous, { id, parent, replies, children = [] }) {
  const next = { ...previous }
  delete next[id]
  for (const [key, comment] of Object.entries(next)) {
    next[key] = { ...comment, replies: replaceDeletedId(comment.replies || [], id, children) }
  }
  for (const child of children) {
    next[child.id] = { replies: [], ...next[child.id], ...child, parentTweetId: parent.id, parent }
  }
  if (parent && next[parent.id]) next[parent.id] = { ...next[parent.id], comments: parent.comments }
  if (replies) {
    for (const reply of replies) {
      next[reply.id] = { replies: [], ...next[reply.id], ...reply }
    }
    if (next[parent.id]) {
      next[parent.id] = { ...next[parent.id], comments: parent.comments, replies: replies.map(reply => reply.id) }
    }
  }
  return next
}

export function removeDeletedCommentIndex(previous, { id, parent, replies, children = [] }) {
  return Object.fromEntries(Object.entries(previous).map(([key, ids]) => [key,
    replies && (key === String(parent.id) || key === `retweet_${parent.id}`)
      ? replies.map(reply => reply.id) : replaceDeletedId(ids, id, children)]))
}
