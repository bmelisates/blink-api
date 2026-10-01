import { useEffect, useState } from 'react'
import { probeServer, waitForServer, SERVER_STARTUP_TIMEOUT_MS } from '../services/serverReadiness'
import { useTranslation } from '../hooks/useTranslation'
import LanguageToggle from './LanguageToggle'
import Logo from './Logo'
import './ServerReadyGate.css'

export default function ServerReadyGate({ children }) {
  const [status, setStatus] = useState('connecting')
  const [retry, setRetry] = useState(0)
  const { language } = useTranslation()
  const english = language === 'en'

  useEffect(() => {
    const controller = new AbortController()
    const slow = setTimeout(() => setStatus('warming'), 3000)
    const deadline = setTimeout(() => controller.abort(), SERVER_STARTUP_TIMEOUT_MS)
    let mounted = true
    waitForServer({
      signal: controller.signal,
      probe: async signal => {
        const request = new AbortController()
        const abort = () => request.abort()
        signal.addEventListener('abort', abort, { once: true })
        if (signal.aborted) request.abort()
        const timeout = setTimeout(abort, 10000)
        try {
          return await probeServer(import.meta.env.VITE_API_URL, request.signal)
        } finally {
          clearTimeout(timeout)
          signal.removeEventListener('abort', abort)
        }
      }
    }).then(ready => {
      clearTimeout(slow)
      clearTimeout(deadline)
      if (mounted) setStatus(ready ? 'ready' : 'unavailable')
    })
    return () => {
      mounted = false
      clearTimeout(slow)
      clearTimeout(deadline)
      controller.abort()
    }
  }, [retry])

  if (status === 'ready') return children
  const failed = status === 'unavailable'
  return <main className="server-ready-page">
    <section className="server-ready-card" aria-busy={!failed}>
      <LanguageToggle />
      <Logo className="server-ready-logo" />
      <div role="status" aria-live="polite">
        <h1>{failed ? (english ? 'We could not connect' : 'Şu an bağlantı kurulamadı')
          : status === 'warming' ? (english ? 'Getting Blink ready' : 'Blink hazırlanıyor')
            : (english ? 'Connecting to Blink' : 'Blink’e bağlanılıyor')}</h1>
        <p>{failed
          ? (english ? 'The service is taking longer than expected or is temporarily unavailable. You can try again.' : 'Hizmet beklenenden uzun sürede açılıyor veya geçici olarak kullanılamıyor. Yeniden deneyebilirsin.')
          : (english ? 'This portfolio app uses free hosting. Waking the server can take several minutes. We will keep trying for up to 5 minutes and continue automatically when it is ready. You do not need to refresh the page.' : 'Bu portfolyo uygulaması ücretsiz sunucuda çalışıyor. Sunucunun uyanması birkaç dakika sürebilir. 5 dakikaya kadar bağlantıyı denemeye devam edip hazır olduğunda otomatik ilerleyeceğiz. Sayfayı yenilemene gerek yok.')}</p>
      </div>
      {failed ? <button onClick={() => { setStatus('connecting'); setRetry(value => value + 1) }}>
        {english ? 'Try again' : 'Yeniden dene'}</button>
        : <div className="server-ready-spinner" aria-hidden="true" />}
    </section>
  </main>
}
