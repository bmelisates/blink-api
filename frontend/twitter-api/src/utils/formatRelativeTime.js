export const formatRelativeTime = (dateValue, language = 'tr', now = Date.now()) => {
  const timestamp = Date.parse(dateValue)
  if (Number.isNaN(timestamp)) return null

  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000))
  const suffix = language === 'tr' ? 'önce' : 'ago'
  if (seconds < 60) return language === 'tr' ? 'şimdi' : 'now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return language === 'tr' ? `${minutes} dakika ${suffix}` : `${minutes}m ${suffix}`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return language === 'tr' ? `${hours} saat ${suffix}` : `${hours}h ${suffix}`

  const days = Math.floor(hours / 24)
  if (days < 7) return language === 'tr' ? `${days} gün ${suffix}` : `${days}d ${suffix}`

  const weeks = Math.floor(days / 7)
  return language === 'tr' ? `${weeks} hafta ${suffix}` : `${weeks}w ${suffix}`
}
