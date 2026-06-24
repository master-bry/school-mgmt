import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'
import { GraduationCap } from 'lucide-react'
import axios from 'axios'

const Register = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
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
      setError('Passwords do not match')
      return
    }

    try {
      await register(formData)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900">School Management</h1>
          <p className="text-secondary-600 mt-2">Create your student account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" type="text" value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required placeholder="Enter your full name" />
          <Input label="Email" type="email" value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required placeholder="Enter your email" />
          <div>
            <label className="label">School (Optional)</label>
            <select className="input" value={formData.school_code}
              onChange={(e) => setFormData({ ...formData, school_code: e.target.value })}>
              <option value="">No school affiliation</option>
              {schools.map(s => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <Input label="Phone (Optional)" type="tel" value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter your phone number" />
          <Input label="Date of Birth (Optional)" type="date" value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
          <Input label="Password" type="password" value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required placeholder="Enter your password" />
          <Input label="Confirm Password" type="password" value={formData.password_confirmation}
            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
            required placeholder="Confirm your password" />
          <Button type="submit" className="w-full">Register</Button>
        </form>

        <p className="text-center text-secondary-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline">Sign In</Link>
        </p>
      </Card>
    </div>
  )
}

export default Register
