export const TWEET_DELETED = 'blink:tweet-deleted'
export const notifyTweetDeleted = id => window.dispatchEvent(new CustomEvent(TWEET_DELETED, { detail: id }))

export function removeDeletedTweet(items, id) {
  return items.filter(item => String(item.id) !== String(id)).map(item =>
    String(item.parentTweetId) === String(id)
      ? { ...item, parent: { id, deleted: true, content: null } } : item)
}
