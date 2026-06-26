import { useState, useEffect } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import ConfirmDialog from '../components/ConfirmDialog'
import { Users, Search, Plus, X, AlertCircle, CheckCircle, Edit, Eye, User, Download, Upload, Trash2 } from 'lucide-react'
import axios from 'axios'
import { required, email, phone, validateForm } from '../lib/validation'
import LocationFields from '../components/LocationFields'
import PhoneInput from '../components/PhoneInput'

const STUDENT_STATUSES = ['active', 'inactive', 'suspended', 'probation', 'graduated', 'transferred', 'withdrawn', 'expelled', 'on_leave']

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700', inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700', probation: 'bg-amber-100 text-amber-700',
  graduated: 'bg-purple-100 text-purple-700', transferred: 'bg-blue-100 text-blue-700',
  withdrawn: 'bg-orange-100 text-orange-700', expelled: 'bg-red-200 text-red-800',
  on_leave: 'bg-cyan-100 text-cyan-700',
}
const STATUS_LABELS = {
  active: 'Active', inactive: 'Inactive', suspended: 'Suspended', probation: 'Probation',
  graduated: 'Graduated', transferred: 'Transferred', withdrawn: 'Withdrawn',
  expelled: 'Expelled', on_leave: 'On Leave',
}

const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const validateRequired = (v) => v?.trim().length > 0

const AddStudentModal = ({ apiPrefix, onClose, onSaved }) => {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', phone: '', address: '',
    date_of_birth: '', gender: '', national_id: '', religion: '', nationality: '', country: '', city: '', blood_group: '',
    admission_number: '', enrollment_date: '', previous_school: '', sport_house: '', transport_route: '',
    class_id: '', grade: '',
    parent_name: '', parent_phone: '', parent_email: '',
    guardian_name: '', guardian_phone: '', guardian_email: '', guardian_relationship: '',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '',
    medical_info: '', allergies: '',
  })
  const [classes, setClasses] = useState([])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [confirmSave, setConfirmSave] = useState(false)

  useEffect(() => {
    axios.get(`${apiPrefix}/students/classes`).then(({ data }) => setClasses(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const validate = () => {
    const { errors: validationErrors, isValid } = validateForm({
      first_name: { value: form.first_name, rules: [required] },
      last_name: { value: form.last_name, rules: [required] },
      email: { value: form.email, rules: [required, email] },
      password: { value: form.password, rules: [required] },
    })
    const extra = {}
    if (form.password && form.password.length < 6) extra.password = 'Must be at least 6 characters'
    if (!form.class_id) extra.class_id = 'Class is required'
    const phoneChecks = [
      { key: 'phone', val: form.phone },
      { key: 'parent_phone', val: form.parent_phone },
      { key: 'guardian_phone', val: form.guardian_phone },
      { key: 'emergency_contact_phone', val: form.emergency_contact_phone },
    ]
    for (const { key, val } of phoneChecks) {
      if (val) {
        const err = phone(val)
        if (err) extra[key] = err
      }
    }
    const all = { ...validationErrors, ...extra }
    setErrors(all)
    return Object.keys(all).length === 0
  }

  const handleSubmit = async (e) => {
    setConfirmSave(false)
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setServerError('')
    try {
      const payload = { ...form, name: `${form.first_name} ${form.last_name}`, role: 'student' }
      await axios.post(`${apiPrefix}/students`, payload)
      onSaved()
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to create student')
    } finally { setSaving(false) }
  }

  const update = (k, v) => { setForm(p => ({...p, [k]: v})); setErrors(p => ({...p, [k]: undefined})) }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">Add Student</h3>
            <p className="text-sm text-secondary-500">Create student account with full details</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        {serverError && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" /><span>{serverError}</span>
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); setConfirmSave(true) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="First Name *" value={form.first_name} onChange={e => update('first_name', e.target.value)} required />
              {errors.first_name && <p className="text-xs text-red-500 mt-0.5">{errors.first_name}</p>}
            </div>
            <div>
              <Input label="Last Name *" value={form.last_name} onChange={e => update('last_name', e.target.value)} required />
              {errors.last_name && <p className="text-xs text-red-500 mt-0.5">{errors.last_name}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Input label="Email *" type="email" value={form.email} onChange={e => update('email', e.target.value)} required />
              {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
            </div>
            <div>
              <Input label="Password *" value={form.password} onChange={e => update('password', e.target.value)} required />
              {errors.password && <p className="text-xs text-red-500 mt-0.5">{errors.password}</p>}
            </div>
            <div>
              <PhoneInput apiPrefix={apiPrefix} label="Phone" value={form.phone} onChange={v => update('phone', v)} error={errors.phone} />
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
            <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} />
            <Input label="National ID" value={form.national_id} onChange={e => update('national_id', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Religion" value={form.religion} onChange={e => update('religion', e.target.value)} />
            <div>
              <label className="label">Blood Group</label>
              <select className="input" value={form.blood_group} onChange={e => update('blood_group', e.target.value)}>
                <option value="">Select</option>
                <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
              </select>
            </div>
          </div>
          <LocationFields apiPrefix={apiPrefix} values={{ country: form.country, city: form.city, nationality: form.nationality }} onChange={(k, v) => update(k, v)} />
          <Input label="Address" value={form.address} onChange={e => update('address', e.target.value)} />
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-secondary-700 mb-3">Academic Details</p>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Admission Number" value={form.admission_number} onChange={e => update('admission_number', e.target.value)} />
              <Input label="Enrollment Date" type="date" value={form.enrollment_date} onChange={e => update('enrollment_date', e.target.value)} />
              <div>
                <label className="label">Class *</label>
                <select className="input" value={form.class_id} onChange={e => { update('class_id', e.target.value); setErrors(p => ({...p, class_id: undefined})) }}>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.class_id && <p className="text-xs text-red-500 mt-0.5">{errors.class_id}</p>}
              </div>
              <Input label="Grade" value={form.grade} onChange={e => update('grade', e.target.value)} placeholder="e.g. Grade 10" />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <Input label="Previous School" value={form.previous_school} onChange={e => update('previous_school', e.target.value)} />
              <Input label="Sport House" value={form.sport_house} onChange={e => update('sport_house', e.target.value)} />
              <Input label="Transport Route" value={form.transport_route} onChange={e => update('transport_route', e.target.value)} />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-secondary-700 mb-3">Parent / Guardian</p>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Parent Name" value={form.parent_name} onChange={e => update('parent_name', e.target.value)} />
              <div>
                <Input label="Parent Phone" value={form.parent_phone} onChange={e => update('parent_phone', e.target.value)} />
                {errors.parent_phone && <p className="text-xs text-red-500 mt-0.5">{errors.parent_phone}</p>}
              </div>
              <Input label="Parent Email" type="email" value={form.parent_email} onChange={e => update('parent_email', e.target.value)} />
            </div>
            <div className="grid grid-cols-4 gap-4 mt-3">
              <Input label="Guardian Name" value={form.guardian_name} onChange={e => update('guardian_name', e.target.value)} />
              <div>
                <Input label="Guardian Phone" value={form.guardian_phone} onChange={e => update('guardian_phone', e.target.value)} />
                {errors.guardian_phone && <p className="text-xs text-red-500 mt-0.5">{errors.guardian_phone}</p>}
              </div>
              <Input label="Guardian Email" type="email" value={form.guardian_email} onChange={e => update('guardian_email', e.target.value)} />
              <Input label="Relationship" value={form.guardian_relationship} onChange={e => update('guardian_relationship', e.target.value)} />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-secondary-700 mb-3">Emergency Contact</p>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Contact Name" value={form.emergency_contact_name} onChange={e => update('emergency_contact_name', e.target.value)} />
              <div>
                <Input label="Contact Phone" value={form.emergency_contact_phone} onChange={e => update('emergency_contact_phone', e.target.value)} />
                {errors.emergency_contact_phone && <p className="text-xs text-red-500 mt-0.5">{errors.emergency_contact_phone}</p>}
              </div>
              <Input label="Relationship" value={form.emergency_contact_relationship} onChange={e => update('emergency_contact_relationship', e.target.value)} />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-secondary-700 mb-3">Medical Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Medical Info</label>
                <textarea className="input h-20 resize-none" value={form.medical_info} onChange={e => update('medical_info', e.target.value)} />
              </div>
              <div>
                <label className="label">Allergies</label>
                <textarea className="input h-20 resize-none" value={form.allergies} onChange={e => update('allergies', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Creating...' : 'Create Student'}</Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
        <ConfirmDialog
          open={confirmSave}
          onOpenChange={(o) => { if (!o) setConfirmSave(false) }}
          title="Add Student"
          message="Are you sure you want to create this student account?"
          confirmLabel={saving ? 'Saving...' : 'Confirm'}
          onConfirm={handleSubmit}
          loading={saving}
        />
      </Card>
    </div>
  )
}

const EditStudentModal = ({ apiPrefix, student, onClose, onSaved }) => {
  const d = student.student_detail || student.studentDetail || {}
  const nameParts = (student.name || '').split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  const [form, setForm] = useState({
    first_name: student.first_name || firstName, last_name: student.last_name || lastName,
    email: student.email || '', phone: student.phone || '', address: student.address || '',
    date_of_birth: student.date_of_birth ? student.date_of_birth.substring(0, 10) : '',
    gender: student.gender || '', national_id: student.national_id || '',
    religion: student.religion || '', nationality: student.nationality || '', country: student.country || '', city: student.city || '', blood_group: student.blood_group || '',
    admission_number: student.admission_number || '', enrollment_date: student.enrollment_date ? student.enrollment_date.substring(0, 10) : '',
    previous_school: d.previous_school || student.previous_school || '',
    sport_house: d.sport_house || student.sport_house || '',
    transport_route: d.transport_route || student.transport_route || '',
    class_id: student.class_id || d.class_id || '',
    grade: student.grade || '',
    parent_name: d.parent_name || student.parent_name || '',
    parent_phone: d.parent_phone || student.parent_phone || '',
    parent_email: d.parent_email || student.parent_email || '',
    guardian_name: d.guardian_name || student.guardian_name || '',
    guardian_phone: d.guardian_phone || student.guardian_phone || '',
    guardian_email: d.guardian_email || student.guardian_email || '',
    guardian_relationship: d.guardian_relationship || student.guardian_relationship || '',
    emergency_contact_name: d.emergency_contact_name || student.emergency_contact_name || '',
    emergency_contact_phone: d.emergency_contact_phone || student.emergency_contact_phone || '',
    emergency_contact_relationship: d.emergency_contact_relationship || student.emergency_contact_relationship || '',
    medical_info: d.medical_info || student.medical_info || '',
    allergies: d.allergies || student.allergies || '',
    is_active: student.is_active,
  })
  const [classes, setClasses] = useState([])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [confirmSave, setConfirmSave] = useState(false)

  useEffect(() => {
    axios.get(`${apiPrefix}/students/classes`).then(({ data }) => setClasses(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const validate = () => {
    const { errors: validationErrors, isValid } = validateForm({
      first_name: { value: form.first_name, rules: [required] },
      last_name: { value: form.last_name, rules: [required] },
      email: { value: form.email, rules: [required, email] },
    })
    const extra = {}
    if (form.phone) {
      const err = phone(form.phone)
      if (err) extra.phone = err
    }
    const all = { ...validationErrors, ...extra }
    setErrors(all)
    return Object.keys(all).length === 0
  }

  const handleSubmit = async (e) => {
    setConfirmSave(false)
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setServerError('')
    try {
      const payload = { ...form, name: `${form.first_name} ${form.last_name}` }
      await axios.put(`${apiPrefix}/students/${student.id}`, payload)
      onSaved()
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to update student')
    } finally { setSaving(false) }
  }

  const update = (k, v) => { setForm(p => ({...p, [k]: v})); setErrors(p => ({...p, [k]: undefined})) }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">Edit Student</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        {serverError && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" /><span>{serverError}</span>
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); setConfirmSave(true) }} className="space-y-4">
          <div className="flex items-center space-x-4 mb-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => update('is_active', e.target.checked)} className="w-4 h-4 rounded border-secondary-300 text-primary-600" />
              <span className="text-sm font-medium text-secondary-700">Active</span>
            </label>
            <span className="text-xs text-secondary-400">Current status: <strong>{STATUS_LABELS[student.status] || student.status}</strong></span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="First Name *" value={form.first_name} onChange={e => update('first_name', e.target.value)} required />
              {errors.first_name && <p className="text-xs text-red-500 mt-0.5">{errors.first_name}</p>}
            </div>
            <div>
              <Input label="Last Name *" value={form.last_name} onChange={e => update('last_name', e.target.value)} required />
              {errors.last_name && <p className="text-xs text-red-500 mt-0.5">{errors.last_name}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Input label="Email *" type="email" value={form.email} onChange={e => update('email', e.target.value)} required />
              {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
            </div>
            <div>
              <PhoneInput apiPrefix={apiPrefix} label="Phone" value={form.phone} onChange={v => update('phone', v)} error={errors.phone} />
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
              <label className="label">Blood Group</label>
              <select className="input" value={form.blood_group} onChange={e => update('blood_group', e.target.value)}>
                <option value="">Select</option>
                <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Religion" value={form.religion} onChange={e => update('religion', e.target.value)} />
          </div>
          <LocationFields apiPrefix={apiPrefix} values={{ country: form.country, city: form.city, nationality: form.nationality }} onChange={(k, v) => update(k, v)} />
          <Input label="Address" value={form.address} onChange={e => update('address', e.target.value)} />
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-secondary-700 mb-3">Academic Details</p>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Admission Number" value={form.admission_number} onChange={e => update('admission_number', e.target.value)} />
              <Input label="Enrollment Date" type="date" value={form.enrollment_date} onChange={e => update('enrollment_date', e.target.value)} />
              <div>
                <label className="label">Class</label>
                <select className="input" value={form.class_id} onChange={e => update('class_id', e.target.value)}>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Input label="Grade" value={form.grade} onChange={e => update('grade', e.target.value)} placeholder="e.g. Grade 10" />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <Input label="Previous School" value={form.previous_school} onChange={e => update('previous_school', e.target.value)} />
              <Input label="Sport House" value={form.sport_house} onChange={e => update('sport_house', e.target.value)} />
              <Input label="Transport Route" value={form.transport_route} onChange={e => update('transport_route', e.target.value)} />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-secondary-700 mb-3">Parent / Guardian</p>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Parent Name" value={form.parent_name} onChange={e => update('parent_name', e.target.value)} />
              <Input label="Parent Phone" value={form.parent_phone} onChange={e => update('parent_phone', e.target.value)} />
              <Input label="Parent Email" type="email" value={form.parent_email} onChange={e => update('parent_email', e.target.value)} />
            </div>
            <div className="grid grid-cols-4 gap-4 mt-3">
              <Input label="Guardian Name" value={form.guardian_name} onChange={e => update('guardian_name', e.target.value)} />
              <Input label="Guardian Phone" value={form.guardian_phone} onChange={e => update('guardian_phone', e.target.value)} />
              <Input label="Guardian Email" type="email" value={form.guardian_email} onChange={e => update('guardian_email', e.target.value)} />
              <Input label="Relationship" value={form.guardian_relationship} onChange={e => update('guardian_relationship', e.target.value)} />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-secondary-700 mb-3">Emergency Contact</p>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Contact Name" value={form.emergency_contact_name} onChange={e => update('emergency_contact_name', e.target.value)} />
              <Input label="Contact Phone" value={form.emergency_contact_phone} onChange={e => update('emergency_contact_phone', e.target.value)} />
              <Input label="Relationship" value={form.emergency_contact_relationship} onChange={e => update('emergency_contact_relationship', e.target.value)} />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-secondary-700 mb-3">Medical Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Medical Info</label>
                <textarea className="input h-20 resize-none" value={form.medical_info} onChange={e => update('medical_info', e.target.value)} />
              </div>
              <div>
                <label className="label">Allergies</label>
                <textarea className="input h-20 resize-none" value={form.allergies} onChange={e => update('allergies', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save Changes'}</Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
        <ConfirmDialog
          open={confirmSave}
          onOpenChange={(o) => { if (!o) setConfirmSave(false) }}
          title="Update Student"
          message="Are you sure you want to save these changes?"
          confirmLabel={saving ? 'Saving...' : 'Confirm'}
          onConfirm={handleSubmit}
          loading={saving}
        />
      </Card>
    </div>
  )
}

const ViewStudentModal = ({ student, onClose }) => {
  if (!student) return null
  const d = student.student_detail || student.studentDetail || {}

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
          <h3 className="text-lg font-semibold text-secondary-900">Student Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center space-x-4 mb-6 p-4 bg-secondary-50 rounded-lg">
          <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
            <User className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-secondary-900">{student.name}</h4>
            <p className="text-sm text-secondary-500">{student.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Student</span>
              <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[student.status] || 'bg-secondary-100 text-secondary-700'}`}>
                {STATUS_LABELS[student.status] || student.status || 'N/A'}
              </span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-secondary-400">Admission: {student.admission_number || '-'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h5 className="text-xs font-semibold uppercase text-secondary-400 mb-2">Personal Info</h5>
            <InfoRow label="Gender" value={student.gender} />
            <InfoRow label="Date of Birth" value={student.date_of_birth} />
            <InfoRow label="Phone" value={student.phone} />
            <InfoRow label="Address" value={student.address} />
            <InfoRow label="Country" value={student.country} />
            <InfoRow label="City" value={student.city} />
            <InfoRow label="National ID" value={student.national_id} />
            <InfoRow label="Religion" value={student.religion} />
            <InfoRow label="Nationality" value={student.nationality} />
            <InfoRow label="Blood Group" value={student.blood_group} />
          </div>
          <div>
            <h5 className="text-xs font-semibold uppercase text-secondary-400 mb-2">Academic</h5>
            <InfoRow label="Admission #" value={student.admission_number} />
            <InfoRow label="Enrollment Date" value={student.enrollment_date} />
            <InfoRow label="Grade" value={student.class?.name || student.grade || '-'} />
            <InfoRow label="Section" value={student.section?.name || '-'} />
            <InfoRow label="Previous School" value={d.previous_school || student.previous_school} />
            <InfoRow label="Sport House" value={d.sport_house || student.sport_house} />
            <InfoRow label="Transport Route" value={d.transport_route || student.transport_route} />
            <InfoRow label="Status" value={STATUS_LABELS[student.status] || student.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-4">
          <div>
            <h5 className="text-xs font-semibold uppercase text-secondary-400 mb-2">Parent / Guardian</h5>
            {(student.parent?.name || d.parent_name)
              ? <><InfoRow label="Parent Name" value={student.parent?.name || d.parent_name} /><InfoRow label="Parent Phone" value={student.parent?.phone || d.parent_phone} /><InfoRow label="Parent Email" value={student.parent?.email || d.parent_email} /></>
              : <><InfoRow label="Guardian Name" value={d.guardian_name || student.guardian_name} /><InfoRow label="Guardian Phone" value={d.guardian_phone || student.guardian_phone} /><InfoRow label="Guardian Email" value={d.guardian_email || student.guardian_email} /><InfoRow label="Relationship" value={d.guardian_relationship || student.guardian_relationship} /></>
            }
          </div>
          <div>
            <h5 className="text-xs font-semibold uppercase text-secondary-400 mb-2">Emergency Contact</h5>
            <InfoRow label="Name" value={d.emergency_contact_name || student.emergency_contact_name} />
            <InfoRow label="Phone" value={d.emergency_contact_phone || student.emergency_contact_phone} />
            <InfoRow label="Relationship" value={d.emergency_contact_relationship || student.emergency_contact_relationship} />
          </div>
        </div>

        <div className="mt-4">
          <h5 className="text-xs font-semibold uppercase text-secondary-400 mb-2">Medical Information</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-secondary-500 mb-1">Medical Info</p>
              <p className="text-sm text-secondary-700 bg-secondary-50 p-3 rounded-lg">{d.medical_info || student.medical_info || 'None'}</p>
            </div>
            <div>
              <p className="text-xs text-secondary-500 mb-1">Allergies</p>
              <p className="text-sm text-secondary-700 bg-secondary-50 p-3 rounded-lg">{d.allergies || student.allergies || 'None'}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

const ChangeStatusModal = ({ apiPrefix, student, statuses, onClose, onSaved }) => {
  const [status, setStatus] = useState(student.status || 'active')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmSave, setConfirmSave] = useState(false)

  const handleSubmit = async (e) => {
    setConfirmSave(false)
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await axios.put(`${apiPrefix}/students/${student.id}/status`, { status })
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
        <p className="text-sm text-secondary-500 mb-4">Update status for <strong>{student.name}</strong></p>
        {error && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" /><span>{error}</span>
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); setConfirmSave(true) }} className="space-y-4">
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
        <ConfirmDialog
          open={confirmSave}
          onOpenChange={(o) => { if (!o) setConfirmSave(false) }}
          title="Change Status"
          message="Are you sure you want to update this student's status?"
          confirmLabel={saving ? 'Saving...' : 'Confirm'}
          onConfirm={handleSubmit}
          loading={saving}
        />
      </Card>
    </div>
  )
}

const StudentManager = ({ apiPrefix, title, subtitle }) => {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  useEffect(() => { fetchStudents() }, [])

  const handleDownloadTemplate = async () => {
    try {
      const { data, headers } = await axios.get(`${apiPrefix}/students/template/download`, {
        responseType: 'blob',
      })
      const disposition = headers['content-disposition']
      const match = disposition && disposition.match(/filename="?(.+?)"?\s*$/i)
      const name = match ? match[1] : 'student-import-template.xlsx'
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url; a.download = name; a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      let msg = 'Download failed'
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const parsed = JSON.parse(text)
          msg = parsed.message || parsed.error || msg
        } catch {}
      }
      showToast(msg, 'error')
    }
  }

  const handleImportStudents = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await axios.post(`${apiPrefix}/students/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImportResult(data)
      fetchStudents()
      showToast(`Imported ${data.total_imported} student(s)`)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Import failed'
      showToast(msg, 'error')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchStudents = async () => {
    try {
      const { data } = await axios.get(`${apiPrefix}/students`)
      setStudents(Array.isArray(data) ? data : [])
    } catch {
      showToast('Failed to load students', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await axios.delete(`${apiPrefix}/students/${deleteTarget.id}`)
      setDeleteTarget(null)
      showToast('Student deleted')
      fetchStudents()
    } catch (e) {
      showToast('Failed to delete student', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const detail = (s) => s.student_detail || s.studentDetail || {}

  const filtered = students.filter(s => {
    if (statusFilter && s.status !== statusFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return [s.name, s.email, s.phone, s.admission_number, s.grade, s.status, detail(s).class_name]
      .some(f => f?.toLowerCase().includes(q))
  })

  const allStatuses = [...new Set(students.map(s => s.status).filter(Boolean))]

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
        <div className="flex items-center space-x-2">
          <Button variant="secondary" onClick={handleDownloadTemplate}>
            <Download className="w-4 h-4 mr-2" />Template
          </Button>
          <label className="cursor-pointer btn btn-secondary px-4 py-2 text-sm">
            <Upload className="w-4 h-4 mr-2" />{importing ? 'Importing...' : 'Import'}
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportStudents} className="hidden" disabled={importing} />
          </label>
          <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />Add Student</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input type="text" placeholder="Search by name, email, admission #, status..." value={search}
            onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
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
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Student</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Class</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Grade</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Admission #</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Status</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-secondary-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-secondary-900">{s.name}</p>
                        <p className="text-xs text-secondary-500">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-secondary-600">
                    {s.class?.name || '-'}{s.section ? ` / ${s.section.name}` : ''}
                  </td>
                  <td className="py-3 px-4 text-sm text-secondary-600">
                    {s.grade || s.class?.name || '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-secondary-600">
                    {s.admission_number || '-'}
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
                      <button onClick={() => setDeleteTarget(s)}
                        className="p-1.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete student">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="py-12 text-center text-secondary-400"><Users className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No students found</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showAdd && <AddStudentModal apiPrefix={apiPrefix} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); fetchStudents(); showToast('Student created') }} />}
      {editTarget && <EditStudentModal apiPrefix={apiPrefix} student={editTarget} onClose={() => setEditTarget(null)} onSaved={() => { setEditTarget(null); fetchStudents(); showToast('Student updated') }} />}
      {viewTarget && <ViewStudentModal student={viewTarget} onClose={() => setViewTarget(null)} />}
      {statusTarget && (
        <ChangeStatusModal
          apiPrefix={apiPrefix} student={statusTarget}
          statuses={STUDENT_STATUSES}
          onClose={() => setStatusTarget(null)}
          onSaved={() => { setStatusTarget(null); fetchStudents(); showToast('Status updated') }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        title="Delete Student"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}

export default StudentManager
