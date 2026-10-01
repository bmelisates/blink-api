import { test } from 'node:test'
import assert from 'node:assert/strict'
import { probeServer, waitForServer, SERVER_STARTUP_TIMEOUT_MS } from '../src/services/serverReadiness.js'

test('a three-minute cold start continues automatically past the old attempt limit', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let calls = 0
  let ready = false
  const result = waitForServer({ signal: new AbortController().signal,
    probe: async () => { calls++; return ready } })
  for (let elapsed = 0; elapsed < 180000; elapsed += 2500) {
    await Promise.resolve()
    t.mock.timers.tick(2500)
  }
  ready = true
  await Promise.resolve()
  t.mock.timers.tick(2500)
  assert.equal(await result, true)
  assert.ok(calls > 12)
})

test('the startup deadline cancels retries even when the service stays unavailable', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const controller = new AbortController()
  const deadline = setTimeout(() => controller.abort(), SERVER_STARTUP_TIMEOUT_MS)
  let calls = 0
  const result = waitForServer({ signal: controller.signal,
    probe: async () => { calls++; return false } })
  await Promise.resolve()
  t.mock.timers.tick(SERVER_STARTUP_TIMEOUT_MS)
  assert.equal(await result, false)
  const stoppedAt = calls
  t.mock.timers.tick(10000)
  assert.equal(calls, stoppedAt)
  clearTimeout(deadline)
})

test('a waking service retries and continues once ready', async () => {
  let calls = 0
  assert.equal(await waitForServer({ signal: new AbortController().signal, delay: 0,
    probe: async () => ++calls === 3 }), true)
  assert.equal(calls, 3)
})

test('unavailable services stop after the configured attempts', async () => {
  let calls = 0
  assert.equal(await waitForServer({ signal: new AbortController().signal, delay: 0, attempts: 3,
    probe: async () => { calls++; throw new Error('offline') } }), false)
  assert.equal(calls, 3)
})

test('cancellation prevents more probes', async () => {
  const controller = new AbortController()
  let calls = 0
  assert.equal(await waitForServer({ signal: controller.signal, delay: 0,
    probe: async () => { calls++; controller.abort(); return false } }), false)
  assert.equal(calls, 1)
})

test('health requires a successful response with an explicit UP status', async t => {
  const signal = new AbortController().signal
  const fetch = t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ status: 'UP' }) }))
  assert.equal(await probeServer('https://api.example.test/', signal), true)
  assert.equal(fetch.mock.calls[0].arguments[0], 'https://api.example.test/health')
  fetch.mock.mockImplementation(async () => ({ ok: false }))
  assert.equal(await probeServer('https://api.example.test', signal), false)
  fetch.mock.mockImplementation(async () => ({ ok: true, json: async () => ({ status: 'DOWN' }) }))
  assert.equal(await probeServer('https://api.example.test', signal), false)
})
