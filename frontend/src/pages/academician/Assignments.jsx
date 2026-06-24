import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { Users, BookOpen, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'

const Assignments = () => {
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  const [subjectForm, setSubjectForm] = useState({ subject_id: '', teacher_id: '' })
  const [classForm, setClassForm] = useState({ class_id: '', teacher_id: '' })
  const [subjectErrors, setSubjectErrors] = useState({})
  const [classErrors, setClassErrors] = useState({})
  const [savingSubject, setSavingSubject] = useState(false)
  const [savingClass, setSavingClass] = useState(false)
  const [toast, setToast] = useState(null)

  // View assigned teachers
  const [showAssigned, setShowAssigned] = useState(false)
  const [assignedData, setAssignedData] = useState(null)
  const [loadingAssigned, setLoadingAssigned] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [tchRes, subRes, clsRes] = await Promise.all([
        axios.get('/api/academician/teachers'),
        axios.get('/api/academician/subjects').catch(() => ({ data: [] })),
        axios.get('/api/academician/classes').catch(() => ({ data: [] })),
      ])
      setTeachers(Array.isArray(tchRes.data) ? tchRes.data : tchRes.data.data || [])
      setSubjects(Array.isArray(subRes.data) ? subRes.data : subRes.data.data || [])
      setClasses(Array.isArray(clsRes.data) ? clsRes.data : clsRes.data.data || [])
    } catch (e) {
      console.error('Failed to fetch data:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignedTeachers = async () => {
    setLoadingAssigned(true)
    setShowAssigned(true)
    try {
      const res = await axios.get('/api/academician/assigned-teachers')
      setAssignedData(res.data)
    } catch (e) {
      showToast('Failed to load assigned teachers', 'error')
    } finally {
      setLoadingAssigned(false)
    }
  }

  const validateSubject = () => {
    const errs = {}
    if (!subjectForm.subject_id) errs.subject_id = 'Select a subject'
    if (!subjectForm.teacher_id) errs.teacher_id = 'Select a teacher'
    setSubjectErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateClass = () => {
    const errs = {}
    if (!classForm.class_id) errs.class_id = 'Select a class'
    if (!classForm.teacher_id) errs.teacher_id = 'Select a teacher'
    setClassErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubjectAssign = async (e) => {
    e.preventDefault()
    if (!validateSubject()) return
    setSavingSubject(true)
    try {
      await axios.post('/api/academician/assign-teacher-subject', subjectForm)
      showToast('Teacher assigned to subject successfully')
      setSubjectForm({ subject_id: '', teacher_id: '' })
      setSubjectErrors({})
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign teacher', 'error')
    } finally {
      setSavingSubject(false)
    }
  }

  const handleClassAssign = async (e) => {
    e.preventDefault()
    if (!validateClass()) return
    setSavingClass(true)
    try {
      await axios.post('/api/academician/assign-teacher-class', classForm)
      showToast('Teacher assigned to class successfully')
      setClassForm({ class_id: '', teacher_id: '' })
      setClassErrors({})
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign teacher', 'error')
    } finally {
      setSavingClass(false)
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
      <div>
        <div className="flex items-center space-x-2 text-sm text-secondary-500 mb-1">
          <Users className="w-4 h-4" />
          <span>Academician</span>
        </div>
        <h1 className="text-2xl font-bold text-secondary-900">Teacher Assignments</h1>
        <p className="text-secondary-500 mt-0.5">Assign teachers to subjects and classes</p>
      </div>

      {toast && (
        <div className={`px-4 py-3 rounded-lg border text-sm flex items-center space-x-2 ${
          toast.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          {toast.type === 'error'
            ? <AlertCircle className="w-4 h-4 flex-shrink-0" />
            : <CheckCircle className="w-4 h-4 flex-shrink-0" />
          }
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="secondary" onClick={showAssigned ? () => setShowAssigned(false) : fetchAssignedTeachers}>
          {showAssigned ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showAssigned ? 'Hide Assigned Teachers' : 'View Assigned Teachers'}
        </Button>
      </div>

      {showAssigned && (
        <Card>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">Current Teacher Assignments</h2>
              <p className="text-sm text-secondary-500 mt-0.5">Overview of all assigned teachers</p>
            </div>
          </div>

          {loadingAssigned ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : assignedData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-secondary-900 mb-3 flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-violet-500" />
                  <span>Subject Assignments</span>
                </h3>
                <div className="space-y-2">
                  {assignedData.subject_assignments?.length > 0 ? assignedData.subject_assignments.map(s => (
                    <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary-50">
                      <div>
                        <p className="text-sm font-medium text-secondary-900">{s.name}</p>
                        <p className="text-xs text-secondary-500">{s.code}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.teacher ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s.teacher?.name || 'Unassigned'}
                      </span>
                    </div>
                  )) : <p className="text-sm text-secondary-400 py-4 text-center">No subject assignments</p>}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-secondary-900 mb-3 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-orange-500" />
                  <span>Class Teacher Assignments</span>
                </h3>
                <div className="space-y-2">
                  {assignedData.class_assignments?.length > 0 ? assignedData.class_assignments.map(c => (
                    <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary-50">
                      <div>
                        <p className="text-sm font-medium text-secondary-900">{c.name}</p>
                        <p className="text-xs text-secondary-500">{c.section || 'No section'}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.teacher ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {c.teacher?.name || 'Unassigned'}
                      </span>
                    </div>
                  )) : <p className="text-sm text-secondary-400 py-4 text-center">No class teacher assignments</p>}
                </div>
              </div>
            </div>
          ) : <p className="text-sm text-secondary-400 py-4 text-center">No data available</p>}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">Assign Teacher to Subject</h2>
              <p className="text-sm text-secondary-500 mt-0.5">Link a teacher with a subject</p>
            </div>
          </div>

          <form onSubmit={handleSubjectAssign} className="space-y-4">
            <div>
              <label className="label">Subject</label>
              <select className="input" value={subjectForm.subject_id}
                onChange={e => setSubjectForm({ ...subjectForm, subject_id: e.target.value })}>
                <option value="">Select subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {subjectErrors.subject_id && <p className="text-xs text-red-500 mt-1">{subjectErrors.subject_id}</p>}
            </div>

            <div>
              <label className="label">Teacher</label>
              <select className="input" value={subjectForm.teacher_id}
                onChange={e => setSubjectForm({ ...subjectForm, teacher_id: e.target.value })}>
                <option value="">Select teacher</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {subjectErrors.teacher_id && <p className="text-xs text-red-500 mt-1">{subjectErrors.teacher_id}</p>}
            </div>

            <Button type="submit" disabled={savingSubject} className="w-full">
              {savingSubject ? 'Assigning...' : 'Assign Teacher to Subject'}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">Assign Teacher to Class</h2>
              <p className="text-sm text-secondary-500 mt-0.5">Assign a teacher as class teacher</p>
            </div>
          </div>

          <form onSubmit={handleClassAssign} className="space-y-4">
            <div>
              <label className="label">Class</label>
              <select className="input" value={classForm.class_id}
                onChange={e => setClassForm({ ...classForm, class_id: e.target.value })}>
                <option value="">Select class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {classErrors.class_id && <p className="text-xs text-red-500 mt-1">{classErrors.class_id}</p>}
            </div>

            <div>
              <label className="label">Teacher</label>
              <select className="input" value={classForm.teacher_id}
                onChange={e => setClassForm({ ...classForm, teacher_id: e.target.value })}>
                <option value="">Select teacher</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {classErrors.teacher_id && <p className="text-xs text-red-500 mt-1">{classErrors.teacher_id}</p>}
            </div>

            <Button type="submit" disabled={savingClass} className="w-full">
              {savingClass ? 'Assigning...' : 'Assign Teacher to Class'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default Assignments
