import { test } from 'node:test'
import assert from 'node:assert/strict'
import { removeDeletedTweet } from '../src/services/tweetEvents.js'
import { formatTweet, formatRetweet } from '../src/utils/formatTweet.js'

test('deletion removes root from timeline but preserves reply and redacts cached parent', () => {
  const items = [{ id: 1, content: 'private' }, { id: 2, content: 'reply', parentTweetId: 1,
    parent: { id: 1, content: 'private', user: 'alice' } }]
  const result = removeDeletedTweet(items, 1)
  assert.equal(result.length, 1)
  assert.equal(result[0].content, 'reply')
  assert.deepEqual(result[0].parent, { id: 1, deleted: true, content: null })
})

test('tweet and retweet normalization preserve parent deletion state', () => {
  const reply = { id: 2, content: 'reply', parentTweet: { id: 1, deleted: true, content: null } }
  assert.equal(formatTweet(reply).parent.deleted, true)
  assert.equal(formatRetweet({ id: 3, tweet: reply }).parent.deleted, true)
  assert.equal(formatRetweet({ id: 3, tweet: reply }).parentTweetId, 1)
})
