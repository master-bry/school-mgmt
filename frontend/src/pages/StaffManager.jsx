import { useState, useEffect } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { Users, Search, Plus, X, AlertCircle, CheckCircle, GraduationCap, BadgeCheck, Trash2, Edit, Eye, BookOpen, Wallet, FileText, User, ShieldAlert } from 'lucide-react'
import axios from 'axios'

const STAFF_ROLES = ['teacher', 'academician', 'cashier', 'secretary']
const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'intern']

const ROLE_ICONS = { teacher: GraduationCap, academician: BookOpen, cashier: Wallet, secretary: FileText }
const ROLE_COLORS = { teacher: 'bg-blue-100 text-blue-700', academician: 'bg-purple-100 text-purple-700', cashier: 'bg-emerald-100 text-emerald-700', secretary: 'bg-amber-100 text-amber-700' }

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700', inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700', probation: 'bg-amber-100 text-amber-700',
  terminated: 'bg-red-200 text-red-800', resigned: 'bg-orange-100 text-orange-700',
  retired: 'bg-purple-100 text-purple-700', on_leave: 'bg-blue-100 text-blue-700',
}
const STATUS_LABELS = {
  active: 'Active', inactive: 'Inactive', suspended: 'Suspended', probation: 'Probation',
  terminated: 'Terminated', resigned: 'Resigned', retired: 'Retired', on_leave: 'On Leave',
}

const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const validateRequired = (v) => v?.trim().length > 0

const AddStaffModal = ({ apiPrefix, onClose, onSaved }) => {
  const [form, setForm] = useState({
    role: 'teacher', name: '', email: '', password: '', phone: '', address: '',
    gender: '', national_id: '', religion: '', nationality: '', blood_group: '',
    marital_status: '', employee_code: '', date_of_birth: '',
    employment_type: '', department: '', qualification: '', years_experience: '', previous_employer: '', date_joined: '',
    emergency_contact: '', emergency_phone: '', emergency_relationship: '',
    salary: '', bank_name: '', bank_account: '', bank_code: '', tax_id: '', notes: '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const errs = {}
    if (!validateRequired(form.name)) errs.name = 'Name is required'
    if (!validateRequired(form.email)) errs.email = 'Email is required'
    else if (!validateEmail(form.email)) errs.email = 'Invalid email format'
    if (!validateRequired(form.password)) errs.password = 'Password is required'
    else if (form.password.length < 6) errs.password = 'Min 6 characters'
    if (form.phone && !/^[\d\s\+\-\(\)]{7,20}$/.test(form.phone)) errs.phone = 'Invalid phone number'
    if (form.years_experience && (isNaN(form.years_experience) || form.years_experience < 0)) errs.years_experience = 'Must be 0 or more'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setServerError('')
    try {
      await axios.post(`${apiPrefix}/staff`, form)
      onSaved()
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to create staff')
    } finally { setSaving(false) }
  }

  const update = (k, v) => { setForm(p => ({...p, [k]: v})); setErrors(p => ({...p, [k]: undefined})) }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">Add Staff Member</h3>
            <p className="text-sm text-secondary-500">Create staff account with full details</p>
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
            <div>
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={e => update('role', e.target.value)}>
                {STAFF_ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <Input label="Employee Code" value={form.employee_code} onChange={e => update('employee_code', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Full Name *" value={form.name} onChange={e => update('name', e.target.value)} required />
              {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
            </div>
            <div>
              <Input label="Email *" type="email" value={form.email} onChange={e => update('email', e.target.value)} required />
              {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Input label="Password *" value={form.password} onChange={e => update('password', e.target.value)} required />
              {errors.password && <p className="text-xs text-red-500 mt-0.5">{errors.password}</p>}
            </div>
            <div>
              <Input label="Phone" value={form.phone} onChange={e => update('phone', e.target.value)} />
              {errors.phone && <p className="text-xs text-red-500 mt-0.5">{errors.phone}</p>}
            </div>
            <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => update('gender', e.target.value)}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <Input label="National ID" value={form.national_id} onChange={e => update('national_id', e.target.value)} />
            <div>
              <label className="label">Marital Status</label>
              <select className="input" value={form.marital_status} onChange={e => update('marital_status', e.target.value)}>
                <option value="">Select</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Religion" value={form.religion} onChange={e => update('religion', e.target.value)} />
            <Input label="Nationality" value={form.nationality} onChange={e => update('nationality', e.target.value)} />
          </div>
          <Input label="Address" value={form.address} onChange={e => update('address', e.target.value)} />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Employment Type</label>
              <select className="input" value={form.employment_type} onChange={e => update('employment_type', e.target.value)}>
                <option value="">Select</option>
                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <Input label="Department" value={form.department} onChange={e => update('department', e.target.value)} />
            <Input label="Date Joined" type="date" value={form.date_joined} onChange={e => update('date_joined', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Qualification" value={form.qualification} onChange={e => update('qualification', e.target.value)} />
            <div>
              <Input label="Years Experience" type="number" value={form.years_experience} onChange={e => update('years_experience', e.target.value)} />
              {errors.years_experience && <p className="text-xs text-red-500 mt-0.5">{errors.years_experience}</p>}
            </div>
            <Input label="Previous Employer" value={form.previous_employer} onChange={e => update('previous_employer', e.target.value)} />
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-secondary-700 mb-3">Emergency Contact</p>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Contact Name" value={form.emergency_contact} onChange={e => update('emergency_contact', e.target.value)} />
              <Input label="Contact Phone" value={form.emergency_phone} onChange={e => update('emergency_phone', e.target.value)} />
              <Input label="Relationship" value={form.emergency_relationship} onChange={e => update('emergency_relationship', e.target.value)} />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-secondary-700 mb-3">Compensation & Bank Details</p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Input label="Base Salary ($)" type="number" value={form.salary} onChange={e => update('salary', e.target.value)} />
              <Input label="Bank Name" value={form.bank_name} onChange={e => update('bank_name', e.target.value)} />
              <Input label="Account Number" value={form.bank_account} onChange={e => update('bank_account', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Bank Code" value={form.bank_code} onChange={e => update('bank_code', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tax ID" value={form.tax_id} onChange={e => update('tax_id', e.target.value)} />
            <div></div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input h-20 resize-none" value={form.notes} onChange={e => update('notes', e.target.value)} />
          </div>
          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Creating...' : 'Create Staff'}</Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

const EditStaffModal = ({ apiPrefix, staff, onClose, onSaved }) => {
  const d = staff.teacher_detail || staff.teacherDetail || {}
  const [form, setForm] = useState({
    name: staff.name || '', email: staff.email || '',
    phone: staff.phone || '', address: staff.address || '',
    gender: staff.gender || '', national_id: staff.national_id || '',
    religion: staff.religion || '', nationality: staff.nationality || '', blood_group: staff.blood_group || '',
    marital_status: staff.marital_status || '', employee_code: staff.employee_code || '',
    date_of_birth: staff.date_of_birth ? staff.date_of_birth.substring(0, 10) : '',
    is_active: staff.is_active,
    employment_type: d.employment_type || '', department: d.department || '',
    qualification: d.qualification || '', years_experience: d.years_experience || '', previous_employer: d.previous_employer || '',
    date_joined: d.date_joined ? d.date_joined.substring(0, 10) : '',
    emergency_contact: d.emergency_contact || '', emergency_phone: d.emergency_phone || '', emergency_relationship: d.emergency_relationship || '',
    bank_name: d.bank_name || '', bank_account: d.bank_account || '', bank_code: d.bank_code || '',
    salary: d.salary || '', tax_id: d.tax_id || '', notes: d.notes || '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const errs = {}
    if (!validateRequired(form.name)) errs.name = 'Name is required'
    if (!validateRequired(form.email)) errs.email = 'Email is required'
    else if (!validateEmail(form.email)) errs.email = 'Invalid email format'
    if (form.phone && !/^[\d\s\+\-\(\)]{7,20}$/.test(form.phone)) errs.phone = 'Invalid phone number'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setServerError('')
    try {
      await axios.put(`${apiPrefix}/staff/${staff.id}`, form)
      onSaved()
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to update staff')
    } finally { setSaving(false) }
  }

  const update = (k, v) => { setForm(p => ({...p, [k]: v})); setErrors(p => ({...p, [k]: undefined})) }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">Edit Staff</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        {serverError && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" /><span>{serverError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-4 mb-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => update('is_active', e.target.checked)} className="w-4 h-4 rounded border-secondary-300 text-primary-600" />
              <span className="text-sm font-medium text-secondary-700">Active</span>
            </label>
            <span className="text-xs text-secondary-400">Current status: <strong>{STATUS_LABELS[staff.status] || staff.status}</strong></span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Employee Code" value={form.employee_code} onChange={e => update('employee_code', e.target.value)} />
            <div>
              <Input label="Full Name *" value={form.name} onChange={e => update('name', e.target.value)} required />
              {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Email *" type="email" value={form.email} onChange={e => update('email', e.target.value)} required />
              {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
            </div>
            <div>
              <Input label="Phone" value={form.phone} onChange={e => update('phone', e.target.value)} />
              {errors.phone && <p className="text-xs text-red-500 mt-0.5">{errors.phone}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => update('gender', e.target.value)}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <Input label="National ID" value={form.national_id} onChange={e => update('national_id', e.target.value)} />
            <div>
              <label className="label">Marital Status</label>
              <select className="input" value={form.marital_status} onChange={e => update('marital_status', e.target.value)}>
                <option value="">Select</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Religion" value={form.religion} onChange={e => update('religion', e.target.value)} />
            <Input label="Nationality" value={form.nationality} onChange={e => update('nationality', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Address" value={form.address} onChange={e => update('address', e.target.value)} />
            <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Employment Type</label>
              <select className="input" value={form.employment_type} onChange={e => update('employment_type', e.target.value)}>
                <option value="">Select</option>
                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <Input label="Department" value={form.department} onChange={e => update('department', e.target.value)} />
            <Input label="Date Joined" type="date" value={form.date_joined} onChange={e => update('date_joined', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Qualification" value={form.qualification} onChange={e => update('qualification', e.target.value)} />
            <Input label="Years Experience" type="number" value={form.years_experience} onChange={e => update('years_experience', e.target.value)} />
            <Input label="Previous Employer" value={form.previous_employer} onChange={e => update('previous_employer', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Emergency Contact" value={form.emergency_contact} onChange={e => update('emergency_contact', e.target.value)} />
            <Input label="Emergency Phone" value={form.emergency_phone} onChange={e => update('emergency_phone', e.target.value)} />
            <Input label="Relationship" value={form.emergency_relationship} onChange={e => update('emergency_relationship', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Base Salary ($)" type="number" value={form.salary} onChange={e => update('salary', e.target.value)} />
            <Input label="Bank Name" value={form.bank_name} onChange={e => update('bank_name', e.target.value)} />
            <Input label="Account Number" value={form.bank_account} onChange={e => update('bank_account', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Bank Code" value={form.bank_code} onChange={e => update('bank_code', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tax ID" value={form.tax_id} onChange={e => update('tax_id', e.target.value)} />
            <div></div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input h-20 resize-none" value={form.notes} onChange={e => update('notes', e.target.value)} />
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

const ViewStaffModal = ({ staff, onClose }) => {
  if (!staff) return null
  const d = staff.teacher_detail || staff.teacherDetail || {}

  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-secondary-100 last:border-0">
      <span className="text-sm text-secondary-500">{label}</span>
      <span className="text-sm font-medium text-secondary-900">{value || '-'}</span>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">Staff Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center space-x-4 mb-6 p-4 bg-secondary-50 rounded-lg">
          <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
            <User className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-secondary-900">{staff.name}</h4>
            <p className="text-sm text-secondary-500">{staff.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${ROLE_COLORS[staff.role] || 'bg-secondary-100 text-secondary-700'}`}>
                {staff.role?.charAt(0).toUpperCase() + staff.role?.slice(1)}
              </span>
              <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[staff.status] || 'bg-secondary-100 text-secondary-700'}`}>
                {STATUS_LABELS[staff.status] || staff.status || 'N/A'}
              </span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-secondary-400">Code: {staff.employee_code || '-'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h5 className="text-xs font-semibold uppercase text-secondary-400 mb-2">Personal Info</h5>
            <InfoRow label="Gender" value={staff.gender} />
            <InfoRow label="National ID" value={staff.national_id} />
            <InfoRow label="Religion" value={staff.religion} />
            <InfoRow label="Nationality" value={staff.nationality} />
            <InfoRow label="Marital Status" value={staff.marital_status} />
            <InfoRow label="Date of Birth" value={staff.date_of_birth} />
            <InfoRow label="Phone" value={staff.phone} />
            <InfoRow label="Address" value={staff.address} />
          </div>
          <div>
            <h5 className="text-xs font-semibold uppercase text-secondary-400 mb-2">Employment</h5>
            <InfoRow label="Employee Code" value={staff.employee_code} />
            <InfoRow label="Type" value={d.employment_type} />
            <InfoRow label="Department" value={d.department} />
            <InfoRow label="Qualification" value={d.qualification} />
            <InfoRow label="Years Exp." value={d.years_experience} />
            <InfoRow label="Previous Employer" value={d.previous_employer} />
            <InfoRow label="Date Joined" value={d.date_joined} />
            <InfoRow label="Status" value={STATUS_LABELS[staff.status] || staff.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-4">
          <div>
            <h5 className="text-xs font-semibold uppercase text-secondary-400 mb-2">Emergency Contact</h5>
            <InfoRow label="Name" value={d.emergency_contact} />
            <InfoRow label="Phone" value={d.emergency_phone} />
            <InfoRow label="Relationship" value={d.emergency_relationship} />
          </div>
          <div>
            <h5 className="text-xs font-semibold uppercase text-secondary-400 mb-2">Compensation</h5>
            <InfoRow label="Salary" value={d.salary ? `$${Number(d.salary).toLocaleString()}` : '-'} />
            <InfoRow label="Salary Approved" value={d.salary_approved_by ? 'Yes' : 'No'} />
            <InfoRow label="Bonus" value={d.bonus ? `$${Number(d.bonus).toLocaleString()}` : '-'} />
            <InfoRow label="Bonus Approved" value={d.bonus_approved_by ? 'Yes' : 'No'} />
          </div>
        </div>

        {(d.bank_name || d.bank_account || d.tax_id) && (
          <div className="mt-4">
            <h5 className="text-xs font-semibold uppercase text-secondary-400 mb-2">Bank Details</h5>
            <div className="grid grid-cols-3 gap-4">
              <InfoRow label="Bank" value={d.bank_name} />
              <InfoRow label="Account" value={d.bank_account} />
              <InfoRow label="Code" value={d.bank_code} />
            </div>
            <InfoRow label="Tax ID" value={d.tax_id} />
          </div>
        )}

        {d.notes && (
          <div className="mt-4">
            <h5 className="text-xs font-semibold uppercase text-secondary-400 mb-2">Notes</h5>
            <p className="text-sm text-secondary-700 bg-secondary-50 p-3 rounded-lg">{d.notes}</p>
          </div>
        )}
      </Card>
    </div>
  )
}

const ChangeStatusModal = ({ apiPrefix, staff, statuses, onClose, onSaved }) => {
  const [status, setStatus] = useState(staff.status || 'active')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await axios.put(`${apiPrefix}/staff/${staff.id}/status`, { status })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">Change Status</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-secondary-500 mb-4">Update status for <strong>{staff.name}</strong></p>
        {error && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" /><span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Status</label>
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              {statuses.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s] || s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Updating...' : 'Update Status'}</Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

const StaffManager = ({ apiPrefix, title, subtitle }) => {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [staffStatuses, setStaffStatuses] = useState([])

  useEffect(() => { fetchStaff() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${apiPrefix}/staff/list`)
      setStaff(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete staff member "${name}"?`)) return
    try {
      await axios.delete(`${apiPrefix}/staff/${id}`)
      showToast('Staff deleted')
      fetchStaff()
    } catch (e) { showToast('Failed to delete', 'error') }
  }

  const handleApproveSalary = async (id) => {
    try {
      await axios.post(`${apiPrefix}/staff/${id}/approve-salary`)
      showToast('Salary approved')
      fetchStaff()
    } catch (e) { showToast('Approval failed', 'error') }
  }

  const handleApproveBonus = async (id) => {
    try {
      await axios.post(`${apiPrefix}/staff/${id}/approve-bonus`)
      showToast('Bonus approved')
      fetchStaff()
    } catch (e) { showToast('Approval failed', 'error') }
  }

  const detail = (s) => s.teacher_detail || s.teacherDetail || {}

  const filtered = staff.filter(s => {
    if (roleFilter && s.role !== roleFilter) return false
    if (statusFilter && s.status !== statusFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return [s.name, s.email, s.phone, s.role, s.employee_code, s.gender, detail(s).department, detail(s).employment_type, s.status]
      .some(f => f?.toLowerCase().includes(q))
  })

  const allStatuses = [...new Set(staff.map(s => s.status).filter(Boolean))]

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
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />Add Staff</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input type="text" placeholder="Search by name, email, role, code, status..." value={search}
            onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <select className="input w-40" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {STAFF_ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <select className="input w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {allStatuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
        </select>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200 bg-secondary-50/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Staff</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Role</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Dept / Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Salary</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Bonus</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Status</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filtered.map(s => {
                const d = detail(s)
                const salaryApproved = d.salary_approved_by
                const bonusApproved = d.bonus_approved_by
                const Icon = ROLE_ICONS[s.role] || GraduationCap
                return (
                  <tr key={s.id} className="hover:bg-secondary-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{s.name}</p>
                          <p className="text-xs text-secondary-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[s.role] || 'bg-secondary-100 text-secondary-700'}`}>
                        {s.role?.charAt(0).toUpperCase() + s.role?.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-secondary-600">
                      {[d.department, d.employment_type].filter(Boolean).join(' / ') || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-secondary-900">{d.salary ? `$${Number(d.salary).toLocaleString()}` : '-'}</span>
                        {d.salary && (
                          salaryApproved
                            ? <BadgeCheck className="w-4 h-4 text-emerald-500" />
                            : <button onClick={() => handleApproveSalary(s.id)} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Approve</button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-secondary-900">{d.bonus ? `$${Number(d.bonus).toLocaleString()}` : '-'}</span>
                        {d.bonus && (
                          bonusApproved
                            ? <BadgeCheck className="w-4 h-4 text-emerald-500" />
                            : <button onClick={() => handleApproveBonus(s.id)} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Approve</button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => setStatusTarget(s)} className="hover:opacity-80">
                        <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[s.status] || 'bg-secondary-100 text-secondary-700'}`}>
                          {STATUS_LABELS[s.status] || s.status || 'N/A'}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => setViewTarget(s)}
                          className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="View details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditTarget(s)}
                          className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(s.id, s.name)}
                          className="p-1.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="py-12 text-center text-secondary-400"><Users className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No staff found</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showAdd && <AddStaffModal apiPrefix={apiPrefix} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); fetchStaff(); showToast('Staff created') }} />}
      {editTarget && <EditStaffModal apiPrefix={apiPrefix} staff={editTarget} onClose={() => setEditTarget(null)} onSaved={() => { setEditTarget(null); fetchStaff(); showToast('Staff updated') }} />}
      {viewTarget && <ViewStaffModal staff={viewTarget} onClose={() => setViewTarget(null)} />}
      {statusTarget && (
        <ChangeStatusModal
          apiPrefix={apiPrefix} staff={statusTarget}
          statuses={['active', 'inactive', 'suspended', 'probation', 'terminated', 'resigned', 'retired', 'on_leave']}
          onClose={() => setStatusTarget(null)}
          onSaved={() => { setStatusTarget(null); fetchStaff(); showToast('Status updated') }}
        />
      )}
    </div>
  )
}

export default StaffManager
