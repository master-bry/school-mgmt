import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'
import { GraduationCap } from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(formData.email, formData.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || t('login.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900">{t('login.title')}</h1>
          <p className="text-secondary-600 mt-2">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('login.email_label')} type="email" value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required placeholder={t('login.email_placeholder')} />
          <Input label={t('login.password_label')} type="password" value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required placeholder={t('login.password_placeholder')} />
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{t('login.signing_in')}</span>
              </span>
            ) : t('login.sign_in')}
          </Button>
        </form>

        <p className="text-center text-secondary-600 mt-6">
          {t('login.no_account')}{' '}
          <Link to="/register" className="text-primary-600 hover:underline">{t('login.register_link')}</Link>
        </p>
      </Card>
    </div>
  )
}

export default Login
