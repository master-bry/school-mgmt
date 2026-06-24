import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { User, Lock, Save, Camera, Mail, Phone, MapPin, Cake } from 'lucide-react'
import axios from 'axios'

const Profile = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    date_of_birth: user?.date_of_birth || '',
    profile_image: user?.profile_image || '',
  })

  const [password, setPassword] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 4000)
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await axios.put('/api/profile', profile)
      showMessage(res.data.message)
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    if (password.password !== password.password_confirmation) {
      showMessage('Passwords do not match', 'error')
      setSaving(false)
      return
    }
    try {
      const res = await axios.put('/api/password', password)
      showMessage(res.data.message)
      setPassword({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to change password', 'error')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Profile Settings</h1>
        <p className="text-secondary-500 mt-1">Manage your personal information and security</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-lg border text-sm ${
          message.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex space-x-1 bg-secondary-100 rounded-lg p-1 w-fit">
        {[
          { id: 'profile', label: 'Personal Info', icon: User },
          { id: 'password', label: 'Password', icon: Lock },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-secondary-500 hover:text-secondary-700'
            }`}>
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <Card>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="flex items-center space-x-5 pb-6 border-b border-secondary-100">
              <div className="relative group">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                  {profile.profile_image ? (
                    <img src={profile.profile_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{getInitials(profile.name)}</span>
                  )}
                </div>
                <button type="button" onClick={() => {
                  const url = window.prompt('Enter image URL:')
                  if (url) setProfile({ ...profile, profile_image: url })
                }}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center
                           shadow-md border border-secondary-200 text-secondary-600 hover:text-primary-600
                           hover:border-primary-300 transition-all opacity-0 group-hover:opacity-100">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <p className="font-semibold text-secondary-900 text-lg">{user?.name}</p>
                <div className="flex items-center space-x-1 text-sm text-secondary-500 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{user?.email}</span>
                </div>
                <p className="text-xs text-secondary-400 capitalize mt-0.5">{user?.role} · {user?.school?.name || 'No school'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" type="text" value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })} required
                placeholder="Enter your full name" />
              <Input label="Email" type="email" value={user?.email || ''} disabled
                placeholder="Email cannot be changed" />
              <Input label="Phone" type="tel" value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="Enter phone number" icon={Phone} />
              <Input label="Date of Birth" type="date" value={profile.date_of_birth}
                onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })} icon={Cake} />
            </div>

            <div>
              <label className="label">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-secondary-400" />
                <textarea className="input pl-10" rows={2} value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Enter your address" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {tab === 'password' && (
        <Card>
          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
            <div>
              <h3 className="text-base font-semibold text-secondary-900">Change Password</h3>
              <p className="text-sm text-secondary-500 mt-0.5">Ensure your account is secure with a strong password</p>
            </div>
            <div className="space-y-4">
              <Input label="Current Password" type="password" value={password.current_password}
                onChange={(e) => setPassword({ ...password, current_password: e.target.value })}
                required placeholder="Enter current password" />
              <Input label="New Password" type="password" value={password.password}
                onChange={(e) => setPassword({ ...password, password: e.target.value })}
                required placeholder="At least 8 characters" />
              <Input label="Confirm New Password" type="password" value={password.password_confirmation}
                onChange={(e) => setPassword({ ...password, password_confirmation: e.target.value })}
                required placeholder="Re-enter new password" />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Updating...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}

export default Profile
