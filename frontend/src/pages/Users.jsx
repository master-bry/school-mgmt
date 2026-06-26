import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import ConfirmDialog from '../components/ConfirmDialog'
import { required, email, minLength, validateForm } from '../lib/validation'
import { Users as UsersIcon, Edit2, Trash2, Plus, X, Search, AlertCircle } from 'lucide-react'
import axios from 'axios'
import PhoneInput from '../components/PhoneInput'

const roleColors = {
  admin: 'bg-purple-100 text-purple-700',
  teacher: 'bg-blue-100 text-blue-700',
  student: 'bg-emerald-100 text-emerald-700',
  parent: 'bg-orange-100 text-orange-700',
  academician: 'bg-indigo-100 text-indigo-700',
  cashier: 'bg-amber-100 text-amber-700',
  head_of_school: 'bg-rose-100 text-rose-700',
  assistant_head: 'bg-cyan-100 text-cyan-700',
  secretary: 'bg-pink-100 text-pink-700',
}

const UserForm = ({ user: editingUser, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', password_confirmation: '',
    role: 'student', phone: '', address: '', date_of_birth: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name,
        email: editingUser.email,
        password: '',
        password_confirmation: '',
        role: editingUser.role,
        phone: editingUser.phone || '',
        address: editingUser.address || '',
        date_of_birth: editingUser.date_of_birth || '',
      })
    }
  }, [editingUser])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const rules = {
      name: { value: formData.name, rules: [required] },
      email: { value: formData.email, rules: [required, email] },
    }
    if (!editingUser) {
      rules.password = { value: formData.password, rules: [required, minLength(8)] }
    }
    if (formData.password && editingUser) {
      rules.password = { value: formData.password, rules: [minLength(8)] }
    }
    const { isValid, errors: validationErrors } = validateForm(rules)
    const extra = {}
    if (formData.password && formData.password !== formData.password_confirmation) {
      extra.password_confirmation = 'Passwords do not match'
    }
    const all = { ...validationErrors, ...extra }
    setErrors(all)
    if (!isValid || Object.keys(extra).length > 0) return
    setSaving(true)
    setError('')
    try {
      if (editingUser) {
        const payload = { ...formData }
        if (!payload.password) delete payload.password
        delete payload.password_confirmation
        await axios.put(`/api/admin/users/${editingUser.id}`, payload)
      } else {
        await axios.post('/api/admin/users', formData)
      }
      onSaved()
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        const msgs = Object.values(data.errors).flat()
        setError(msgs.join('\n'))
      } else {
        setError(data?.message || 'Failed to save user')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {editingUser ? 'Update user details' : 'Create a new user account'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700 whitespace-pre-wrap">{error}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input label="Full Name *" type="text" value={formData.name}
              onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors(p => ({...p, name: undefined})) }} required
              placeholder="Enter full name" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <Input label="Email *" type="email" value={formData.email}
              onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setErrors(p => ({...p, email: undefined})) }}
              required placeholder="Enter email address" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <Input label={editingUser ? 'New Password (leave blank to keep)' : 'Password *'}
              type="password" value={formData.password}
              onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setErrors(p => ({...p, password: undefined})) }}
              required={!editingUser} placeholder={editingUser ? 'Leave blank to keep current' : 'Min 8 characters'} />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <div>
            <Input label="Confirm Password *" type="password" value={formData.password_confirmation}
              onChange={(e) => { setFormData({ ...formData, password_confirmation: e.target.value }); setErrors(p => ({...p, password_confirmation: undefined})) }}
              required={!editingUser} placeholder="Confirm password" />
            {errors.password_confirmation && <p className="text-xs text-red-500 mt-1">{errors.password_confirmation}</p>}
          </div>

          <div>
            <label className="label">Role</label>
            <select className="input" value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })} required>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              <option value="academician">Academician</option>
              <option value="cashier">Cashier</option>
              <option value="head_of_school">Head of School</option>
              <option value="assistant_head">Assistant Head</option>
              <option value="secretary">Secretary</option>
            </select>
          </div>

          <PhoneInput apiPrefix="/api" label="Phone" value={formData.phone}
            onChange={v => setFormData({ ...formData, phone: v })} />

          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={2} value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter address" />
          </div>

          <Input label="Date of Birth" type="date" value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />

          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

const Users = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!user) return
    if (user.role !== 'admin') {
      navigate('/dashboard')
      return
    }
    fetchUsers()
  }, [user])

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get('/api/admin/users')
      setUsers(response.data.data || response.data || [])
    } catch (err) {
      setError('Failed to load users. Make sure you have admin access.')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await axios.delete(`/api/admin/users/${deleteTarget.id}`)
      setDeleteTarget(null)
      fetchUsers()
    } catch (err) {
      setError('Failed to delete user')
      console.error('Error deleting user:', err)
    } finally {
      setDeleting(false)
    }
  }

  const openCreate = () => {
    setEditingUser(null)
    setShowForm(true)
  }

  const openEdit = (u) => {
    setEditingUser(u)
    setShowForm(true)
  }

  const filteredUsers = users.filter(u =>
    !searchTerm || [u.name, u.email, u.role].some(f =>
      f?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sm text-secondary-500 mb-1">
            <UsersIcon className="w-4 h-4" />
            <span>User Management</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Users</h1>
          <p className="text-secondary-500 mt-0.5">Manage all users in your school</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
        <input type="text" placeholder="Search by name, email, or role..."
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10 max-w-md" />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200 bg-secondary-50/50">
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">User</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Email</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Role</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Status</th>
                <th className="text-right py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-secondary-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        roleColors[u.role] || 'bg-secondary-100 text-secondary-600'
                      }`}>
                        <span className="text-sm font-semibold">{u.name?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-secondary-900">{u.name}</p>
                        <p className="text-xs text-secondary-400">ID: {u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-secondary-600">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      roleColors[u.role] || 'bg-secondary-100 text-secondary-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center space-x-1.5 ${
                      u.is_active ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        u.is_active ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                      <span className="text-xs font-medium">{u.is_active ? 'Active' : 'Inactive'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button onClick={() => openEdit(u)}
                      className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit user">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(u)}
                      className="p-2 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                      title="Delete user">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <UsersIcon className="w-8 h-8 text-secondary-300 mx-auto mb-2" />
                    <p className="text-sm text-secondary-500">{searchTerm ? 'No users match your search' : 'No users found'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <UserForm
          user={editingUser}
          onClose={() => { setShowForm(false); setEditingUser(null) }}
          onSaved={() => { setShowForm(false); setEditingUser(null); fetchUsers() }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}

export default Users
