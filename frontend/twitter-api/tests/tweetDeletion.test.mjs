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

test('deleting a reply with children redacts its box and preserves the thread hierarchy', () => {
  const parent = { id: 1, comments: 2, content: 'root' }
  const replies = [{ id: 2, deleted: true, content: null, comments: 1 }, { id: 4, content: 'sibling' }]
  const event = { id: 2, keepPlaceholder: true, threads: [{ parent, replies }] }
  const data = { 1: { id: 1, replies: [2, 4] }, 2: { id: 2, replies: [3], content: 'deleted reply',
    userId: 7, username: 'owner', likesUsers: [{ id: 7 }], likes: 1, isLiked: true },
    3: { id: 3, replies: [], isLiked: true }, 4: { id: 4, replies: [] } }
  const updated = removeDeletedCommentData(data, event)
  assert.equal(updated[2].deleted, true)
  assert.equal(updated[2].content, null)
  assert.equal(updated[2].userId, null)
  assert.deepEqual(updated[2].likesUsers, [])
  assert.equal(updated[2].isLiked, false)
  assert.deepEqual(updated[2].replies, [3])
  assert.deepEqual(updated[1].replies, [2, 4])
  assert.equal(updated[1].comments, 2)
  assert.equal(updated[3].isLiked, true)
  assert.equal(data[2].content, 'deleted reply')
  assert.deepEqual(removeDeletedCommentIndex({ 1: [2, 4], retweet_1: [2, 4], 9: [10] }, event),
    { 1: [2, 4], retweet_1: [2, 4], 9: [10] })
  const cards = [{ id: 2 }, { id: 3, parentTweetId: 2, parent: { id: 2 } },
    { id: 3, isRetweet: true, parentTweetId: 2, parent: { id: 2 } }]
  const result = removeDeletedTweet(cards, event.id)
  assert.equal(result.length, 2)
  assert.ok(result.every(card => card.parent.id === 2 && card.parentTweetId === 2 && card.parent.deleted))
})

test('deleting the last reply leaves no placeholder or thread index entry', () => {
  const event = { id: 2, keepPlaceholder: false, threads: [{ parent: { id: 1, comments: 0 }, replies: [] }] }
  const updated = removeDeletedCommentData({ 1: { id: 1, replies: [2], comments: 1 },
    2: { id: 2, content: 'reply' } }, event)
  assert.equal(updated[2], undefined)
  assert.equal(updated[1].comments, 0)
  assert.deepEqual(updated[1].replies, [])
  assert.deepEqual(removeDeletedCommentIndex({ 1: [2] }, event), { 1: [] })
})

test('a failed thread refresh preserves the placeholder and its loaded children', () => {
  const event = { id: 2, keepPlaceholder: true, threads: [{ parent: { id: 1, comments: 2 } }] }
  const updated = removeDeletedCommentData({ 1: { id: 1, replies: [2, 4] },
    2: { id: 2, replies: [3], content: 'erase me' }, 3: { id: 3, content: 'kept' } }, event)
  assert.equal(updated[2].deleted, true)
  assert.equal(updated[2].content, null)
  assert.deepEqual(updated[2].replies, [3])
  assert.equal(updated[3].content, 'kept')
  assert.deepEqual(removeDeletedCommentIndex({ 1: [2, 4] }, event), { 1: [2, 4] })
})

test('deleting the final descendant removes empty placeholders up to the root', () => {
  const event = { id: 4, keepPlaceholder: false, threads: [
    { parent: { id: 3, deleted: true, parentTweetId: 2, comments: 0 }, replies: [] },
    { parent: { id: 2, deleted: true, parentTweetId: 1, comments: 0 }, replies: [] },
    { parent: { id: 1, deleted: true, parentTweetId: null, comments: 0 }, replies: [] }
  ] }
  const updated = removeDeletedCommentData({ 1: { id: 1, deleted: true, replies: [2] },
    2: { id: 2, deleted: true, replies: [3] }, 3: { id: 3, deleted: true, replies: [4] },
    4: { id: 4, content: 'last reply' } }, event)
  assert.deepEqual(Object.keys(updated), ['1'])
  assert.equal(updated[1].comments, 0)
  assert.deepEqual(updated[1].replies, [])
  assert.deepEqual(removeDeletedCommentIndex({ 1: [2], retweet_1: [2], 2: [3], 3: [4] }, event),
    { 1: [], retweet_1: [], 2: [], 3: [] })
})
