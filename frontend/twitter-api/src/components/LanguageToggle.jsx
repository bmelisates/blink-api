import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import './LanguageToggle.css'

function LanguageToggle() {
  const { language, changeLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'tr', name: 'Türkçe', label: 'TR' },
    { code: 'en', name: 'English', label: 'EN' }
  ]

  const currentLang = languages.find(lang => lang.code === language) || languages[0]

  return (
    <div className="language-toggle">
      <button
        className="lang-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="lang-label">{currentLang.label}</span>
        <span className={`lang-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="lang-dropdown-menu">
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`lang-dropdown-item ${lang.code === language ? 'active' : ''}`}
              onClick={() => {
                changeLanguage(lang.code)
                setIsOpen(false)
              }}
            >
              <span className="lang-label">{lang.label}</span>
              <span className="lang-name">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageToggle
