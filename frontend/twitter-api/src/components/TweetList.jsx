import TweetCard from './TweetCard'

export default function TweetList({ items = [], currentUserId, tweetCard, handlers = {}, onTweetClick }) {
  return (
    <>
      {items.map(tweet => (
        <TweetCard
          // A retweet and its original tweet have the same id. Include the
          // entry type so React can remove the retweet card independently.
          key={`${tweet.isRetweet ? 'retweet' : 'tweet'}-${tweet.id}`}
          tweet={tweet}
          currentUserId={currentUserId}
          onLike={handlers.onLike || tweetCard.handleLike}
          onRetweet={handlers.onRetweet || tweetCard.handleRetweet}
          onDelete={handlers.onDelete}
          onEdit={handlers.onEdit}
          onToggleLikes={tweetCard.handleToggleLikes}
          onToggleRetweets={tweetCard.handleToggleRetweets}
          openPanels={tweetCard.openPanels}
          likesUsers={tweetCard.likesUsers}
          retweetsUsers={tweetCard.retweetsUsers}
          onReply={handlers.onReply || tweetCard.handleReply}
          onToggleReplyForm={tweetCard.handleToggleReplyForm}
          onToggleComments={handlers.onToggleComments || tweetCard.handleToggleComments}
          commentsIndex={tweetCard.commentsIndex}
          onDeleteComment={handlers.onDeleteComment || tweetCard.handleDeleteComment}
          onCommentLike={tweetCard.handleCommentLike}
          onCommentRetweet={handlers.onCommentRetweet || tweetCard.handleCommentRetweet}
          onCommentReply={tweetCard.handleCommentReply}
          onEditComment={tweetCard.handleEditComment}
          onToggleCommentReplies={tweetCard.handleToggleCommentReplies}
          onToggleCommentLikes={tweetCard.handleToggleCommentLikes}
          onToggleCommentRetweets={tweetCard.handleToggleCommentRetweets}
          onToggleCommentComments={tweetCard.handleToggleCommentComments}
          commentsData={tweetCard.commentsData}
          onTweetClick={onTweetClick}
        />
      ))}
    </>
  )
}
