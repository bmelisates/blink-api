export const TWEET_DELETED = 'blink:tweet-deleted'
export const TWEET_INTERACTIONS_UPDATED = 'blink:tweet-interactions-updated'
export const notifyTweetInteractions = (id, changes) => window.dispatchEvent(
  new CustomEvent(TWEET_INTERACTIONS_UPDATED, { detail: { id, changes } }))

export const updateTweetInteractions = (items, { id, changes }) => items.map(item =>
  String(item.id) === String(id) ? { ...item, ...changes } : item)
export const notifyTweetDeleted = id => window.dispatchEvent(new CustomEvent(TWEET_DELETED, { detail: id }))

export function removeDeletedTweet(items, id) {
  return items.filter(item => String(item.id) !== String(id)).map(item =>
    String(item.parentTweetId) === String(id)
      ? { ...item, parent: { id, deleted: true, content: null } } : item)
}
