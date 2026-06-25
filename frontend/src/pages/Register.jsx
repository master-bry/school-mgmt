import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'
import { GraduationCap } from 'lucide-react'
import axios from 'axios'

const Register = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    date_of_birth: '',
    school_code: '',
  })
  const [error, setError] = useState('')
  const [schools, setSchools] = useState([])

  useEffect(() => {
    axios.get('/api/schools').then(r => setSchools(r.data)).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.password_confirmation) {
      setError(t('register.password_mismatch'))
      return
    }

    try {
      await register(formData)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || t('register.failed'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900">{t('register.title')}</h1>
          <p className="text-secondary-600 mt-2">{t('register.subtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('register.name_label')} type="text" value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required placeholder={t('register.name_placeholder')} />
          <Input label={t('register.email_label')} type="email" value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required placeholder={t('register.email_placeholder')} />
          <div>
            <label className="label">{t('register.school_label')}</label>
            <select className="input" value={formData.school_code}
              onChange={(e) => setFormData({ ...formData, school_code: e.target.value })}>
              <option value="">{t('register.no_school')}</option>
              {schools.map(s => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <Input label={t('register.phone_label')} type="tel" value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder={t('register.phone_placeholder')} />
          <Input label={t('register.dob_label')} type="date" value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
          <Input label={t('register.password_label')} type="password" value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required placeholder={t('register.password_placeholder')} />
          <Input label={t('register.confirm_label')} type="password" value={formData.password_confirmation}
            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
            required placeholder={t('register.confirm_placeholder')} />
          <Button type="submit" className="w-full">{t('register.button')}</Button>
        </form>

        <p className="text-center text-secondary-600 mt-6">
          {t('register.has_account')}{' '}
          <Link to="/login" className="text-primary-600 hover:underline">{t('register.sign_in')}</Link>
        </p>
      </Card>
    </div>
  )
}

export default Register
