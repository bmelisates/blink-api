import { useRef, useState } from 'react'
import { saveSession } from '../services/session'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import './Login.css'
import api from '../services/api'
import { useForm } from '../hooks/useForm'
import Logo from '../components/Logo'
import LanguageToggle from '../components/LanguageToggle'
import { useTranslation } from '../hooks/useTranslation'

function Login() {
  // Sayfa yönlendirmesi için kullanıyoruz.
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [pending, setPending] = useState(false)
  const submitting = useRef(false)

  // Formdaki username ve password değerlerini yönetiyoruz.
  const { formData, handleChange } = useForm({
    username: '',
    password: '',
  })

  // Form submit edildiğinde çalışan fonksiyon.
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setPending(true)
    try {
      const response = await api.post('/auth/login', formData)
      saveSession(response.data)
      toast.success(t('auth.loginSuccess'))
      navigate('/home', { replace: true })
    } catch (error) {
      const key = !error.response ? 'auth.connectionError'
        : error.response.status === 401 ? 'auth.invalidCredentials' : 'auth.loginFailed'
      toast.error(t(key))
    } finally {
      submitting.current = false
      setPending(false)
    }
  }
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="auth-language-toggle">
          <LanguageToggle />
        </div>
        <div className="login-logo">
          <Logo className="logo-image" />
        </div>

        <h1 className="login-title">{t('auth.loginTitle')}</h1>
        <p className="login-subtitle">{t('auth.loginSubtitle')}</p>

        <form className="login-form" onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="username">{t('auth.username')}</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={t('auth.usernamePlaceholder')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('auth.passwordPlaceholder')}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={pending}>
            {pending ? t('common.loading') : t('auth.login')}
          </button>
        </form>

        <div className="login-footer">
          <p>{t('auth.noAccount')}</p>
          <Link to="/register" className="register-link">{t('auth.registerLink')}</Link>
        </div>
      </div>
    </div>
  )
}

export default Login
