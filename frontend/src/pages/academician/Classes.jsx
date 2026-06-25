import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import ConfirmDialog from '../../components/ConfirmDialog'
import { BookOpen, Plus, X, Search, AlertCircle, Edit2, Trash2, CheckCircle, BookMarked } from 'lucide-react'
import axios from 'axios'

const ClassModal = ({ onClose, onSaved, classData: existingClass, subjects: allSubjects }) => {
  const isEdit = !!existingClass
  const [form, setForm] = useState({
    name: existingClass?.name || '',
    section: existingClass?.section || '',
    capacity: existingClass?.capacity || '',
    room_number: existingClass?.room_number || '',
  })
  const [selectedSubjects, setSelectedSubjects] = useState(
    existingClass?.subjects?.map(s => s.id.toString()) || []
  )
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Class name is required'
    if (form.capacity && (isNaN(form.capacity) || parseInt(form.capacity) < 1))
      errs.capacity = 'Capacity must be at least 1'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setSaving(true)
    try {
      if (isEdit) {
        await axios.put(`/api/academician/classes/${existingClass.id}`, form)
        if (selectedSubjects.length > 0) {
          await axios.post('/api/academician/classes/assign-subjects', {
            class_id: existingClass.id,
            subject_ids: selectedSubjects,
          })
        }
      } else {
        await axios.post('/api/academician/classes', form)
      }
      onSaved()
    } catch (err) {
      setServerError(err.response?.data?.message || (isEdit ? 'Failed to update class' : 'Failed to create class'))
    } finally { setSaving(false) }
  }

  const toggleSubject = (id) => {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">{isEdit ? 'Edit Class' : 'Add Class'}</h3>
            <p className="text-sm text-secondary-500 mt-0.5">{isEdit ? 'Update class details and subjects' : 'Create a new class'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {serverError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">{serverError}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Class Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Grade 10" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <Input label="Section" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="e.g. A" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Capacity" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="Max students" />
              {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}
            </div>
            <Input label="Room Number" value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} placeholder="e.g. Room 101" />
          </div>

          {isEdit && allSubjects?.length > 0 && (
            <div>
              <label className="label">Assign Subjects</label>
              <div className="max-h-32 overflow-y-auto border border-secondary-200 rounded-lg p-2 space-y-1">
                {allSubjects.map(s => (
                  <label key={s.id} className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-secondary-50 cursor-pointer">
                    <input type="checkbox" checked={selectedSubjects.includes(s.id.toString())}
                      onChange={() => toggleSubject(s.id.toString())}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-secondary-700">{s.name} ({s.code || 'N/A'})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Saving...' : isEdit ? 'Update Class' : 'Create Class'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

const AcademicianClasses = () => {
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editClass, setEditClass] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchAll() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [clsRes, subRes] = await Promise.all([
        axios.get('/api/academician/classes'),
        axios.get('/api/academician/subjects'),
      ])
      setClasses(Array.isArray(clsRes.data) ? clsRes.data : clsRes.data.data || [])
      setSubjects(Array.isArray(subRes.data) ? subRes.data : subRes.data.data || [])
    } catch (e) { console.error('Failed to fetch:', e) }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(confirmDelete)
    try {
      await axios.delete(`/api/academician/classes/${confirmDelete}`)
      setConfirmDelete(null)
      setClasses(prev => prev.filter(c => c.id !== confirmDelete))
      showToast('Class deleted')
    } catch (e) { showToast('Failed to delete', 'error') }
    finally { setDeleting(null) }
  }

  const handleEdit = async (c) => {
    try {
      const { data } = await axios.get(`/api/academician/classes/${c.id}/subjects`)
      setEditClass({ ...c, subjects: Array.isArray(data) ? data : [] })
    } catch {
      setEditClass(c)
    }
  }

  const filtered = classes.filter(c =>
    !searchTerm || [c.name, c.section, c.room_number].some(f =>
      f?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

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
          <div className="flex items-center space-x-2 text-sm text-secondary-500 mb-1">
            <BookOpen className="w-4 h-4" /><span>Academician</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Classes</h1>
          <p className="text-secondary-500 mt-0.5">Create and manage classes with subject assignments</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-2" />Add Class</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
        <input type="text" placeholder="Search by name, section, or room..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input pl-10 max-w-md" />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200 bg-secondary-50/50">
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Name</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Section</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Room</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Capacity</th>
                <th className="text-right py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-secondary-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-primary-600" />
                      </div>
                      <p className="text-sm font-medium text-secondary-900">{c.name}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-secondary-600">{c.section || '-'}</td>
                  <td className="py-3.5 px-4 text-sm text-secondary-600">{c.room_number || '-'}</td>
                  <td className="py-3.5 px-4 text-sm text-secondary-600">{c.capacity || '-'}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-end space-x-1">
                      <button onClick={() => handleEdit(c)}
                        className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(c.id)} disabled={deleting === c.id}
                        className="p-1.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <BookOpen className="w-8 h-8 text-secondary-300 mx-auto mb-2" />
                    <p className="text-sm text-secondary-500">{searchTerm ? 'No classes match your search' : 'No classes found'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {(showModal || editClass) && (
        <ClassModal
          onClose={() => { setShowModal(false); setEditClass(null) }}
          onSaved={() => { setShowModal(false); setEditClass(null); fetchAll(); showToast(editClass ? 'Class updated' : 'Class created') }}
          classData={editClass}
          subjects={subjects}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}
        title="Delete Class"
        message="Are you sure you want to delete this class?"
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        loading={!!deleting}
      />
    </div>
  )
}

export default AcademicianClasses