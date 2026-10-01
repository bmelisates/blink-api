export async function probeServer(baseUrl, signal) {
  if (!baseUrl) throw new Error('API URL is missing')
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/health`, {
    signal, cache: 'no-store'
  })
  if (!response.ok) return false
  const data = await response.json()
  return data.status === 'UP'
}

// Only the read-only health request is retried, never login or other mutations.
export async function waitForServer({ probe, signal, delay = 2500, attempts = 12, onAttempt = () => {} }) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (signal.aborted) return false
    onAttempt(attempt)
    try {
      if (await probe(signal)) return !signal.aborted
    } catch {
      if (signal.aborted) return false
    }
    if (attempt + 1 < attempts) {
      await new Promise(resolve => {
        const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve() }
        const timer = setTimeout(finish, delay)
        signal.addEventListener('abort', finish, { once: true })
        if (signal.aborted) finish()
      })
    }
  }
  return false
}
