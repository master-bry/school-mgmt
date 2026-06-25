import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import ConfirmDialog from '../components/ConfirmDialog'
import { BookOpen, Edit2, Trash2, Plus, X, Users, School, User, MapPin, Hash } from 'lucide-react'
import axios from 'axios'
import { required, min, maxLength, validateForm } from '../lib/validation'

const ClassForm = ({ cls: editingClass, teachers, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    name: '', section: '', teacher_id: '', capacity: 40, room_number: '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingClass) {
      setFormData({
        name: editingClass.name,
        section: editingClass.section || '',
        teacher_id: editingClass.teacher_id || '',
        capacity: editingClass.capacity || 40,
        room_number: editingClass.room_number || '',
      })
    }
  }, [editingClass])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { errors: validationErrors, isValid } = validateForm({
      name: { value: formData.name, rules: [required] },
      capacity: { value: formData.capacity, rules: [min(1)] },
      room_number: { value: formData.room_number, rules: [maxLength(20)] },
    })
    setErrors(validationErrors)
    if (!isValid) return
    setSaving(true)
    try {
      if (editingClass) {
        await axios.put(`/api/admin/classes/${editingClass.id}`, formData)
      } else {
        await axios.post('/api/admin/classes', formData)
      }
      onSaved()
    } catch (error) {
      console.error('Error saving class:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {editingClass ? 'Update class details' : 'Create a new class'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input label="Class Name *" type="text" value={formData.name}
              onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors(p => ({...p, name: undefined})) }}
              required placeholder="e.g. Grade 10" icon={BookOpen} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <Input label="Section" type="text" value={formData.section}
            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            placeholder="e.g. A" icon={Hash} />

          <div>
            <label className="label">Class Teacher</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <select className="input pl-10" value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}>
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Input label="Capacity *" type="number" min="1" value={formData.capacity}
              onChange={(e) => { setFormData({ ...formData, capacity: e.target.value }); setErrors(p => ({...p, capacity: undefined})) }} icon={Users} />
            {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}
          </div>

          <div>
            <Input label="Room Number" type="text" value={formData.room_number}
              onChange={(e) => { setFormData({ ...formData, room_number: e.target.value }); setErrors(p => ({...p, room_number: undefined})) }}
              placeholder="e.g. 201" icon={MapPin} />
            {errors.room_number && <p className="text-xs text-red-500 mt-1">{errors.room_number}</p>}
          </div>

          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Saving...' : (editingClass ? 'Update Class' : 'Create Class')}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

const Classes = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      navigate('/dashboard')
      return
    }
    fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      const endpoint = isAdmin ? '/api/admin/classes' : '/api/teacher/classes'
      const [classesRes, teachersRes] = await Promise.all([
        axios.get(endpoint),
        isAdmin ? axios.get('/api/admin/users') : Promise.resolve({ data: [] }),
      ])
      setClasses(classesRes.data)
      if (isAdmin) {
        setTeachers((teachersRes.data.data || teachersRes.data || []).filter(u => u.role === 'teacher'))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await axios.delete(`/api/admin/classes/${deleteTarget.id}`)
      setDeleteTarget(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting class:', error)
    } finally {
      setDeleting(false)
    }
  }

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
            <BookOpen className="w-4 h-4" />
            <span>{isAdmin ? 'Class Management' : 'My Classes'}</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Classes</h1>
          <p className="text-secondary-500 mt-0.5">{isAdmin ? 'Manage all classes' : 'View your assigned classes'}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditingClass(null); setShowForm(true) }}>
            <Plus className="w-4 h-4 mr-2" /> Add Class
          </Button>
        )}
      </div>

      {classes.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <School className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
            <p className="text-lg font-medium text-secondary-900">No classes found</p>
            <p className="text-sm text-secondary-500 mt-1">
              {isAdmin ? 'Create your first class to get started.' : 'No classes have been assigned to you yet.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <Card key={cls.id} className="hover:border-primary-200 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">{cls.name}</h3>
                    {cls.section && <p className="text-xs text-secondary-500">Section {cls.section}</p>}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingClass(cls); setShowForm(true) }}
                      className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(cls)}
                      className="p-1.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-secondary-50 rounded-lg p-2.5">
                  <p className="text-secondary-500 text-xs">Teacher</p>
                  <p className="font-medium text-secondary-900 truncate">{cls.teacher?.name || 'Unassigned'}</p>
                </div>
                <div className="bg-secondary-50 rounded-lg p-2.5">
                  <p className="text-secondary-500 text-xs">Room</p>
                  <p className="font-medium text-secondary-900">{cls.room_number || 'N/A'}</p>
                </div>
                <div className="bg-secondary-50 rounded-lg p-2.5">
                  <p className="text-secondary-500 text-xs">Capacity</p>
                  <p className="font-medium text-secondary-900">{cls.capacity || '—'}</p>
                </div>
                <div className="bg-secondary-50 rounded-lg p-2.5">
                  <p className="text-secondary-500 text-xs">Students</p>
                  <p className="font-medium text-secondary-900">{cls.students?.length || 0}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <ClassForm
          cls={editingClass}
          teachers={teachers}
          onClose={() => { setShowForm(false); setEditingClass(null) }}
          onSaved={() => { setShowForm(false); setEditingClass(null); fetchData() }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        title="Delete Class"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}

export default Classes
