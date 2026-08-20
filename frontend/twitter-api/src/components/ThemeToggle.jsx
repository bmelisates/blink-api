import useTheme from '../hooks/useTheme'
import './ThemeToggle.css'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
    </button>
  )
}
