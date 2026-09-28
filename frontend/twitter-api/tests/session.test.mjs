import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { clearSession, saveSession, getSessionToken, getActiveSessionToken,
  tokenExpiresAt, subscribeSession } from '../src/services/session.js'

beforeEach(() => {
  const storage = new Map()
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key),
  }
  globalThis.window = new EventTarget()
})

function token(claims) {
  return `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`
}

test('logout removes credentials but preserves language and theme', () => {
  localStorage.setItem('language', 'tr')
  localStorage.setItem('theme', 'dark')
  saveSession({ token: 'old', userId: 2, username: 'melis' })
  clearSession()
  for (const key of ['token', 'userId', 'username']) assert.equal(localStorage.getItem(key), null)
  assert.equal(localStorage.getItem('language'), 'tr')
  assert.equal(localStorage.getItem('theme'), 'dark')
})

test('late unauthorized response cannot clear a newly established session', () => {
  saveSession({ token: 'new', userId: 3, username: 'ayse' })
  clearSession('old')
  assert.equal(getSessionToken(), 'new')
  clearSession('new')
  assert.equal(getSessionToken(), null)
})

test('expired, malformed and legacy tokens cannot open protected pages', () => {
  for (const value of ['broken', token({ sub: '42', exp: 1, type: 'access-v2' }),
    token({ sub: '42', exp: Date.now() / 1000 + 300 })]) {
    localStorage.setItem('token', value)
    assert.equal(getActiveSessionToken(), null)
  }
})

test('valid token exposes its expiry for the session timer', () => {
  const exp = Math.floor(Date.now() / 1000) + 300
  const value = token({ sub: '42', type: 'access-v2', tokenVersion: 0, exp })
  localStorage.setItem('token', value)
  assert.equal(tokenExpiresAt(value), exp * 1000)
  assert.equal(getActiveSessionToken(), value)
})

test('session subscribers receive login, logout and other-tab changes', () => {
  let events = 0
  const unsubscribe = subscribeSession(() => events++)
  saveSession({ token: 'one', userId: 1, username: 'one' })
  clearSession()
  window.dispatchEvent(new Event('storage'))
  assert.equal(events, 3)
  unsubscribe()
  clearSession()
  assert.equal(events, 3)
})
