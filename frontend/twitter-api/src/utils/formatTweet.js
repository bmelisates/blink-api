const getUserName = (user) => user?.username || user?.name || 'unknown'
const getDisplayName = (user) => user?.username || user?.name || 'Unknown'

const buildParent = (p) => {
  if (!p) return null
  return {
    id: p.id,
    userId: p.user?.id || p.userId || null,
    user: getUserName(p.user || p),
    name: getDisplayName(p.user || p),
    content: p.content
  }
}

export const formatTweet = (tweet) => ({
  id: tweet.id,
  userId: tweet.user?.id || null,
  user: getUserName(tweet.user),
  name: getDisplayName(tweet.user),
  content: tweet.content,
  likes: tweet.likeCount || 0,
  retweets: tweet.retweetCount || 0,
  comments: tweet.replyCount || 0,
  parentTweetId: tweet.parentTweetId || tweet.parentTweet?.id || tweet.parentId || tweet.parent_id || tweet.parent?.id || null,
  parent: buildParent(tweet.parentTweet) || buildParent(tweet.parent),
  createdAt: tweet.createdAt,
  time: tweet.time || 'now',
  isLiked: tweet.likedByCurrentUser || false,
  isRetweet: false
})

export const formatTweetWithLikeStatus = async (tweet, currentUserId, api) => {
  let isLiked = false
  try {
    const likesResponse = await api.get(`/likes/tweet/${tweet.id}`)
    isLiked = likesResponse.data.some(like => like.user?.id === parseInt(currentUserId))
  } catch (error) {
    console.error('Error fetching like status:', error)
  }

  return {
    ...formatTweet(tweet),
    isLiked
  }
}

export const formatRetweet = (retweet) => ({
  id: retweet.tweet?.id || retweet.id,
  userId: retweet.tweet?.user?.id || null,
  user: getUserName(retweet.tweet?.user),
  name: getDisplayName(retweet.tweet?.user),
  content: retweet.tweet?.content || '',
  likes: retweet.tweet?.likeCount || 0,
  retweets: retweet.tweet?.retweetCount || 0,
  comments: retweet.tweet?.replyCount || 0,
  parentTweetId: retweet.tweet?.parentTweetId || retweet.tweet?.parentId || retweet.tweet?.parent_id || retweet.tweet?.parent?.id || null,
  createdAt: retweet.createdAt || retweet.tweet?.createdAt,
  time: 'now',
  isLiked: retweet.tweet?.likedByCurrentUser || false,
  isRetweeted: true,
  isRetweet: true,
  retweetedBy: retweet.user?.username || 'unknown',
  originalTweetId: retweet.tweet?.id
})
