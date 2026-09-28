import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import LanguageToggle from '../components/LanguageToggle'
import { useTranslation } from '../hooks/useTranslation'
import { useUnreadMessages } from '../hooks/useUnreadMessages'
import { clearSession } from '../services/session'

function Sidebar() {
  const location = useLocation()
  const { t } = useTranslation()
  const unread = useUnreadMessages()

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="sidebar-logo">
          <Logo className="sidebar-logo-base" />
          <Logo className="sidebar-logo-word" />
        </div>
      </div>
      <nav className="nav-menu">
        <Link to="/home" className={`nav-item ${location.pathname === '/home' ? 'active' : ''}`}>{t('sidebar.home')}</Link>
        <Link to="/home" className="nav-item">Bildirimler</Link>
        <Link to="/messages" className={`nav-item ${location.pathname === '/messages' ? 'active' : ''}`}>
          {t('messages.title')}{unread > 0 ? ` (${unread})` : ''}</Link>
        <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>{t('sidebar.profile')}</Link>
        <Link to="/login" replace onClick={() => clearSession()} className="nav-item" style={{marginTop: '10px'}}>{t('sidebar.logout')}</Link>
      </nav>
      <div style={{padding: '0 20px'}}>
        <ThemeToggle />
        <div style={{marginTop: '10px'}}>
          <LanguageToggle />
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
