import { useState, useEffect } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { Users, Search, Plus, X, AlertCircle, CheckCircle, GraduationCap, DollarSign, BadgeCheck, Trash2, Edit } from 'lucide-react'
import axios from 'axios'

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'intern']

const AddTeacherModal = ({ apiPrefix, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', address: '',
    employment_type: '', qualification: '', date_joined: '',
    emergency_contact: '', emergency_phone: '',
    bank_name: '', bank_account: '', bank_code: '', tax_id: '', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setServerError('')
    try {
      await axios.post(`${apiPrefix}/teachers`, form)
      onSaved()
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to create teacher')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">Add Teacher</h3>
            <p className="text-sm text-secondary-500">Create teacher account with full details</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        {serverError && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" /><span>{serverError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            <Input label="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <Input label="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Employment Type</label>
              <select className="input" value={form.employment_type} onChange={e => setForm({...form, employment_type: e.target.value})}>
                <option value="">Select</option>
                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <Input label="Qualification" value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})} />
            <Input label="Date Joined" type="date" value={form.date_joined} onChange={e => setForm({...form, date_joined: e.target.value})} />
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-secondary-700 mb-3">Emergency Contact</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contact Name" value={form.emergency_contact} onChange={e => setForm({...form, emergency_contact: e.target.value})} />
              <Input label="Contact Phone" value={form.emergency_phone} onChange={e => setForm({...form, emergency_phone: e.target.value})} />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-secondary-700 mb-3">Bank Details</p>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Bank Name" value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})} />
              <Input label="Account Number" value={form.bank_account} onChange={e => setForm({...form, bank_account: e.target.value})} />
              <Input label="Bank Code" value={form.bank_code} onChange={e => setForm({...form, bank_code: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tax ID" value={form.tax_id} onChange={e => setForm({...form, tax_id: e.target.value})} />
            <div></div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input h-20 resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Creating...' : 'Create Teacher'}</Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

const EditTeacherModal = ({ apiPrefix, teacher, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: teacher.name || '',
    email: teacher.email || '',
    phone: teacher.phone || '',
    address: teacher.address || '',
    is_active: teacher.is_active,
    employment_type: teacher.teacher_detail?.employment_type || teacher.teacherDetail?.employment_type || '',
    qualification: teacher.teacher_detail?.qualification || teacher.teacherDetail?.qualification || '',
    date_joined: teacher.teacher_detail?.date_joined ? teacher.teacher_detail.date_joined.substring(0, 10) : teacher.teacherDetail?.date_joined?.substring(0, 10) || '',
    emergency_contact: teacher.teacher_detail?.emergency_contact || teacher.teacherDetail?.emergency_contact || '',
    emergency_phone: teacher.teacher_detail?.emergency_phone || teacher.teacherDetail?.emergency_phone || '',
    bank_name: teacher.teacher_detail?.bank_name || teacher.teacherDetail?.bank_name || '',
    bank_account: teacher.teacher_detail?.bank_account || teacher.teacherDetail?.bank_account || '',
    bank_code: teacher.teacher_detail?.bank_code || teacher.teacherDetail?.bank_code || '',
    tax_id: teacher.teacher_detail?.tax_id || teacher.teacherDetail?.tax_id || '',
    notes: teacher.teacher_detail?.notes || teacher.teacherDetail?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setServerError('')
    try {
      await axios.put(`${apiPrefix}/teachers/${teacher.id}`, form)
      onSaved()
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to update teacher')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">Edit Teacher</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        {serverError && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" /><span>{serverError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 rounded border-secondary-300 text-primary-600" />
              <span className="text-sm font-medium text-secondary-700">Active</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <Input label="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Employment Type</label>
              <select className="input" value={form.employment_type} onChange={e => setForm({...form, employment_type: e.target.value})}>
                <option value="">Select</option>
                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <Input label="Qualification" value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})} />
            <Input label="Date Joined" type="date" value={form.date_joined} onChange={e => setForm({...form, date_joined: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Emergency Contact" value={form.emergency_contact} onChange={e => setForm({...form, emergency_contact: e.target.value})} />
            <Input label="Emergency Phone" value={form.emergency_phone} onChange={e => setForm({...form, emergency_phone: e.target.value})} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Bank Name" value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})} />
            <Input label="Account Number" value={form.bank_account} onChange={e => setForm({...form, bank_account: e.target.value})} />
            <Input label="Bank Code" value={form.bank_code} onChange={e => setForm({...form, bank_code: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tax ID" value={form.tax_id} onChange={e => setForm({...form, tax_id: e.target.value})} />
            <div></div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input h-20 resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save Changes'}</Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

const TeacherManager = ({ apiPrefix, title, subtitle }) => {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchTeachers() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchTeachers = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${apiPrefix}/teachers`)
      setTeachers(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete teacher "${name}"?`)) return
    try {
      await axios.delete(`${apiPrefix}/teachers/${id}`)
      showToast('Teacher deleted')
      fetchTeachers()
    } catch (e) { showToast('Failed to delete', 'error') }
  }

  const handleApproveSalary = async (id) => {
    try {
      await axios.post(`${apiPrefix}/teachers/${id}/approve-salary`)
      showToast('Salary approved')
      fetchTeachers()
    } catch (e) { showToast('Approval failed', 'error') }
  }

  const handleApproveBonus = async (id) => {
    try {
      await axios.post(`${apiPrefix}/teachers/${id}/approve-bonus`)
      showToast('Bonus approved')
      fetchTeachers()
    } catch (e) { showToast('Approval failed', 'error') }
  }

  const detail = (t) => t.teacher_detail || t.teacherDetail || {}

  const filtered = teachers.filter(t =>
    !search || [t.name, t.email, t.phone, detail(t).employment_type].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`px-4 py-3 rounded-lg border text-sm flex items-center space-x-2 ${
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>
          <p className="text-secondary-500 mt-0.5">{subtitle}</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />Add Teacher</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
        <input type="text" placeholder="Search by name, email, type..." value={search}
          onChange={e => setSearch(e.target.value)} className="input pl-10" />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200 bg-secondary-50/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Teacher</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Salary</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Bonus</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Status</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filtered.map(t => {
                const d = detail(t)
                const salaryApproved = d.salary_approved_by
                const bonusApproved = d.bonus_approved_by
                return (
                  <tr key={t.id} className="hover:bg-secondary-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{t.name}</p>
                          <p className="text-xs text-secondary-500">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-secondary-600 capitalize">{d.employment_type || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-secondary-900">{d.salary ? `$${Number(d.salary).toLocaleString()}` : '-'}</span>
                        {d.salary && (
                          salaryApproved
                            ? <BadgeCheck className="w-4 h-4 text-emerald-500" />
                            : <button onClick={() => handleApproveSalary(t.id)} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Approve</button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-secondary-900">{d.bonus ? `$${Number(d.bonus).toLocaleString()}` : '-'}</span>
                        {d.bonus && (
                          bonusApproved
                            ? <BadgeCheck className="w-4 h-4 text-emerald-500" />
                            : <button onClick={() => handleApproveBonus(t.id)} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Approve</button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${
                        t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>{t.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => setEditTarget(t)}
                          className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id, t.name)}
                          className="p-1.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="py-12 text-center text-secondary-400"><Users className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No teachers found</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showAdd && <AddTeacherModal apiPrefix={apiPrefix} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); fetchTeachers(); showToast('Teacher created') }} />}
      {editTarget && <EditTeacherModal apiPrefix={apiPrefix} teacher={editTarget} onClose={() => setEditTarget(null)} onSaved={() => { setEditTarget(null); fetchTeachers(); showToast('Teacher updated') }} />}
    </div>
  )
}

export default TeacherManager