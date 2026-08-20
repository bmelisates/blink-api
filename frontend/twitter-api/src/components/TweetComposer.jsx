import { useState } from 'react'
import api from '../services/api'
import { formatTweet } from '../utils/formatTweet'
import { useTranslation } from '../hooks/useTranslation'

export default function TweetComposer({ onCreated }) {
  const [content, setContent] = useState('')
  const { t } = useTranslation()

  const submit = async () => {
    const trimmedContent = content.trim()
    if (!trimmedContent) return

    try {
      const response = await api.post('/tweets', { content: trimmedContent })
      onCreated(formatTweet(response.data))
      setContent('')
    } catch (error) {
      console.error('Error creating tweet:', error)
    }
  }

  return (
    <div className="tweet-input-container">
      <textarea
        className="tweet-input"
        placeholder={t('home.tweetInput')}
        value={content}
        onChange={event => setContent(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submit()
          }
        }}
      />
      <button className="tweet-btn" onClick={submit}>
        {t('home.tweetButton')}
      </button>
    </div>
  )
}
