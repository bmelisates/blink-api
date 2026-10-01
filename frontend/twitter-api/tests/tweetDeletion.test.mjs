import { test } from 'node:test'
import assert from 'node:assert/strict'
import { removeDeletedTweet, removeDeletedCommentData, removeDeletedCommentIndex } from '../src/services/tweetEvents.js'
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

test('deleting a reply removes its box and promotes children in open threads and duplicate cards', () => {
  const parent = { id: 1, comments: 2, content: 'root' }
  const replies = [{ id: 3, content: 'kept child', comments: 0 }, { id: 4, content: 'sibling' }]
  const event = { id: 2, parent, replies }
  const data = { 1: { id: 1, replies: [2, 4] }, 2: { id: 2, replies: [3], content: 'deleted reply' },
    3: { id: 3, replies: [], isLiked: true }, 4: { id: 4, replies: [] } }
  const updated = removeDeletedCommentData(data, event)
  assert.equal(updated[2], undefined)
  assert.deepEqual(updated[1].replies, [3, 4])
  assert.equal(updated[1].comments, 2)
  assert.equal(updated[3].content, 'kept child')
  assert.equal(updated[3].isLiked, true)
  assert.equal(data[2].content, 'deleted reply')
  assert.deepEqual(removeDeletedCommentIndex({ 1: [2, 4], retweet_1: [2, 4], 9: [10] }, event),
    { 1: [3, 4], retweet_1: [3, 4], 9: [10] })
  const cards = [{ id: 2 }, { id: 3, parentTweetId: 2, parent: { id: 2 } },
    { id: 3, isRetweet: true, parentTweetId: 2, parent: { id: 2 } }]
  const result = removeDeletedTweet(cards, event.id, parent)
  assert.equal(result.length, 2)
  assert.ok(result.every(card => card.parent.id === 1 && card.parentTweetId === 1 && !card.parent.deleted))
})

test('deleting the last reply leaves no placeholder or thread index entry', () => {
  const event = { id: 2, parent: { id: 1, comments: 0 }, replies: [] }
  const updated = removeDeletedCommentData({ 1: { id: 1, replies: [2], comments: 1 },
    2: { id: 2, content: 'reply' } }, event)
  assert.equal(updated[2], undefined)
  assert.equal(updated[1].comments, 0)
  assert.deepEqual(updated[1].replies, [])
  assert.deepEqual(removeDeletedCommentIndex({ 1: [2] }, event), { 1: [] })
})

test('a failed thread refresh still preserves children captured before deletion', () => {
  const parent = { id: 1, comments: 2 }
  const children = [{ id: 3, content: 'kept', parentTweetId: 2 }]
  const event = { id: 2, parent, children }
  const updated = removeDeletedCommentData({ 1: { id: 1, replies: [2, 4] },
    2: { id: 2, replies: [] } }, event)
  assert.equal(updated[2], undefined)
  assert.deepEqual(updated[1].replies, [3, 4])
  assert.equal(updated[3].parentTweetId, 1)
  assert.deepEqual(removeDeletedCommentIndex({ 1: [2, 4] }, event), { 1: [3, 4] })
})
