import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import './Register.css'
import api from '../services/api'
import { useForm } from '../hooks/useForm'
import Logo from '../components/Logo'
import LanguageToggle from '../components/LanguageToggle'
import { useTranslation } from '../hooks/useTranslation'

function Register() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { formData, handleChange } = useForm({
    username: '',
    email: '',
    password: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    api.post('/users/register', formData)
      .then(() => {
        toast.success(t('auth.registrationSuccess'))
        navigate('/login')
      })
      .catch(error => {
        console.error('Error registering user:', error)

        const errorMessage = error.response?.data?.message?.toLowerCase() || ''

        if (error.response?.status === 409 && errorMessage.includes('username')) {
          toast.error(t('auth.usernameAlreadyExists'))
        } else if (error.response?.status === 409 && errorMessage.includes('email')) {
          toast.error(t('auth.emailAlreadyExists'))
        } else if (!error.response) {
          toast.error(t('auth.connectionError'))
        } else {
          toast.error(error.response?.data?.message || t('auth.registrationFailed'))
        }
      })
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="auth-language-toggle">
          <LanguageToggle />
        </div>
        <div className="register-logo">
          <Logo className="logo-image" />
        </div>

        <h1 className="register-title">{t('auth.registerTitle')}</h1>
        <p className="register-subtitle">{t('auth.registerSubtitle')}</p>

        <form className="register-form" onSubmit={handleSubmit}>

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
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('auth.emailPlaceholder')}
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
              placeholder={t('auth.passwordHint')}
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="register-btn">
            {t('auth.register')}
          </button>
        </form>

        <div className="register-footer">
          <p>{t('auth.hasAccount')}</p>
          <Link to="/login" className="login-link">{t('auth.loginLink')}</Link>
        </div>
      </div>
    </div>
  )
}

export default Register
