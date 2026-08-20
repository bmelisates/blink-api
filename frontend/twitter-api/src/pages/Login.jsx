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

  // Formdaki username ve password değerlerini yönetiyoruz.
  const { formData, handleChange } = useForm({
    username: '',
    password: '',
  })

  // Form submit edildiğinde çalışan fonksiyon.
  const handleSubmit = (e) => {
    e.preventDefault()

    // Backende login isteği gönderiyoruz.
    api.post('/auth/login', formData)
      .then(response => {

        // Backendten gelen Token ve userId'yi localStorage'a kaydediyoruz.
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('userId', response.data.userId)
        
        // Kullanıcı bilgilerini almak için backende istek atıyoruz.
        api.get(`/users/${response.data.userId}`)
          .then(userResponse => {
            localStorage.setItem('username', userResponse.data.username)
            toast.success(t('auth.loginSuccess'))
            navigate('/home')
          })
          .catch(error => {
            console.error('Error fetching user info:', error)
            // İstek başarısız olursa formdaki username'i kullanıyoruz
            localStorage.setItem('username', formData.username)
            toast.success(t('auth.loginSuccess'))
            navigate('/home')
          })
      })
      .catch(error => {
        // Login başarısızsa hata mesajı gösteriyoruz
        console.error('Error logging in:', error)
        toast.error(t('auth.invalidCredentials'))
      })
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

          <button type="submit" className="login-btn">
            {t('auth.login')}
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
