import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { Building2, ArrowLeft, Mail, Phone, MapPin, Globe, Calendar, CreditCard, Users, ShieldAlert, X, CheckCircle, AlertCircle, XCircle, Clock, ToggleLeft, ToggleRight, ShieldCheck, Plus, Edit2, Trash2 } from 'lucide-react'
import axios from 'axios'

const statusIcon = { active: CheckCircle, trial: Clock, expired: XCircle, suspended: ShieldAlert, cancelled: XCircle }
const statusColor = {
  active: 'text-emerald-600 bg-emerald-50',
  trial: 'text-blue-600 bg-blue-50',
  expired: 'text-red-600 bg-red-50',
  suspended: 'text-amber-600 bg-amber-50',
  cancelled: 'text-secondary-500 bg-secondary-50',
}

const SchoolDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [school, setSchool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [features, setFeatures] = useState([])
  const [featuresLoading, setFeaturesLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showSubEdit, setShowSubEdit] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [subForm, setSubForm] = useState({})

  useEffect(() => { fetchSchool() }, [id])

  useEffect(() => {
    if (id) {
      axios.get(`/api/super-admin/schools/${id}/features`).then(({ data }) => {
        setFeatures(data)
      }).catch(console.error).finally(() => setFeaturesLoading(false))
    }
  }, [id])

  const fetchSchool = async () => {
    try {
      const { data } = await axios.get(`/api/super-admin/schools/${id}`)
      setSchool(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleEdit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const { data } = await axios.put(`/api/super-admin/schools/${id}`, editForm)
      setSchool(data)
      setShowEdit(false)
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  const handleSubEdit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const { data } = await axios.put(`/api/super-admin/schools/${id}/subscription`, subForm)
      setSchool(prev => ({ ...prev, ...data }))
      setShowSubEdit(false)
      fetchSchool()
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  const handleSuspend = async () => {
    if (!confirm('Suspend this school and all its users?')) return
    try {
      await axios.post(`/api/super-admin/schools/${id}/suspend`)
      fetchSchool()
    } catch (err) { console.error(err) }
  }

  const openAddUser = () => {
    setEditingUser(null)
    setUserForm({ name: '', email: '', password: '', role: 'teacher', phone: '' })
    setShowUserModal(true)
  }

  const openEditUser = (u) => {
    setEditingUser(u)
    setUserForm({ name: u.name, email: u.email, role: u.role, phone: u.phone || '', password: '' })
    setShowUserModal(true)
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      if (editingUser) {
        const payload = { ...userForm }
        if (!payload.password) delete payload.password
        await axios.put(`/api/super-admin/schools/${id}/users/${editingUser.id}`, payload)
      } else {
        await axios.post(`/api/super-admin/schools/${id}/users`, userForm)
      }
      setShowUserModal(false)
      fetchSchool()
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  const handleDeleteUser = async (u) => {
    if (!confirm(`Delete user "${u.name}" (${u.email})?`)) return
    try {
      await axios.delete(`/api/super-admin/schools/${id}/users/${u.id}`)
      fetchSchool()
    } catch (err) { console.error(err) }
  }

  const toggleFeature = async (featureKey, currentEnabled) => {
    try {
      await axios.post(`/api/super-admin/schools/${id}/features/toggle`, {
        feature_key: featureKey,
        is_enabled: !currentEnabled,
      })
      setFeatures(prev => prev.map(f =>
        f.feature_key === featureKey ? { ...f, enabled: !currentEnabled, overridden: true } : f
      ))
    } catch (err) { console.error(err) }
  }

  const openEdit = () => {
    setEditForm({
      name: school.name, email: school.email || '', phone: school.phone || '',
      address: school.address || '', is_active: school.is_active,
    })
    setShowEdit(true)
  }

  const openSubEdit = () => {
    setSubForm({
      subscription_plan: school.subscription_plan || 'free',
      subscription_status: school.subscription_status || 'trial',
      subscription_ends_at: school.subscription_ends_at
        ? school.subscription_ends_at.slice(0, 10) : '',
    })
    setShowSubEdit(true)
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
  if (!school) return <div className="text-center py-12 text-secondary-400">School not found</div>

  const StatusIcon = statusIcon[school.subscription_status] || Clock

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/dashboard/super-admin/schools')} className="flex items-center gap-1.5 text-sm text-secondary-500 hover:text-secondary-700">
        <ArrowLeft className="w-4 h-4" /> Back to Schools
      </button>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{school.name}</h1>
            <p className="text-sm text-secondary-500">{school.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openEdit}>Edit School</Button>
          <Button variant="danger" onClick={handleSuspend}>Suspend</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-semibold text-secondary-900 mb-4">School Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-secondary-600">
                <Mail className="w-4 h-4 text-secondary-400" /> {school.email || '—'}
              </div>
              <div className="flex items-center gap-2 text-secondary-600">
                <Phone className="w-4 h-4 text-secondary-400" /> {school.phone || '—'}
              </div>
              <div className="flex items-center gap-2 text-secondary-600">
                <MapPin className="w-4 h-4 text-secondary-400" /> {school.address || '—'}
              </div>
              <div className="flex items-center gap-2 text-secondary-600">
                <Globe className="w-4 h-4 text-secondary-400" /> Locale: {school.locale || 'en'}
              </div>
              <div className="flex items-center gap-2 text-secondary-600">
                <Users className="w-4 h-4 text-secondary-400" /> {school.users_count || 0} users
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium w-fit ${
                school.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {school.is_active ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {school.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-secondary-900">Users</h2>
              <Button variant="primary" size="sm" onClick={openAddUser}><Plus className="w-3.5 h-3.5 mr-1" /> Add User</Button>
            </div>
            {school.users?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-secondary-400 border-b border-secondary-100">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium">Role</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {school.users.map(u => (
                      <tr key={u.id} className="border-b border-secondary-50">
                        <td className="py-2 text-secondary-900">{u.name}</td>
                        <td className="py-2 text-secondary-500">{u.email}</td>
                        <td className="py-2"><span className="capitalize px-2 py-0.5 rounded text-xs bg-primary-50 text-primary-700">{u.role}</span></td>
                        <td className="py-2">
                          <span className={`text-xs ${u.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditUser(u)} className="p-1 hover:bg-secondary-100 rounded text-secondary-400 hover:text-secondary-700"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteUser(u)} className="p-1 hover:bg-red-50 rounded text-secondary-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-secondary-400">No users found</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-secondary-900">Subscription</h2>
              <Button variant="secondary" size="sm" onClick={openSubEdit}>Edit</Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-500">Plan</span>
                <span className="font-medium capitalize text-secondary-900">{school.subscription_plan || 'free'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary-500">Status</span>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[school.subscription_status] || 'bg-secondary-100 text-secondary-600'}`}>
                  <StatusIcon className="w-3 h-3" />
                  {school.subscription_status}
                </span>
              </div>
              {school.subscription_starts_at && (
                <div className="flex justify-between">
                  <span className="text-secondary-500">Started</span>
                  <span className="text-secondary-900">{new Date(school.subscription_starts_at).toLocaleDateString()}</span>
                </div>
              )}
              {school.subscription_ends_at && (
                <div className="flex justify-between">
                  <span className="text-secondary-500">Expires</span>
                  <span className={`font-medium ${new Date(school.subscription_ends_at) < new Date() ? 'text-red-600' : 'text-secondary-900'}`}>
                    {new Date(school.subscription_ends_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-secondary-900">Features</h2>
              <ShieldCheck className="w-4 h-4 text-secondary-400" />
            </div>
            {featuresLoading ? (
              <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" /></div>
            ) : features.length === 0 ? (
              <p className="text-sm text-secondary-400">No features configured globally</p>
            ) : (
              <div className="space-y-2">
                {features.map(f => (
                  <div key={f.feature_key} className="flex items-center justify-between py-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-secondary-900 truncate">{f.display_name}</p>
                      <code className="text-xs text-secondary-400">{f.feature_key}</code>
                    </div>
                    <button
                      onClick={() => toggleFeature(f.feature_key, f.enabled)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ml-2 ${
                        f.enabled
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-secondary-100 text-secondary-500'
                      }`}
                    >
                      {f.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {f.enabled ? 'On' : 'Off'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEdit(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit School</h3>
              <button onClick={() => setShowEdit(false)} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div><label className="label">School Name</label><input className="input" value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} required /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={editForm.email} onChange={e => setEditForm(f => ({...f, email: e.target.value}))} /></div>
              <div><label className="label">Phone</label><input className="input" value={editForm.phone} onChange={e => setEditForm(f => ({...f, phone: e.target.value}))} /></div>
              <div><label className="label">Address</label><textarea className="input" value={editForm.address} onChange={e => setEditForm(f => ({...f, address: e.target.value}))} /></div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm(f => ({...f, is_active: e.target.checked}))} />
                Active
              </label>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setShowEdit(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSubEdit(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Subscription</h3>
              <button onClick={() => setShowSubEdit(false)} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubEdit} className="space-y-4">
              <div><label className="label">Plan</label>
                <select className="input" value={subForm.subscription_plan} onChange={e => setSubForm(f => ({...f, subscription_plan: e.target.value}))}>
                  <option value="free">Free</option><option value="starter">Starter</option><option value="growth">Growth</option><option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div><label className="label">Status</label>
                <select className="input" value={subForm.subscription_status} onChange={e => setSubForm(f => ({...f, subscription_status: e.target.value}))}>
                  <option value="active">Active</option><option value="trial">Trial</option><option value="expired">Expired</option><option value="suspended">Suspended</option><option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div><label className="label">Expiry Date</label><input className="input" type="date" value={subForm.subscription_ends_at} onChange={e => setSubForm(f => ({...f, subscription_ends_at: e.target.value}))} /></div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setShowSubEdit(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SchoolDetail
