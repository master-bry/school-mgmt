import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { Building2, Plus, Mail, Phone, MapPin, Search, X, CheckCircle, AlertCircle } from 'lucide-react'
import axios from 'axios'

const Schools = () => {
  const navigate = useNavigate()
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', subscription_plan: 'free' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchSchools() }, [])

  const fetchSchools = async () => {
    try {
      const { data } = await axios.get('/api/super-admin/schools')
      setSchools(data.data || data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await axios.post('/api/super-admin/schools', form)
      setShowModal(false); setForm({ name: '', email: '', phone: '', address: '', subscription_plan: 'free' })
      fetchSchools()
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  const filtered = schools.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Schools</h1>
          <p className="text-secondary-500 text-sm">Manage all tenant schools</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-1" /> Add School</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
        <input className="input pl-9" placeholder="Search schools..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(school => (
          <Card key={school.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/dashboard/super-admin/schools/${school.id}`)}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                school.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {school.is_active ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {school.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h3 className="font-semibold text-secondary-900 truncate">{school.name}</h3>
            <p className="text-xs text-secondary-500 mb-2">{school.code}</p>
            <div className="space-y-1 text-xs text-secondary-500">
              {school.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{school.email}</p>}
              {school.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{school.phone}</p>}
            </div>
            <div className="mt-3 pt-3 border-t border-secondary-100 flex justify-between text-xs">
              <span className="capitalize px-2 py-0.5 rounded bg-primary-50 text-primary-700">
                {school.subscription_plan || 'free'}
              </span>
              <span className="text-secondary-400">{school.users_count || 0} users</span>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-secondary-400">
            <Building2 className="w-12 h-12 mx-auto mb-2" />
            <p>No schools found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New School</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="School Name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
              <Input label="Email" type="email" icon={Mail} value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
              <Input label="Phone" icon={Phone} value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
              <div><label className="label">Address</label><textarea className="input" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} /></div>
              <div><label className="label">Subscription Plan</label>
                <select className="input" value={form.subscription_plan} onChange={e => setForm(f => ({...f, subscription_plan: e.target.value}))}>
                  <option value="free">Free</option><option value="starter">Starter</option><option value="growth">Growth</option><option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create School'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Schools
