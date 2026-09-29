// The replies API already returns interaction state for the authenticated viewer.
export const commentInteractionState = reply => ({
  isLiked: !reply.deleted && reply.likedByCurrentUser === true,
  isRetweeted: !reply.deleted && reply.retweetedByCurrentUser === true
})
