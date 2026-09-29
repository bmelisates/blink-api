import { test } from 'node:test'
import assert from 'node:assert/strict'
import { commentInteractionState } from '../src/utils/commentInteractionState.js'

test('reopened replies preserve the current viewer like and retweet flags', () => {
  assert.deepEqual(commentInteractionState({ likedByCurrentUser: true, retweetedByCurrentUser: true }),
    { isLiked: true, isRetweeted: true })
  assert.deepEqual(commentInteractionState({ likedByCurrentUser: false, retweetedByCurrentUser: false }),
    { isLiked: false, isRetweeted: false })
})

test('missing state and deleted reply placeholders cannot appear liked or retweeted', () => {
  assert.deepEqual(commentInteractionState({}), { isLiked: false, isRetweeted: false })
  assert.deepEqual(commentInteractionState({ deleted: true, likedByCurrentUser: true, retweetedByCurrentUser: true }),
    { isLiked: false, isRetweeted: false })
})
