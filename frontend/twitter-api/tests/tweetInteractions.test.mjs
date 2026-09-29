import { test } from 'node:test'
import assert from 'node:assert/strict'
import { updateTweetInteractions } from '../src/services/tweetEvents.js'

test('interaction updates synchronize duplicate cards without changing unrelated content', () => {
  const cards = [{ id: 7, likes: 0, isRetweet: false, content: 'reply' },
    { id: 7, likes: 0, isRetweet: true, retweetedBy: 'melis' }, { id: 8, likes: 3 }]
  const updated = updateTweetInteractions(cards, { id: '7', changes: { likes: 1, isLiked: true } })
  assert.equal(updated[0].likes, 1)
  assert.equal(updated[1].likes, 1)
  assert.equal(updated[1].isLiked, true)
  assert.equal(updated[0].content, 'reply')
  assert.equal(updated[1].retweetedBy, 'melis')
  assert.equal(updated[2], cards[2])
  assert.equal(cards[0].likes, 0)
  const removed = updateTweetInteractions(updated, { id: 7, changes: { likes: 0, isLiked: false } })
  assert.equal(removed[0].likes, 0)
  assert.equal(removed[1].isLiked, false)
})
