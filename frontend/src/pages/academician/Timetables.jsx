import { useState, useEffect, useCallback } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { Calendar, Plus, X, Clock, MapPin, Trash2, Edit2, AlertCircle, CheckCircle, Layers, Printer } from 'lucide-react'
import axios from 'axios'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' }
const TIME_SLOTS = [
  { label: '08:00 - 08:45', start: '08:00', end: '08:45' },
  { label: '08:45 - 09:30', start: '08:45', end: '09:30' },
  { label: '09:30 - 10:15', start: '09:30', end: '10:15' },
  { label: '10:15 - 10:45', start: '10:15', end: '10:45', isBreak: true },
  { label: '10:45 - 11:30', start: '10:45', end: '11:30' },
  { label: '11:30 - 12:15', start: '11:30', end: '12:15' },
  { label: '12:15 - 13:00', start: '12:15', end: '13:00' },
  { label: '13:00 - 13:45', start: '13:00', end: '13:45' },
  { label: '13:45 - 14:45', start: '13:45', end: '14:45', isBreak: true },
  { label: '14:45 - 15:45', start: '14:45', end: '15:45' },
]
const TYPE_COLORS = {
  academic: 'bg-blue-50 border-blue-200 text-blue-800',
  sports: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  study: 'bg-amber-50 border-amber-200 text-amber-800',
  activity: 'bg-purple-50 border-purple-200 text-purple-800',
  breakfast: 'bg-orange-50 border-orange-200 text-orange-700',
  lunch: 'bg-orange-50 border-orange-200 text-orange-700',
}

const EntryModal = ({ onClose, onSaved, classes, subjects, teachers, entry }) => {
  const isEdit = !!entry
  const [form, setForm] = useState({
    class_id: entry?.class_id?.toString() || '',
    subject_id: entry?.subject_id?.toString() || '',
    teacher_id: entry?.teacher_id?.toString() || '',
    day: entry?.day || 'monday',
    start_time: entry?.start_time?.slice(0, 5) || '',
    end_time: entry?.end_time?.slice(0, 5) || '',
    room_number: entry?.room_number || '',
    timetable_type: entry?.timetable_type || 'academic',
    venue: entry?.venue || '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const errs = {}
    if (!form.class_id) errs.class_id = 'Select a class'
    if (!form.subject_id && form.timetable_type === 'academic') errs.subject_id = 'Select a subject'
    if (!form.teacher_id && form.timetable_type === 'academic') errs.teacher_id = 'Select a teacher'
    if (!form.start_time) errs.start_time = 'Start time is required'
    if (!form.end_time) errs.end_time = 'End time is required'
    if (form.start_time && form.end_time && form.start_time >= form.end_time) errs.end_time = 'End must be after start'
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
        await axios.put(`/api/academician/timetables/${entry.id}`, form)
      } else {
        await axios.post('/api/academician/timetables', form)
      }
      onSaved()
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">{isEdit ? 'Edit Entry' : 'Add Entry'}</h3>
            <p className="text-sm text-secondary-500 mt-0.5">{isEdit ? 'Update schedule entry' : 'New schedule entry'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {serverError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start space-x-2"><AlertCircle className="w-4 h-4 text-red-500 mt-0.5" /><div className="text-sm text-red-700">{serverError}</div></div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Class</label>
            <select className="input" value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}>
              <option value="">Select class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.class_id && <p className="text-xs text-red-500 mt-1">{errors.class_id}</p>}
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.timetable_type} onChange={e => setForm({ ...form, timetable_type: e.target.value })}>
              <option value="academic">Academic</option>
              <option value="sports">Sports</option>
              <option value="study">Study Time</option>
              <option value="activity">Activity</option>
            </select>
          </div>
          {form.timetable_type === 'academic' && (
            <>
              <div>
                <label className="label">Subject</label>
                <select className="input" value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                  <option value="">Select subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.subject_id && <p className="text-xs text-red-500 mt-1">{errors.subject_id}</p>}
              </div>
              <div>
                <label className="label">Teacher</label>
                <select className="input" value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}>
                  <option value="">Select teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {errors.teacher_id && <p className="text-xs text-red-500 mt-1">{errors.teacher_id}</p>}
              </div>
            </>
          )}
          <div>
            <label className="label">Day</label>
            <select className="input" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}>
              {Object.entries(DAY_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start</label>
              <input type="time" className="input" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
              {errors.start_time && <p className="text-xs text-red-500 mt-1">{errors.start_time}</p>}
            </div>
            <div>
              <label className="label">End</label>
              <input type="time" className="input" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
              {errors.end_time && <p className="text-xs text-red-500 mt-1">{errors.end_time}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Room</label>
              <input type="text" className="input" value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} placeholder="e.g. Room 101" />
            </div>
            <div>
              <label className="label">Venue</label>
              <input type="text" className="input" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="e.g. Lab A" />
            </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Saving...' : isEdit ? 'Update' : 'Add Entry'}</Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

const Timetables = () => {
  const [timetables, setTimetables] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchAll() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [clsRes, subRes, tchRes] = await Promise.all([
        axios.get('/api/academician/classes').catch(() => ({ data: [] })),
        axios.get('/api/academician/subjects').catch(() => ({ data: [] })),
        axios.get('/api/academician/teachers').catch(() => ({ data: [] })),
      ])
      setClasses(Array.isArray(clsRes.data) ? clsRes.data : clsRes.data.data || [])
      setSubjects(Array.isArray(subRes.data) ? subRes.data : subRes.data.data || [])
      setTeachers(Array.isArray(tchRes.data) ? tchRes.data : tchRes.data.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchTimetable = useCallback(async () => {
    if (!selectedClass) { setTimetables([]); return }
    try {
      const { data } = await axios.get(`/api/academician/timetables/class/${selectedClass}`)
      setTimetables(data.timetable || {})
    } catch { setTimetables({}) }
  }, [selectedClass])

  useEffect(() => { fetchTimetable() }, [fetchTimetable])

  const getEntries = (day, start, end) => {
    const dayEntries = timetables[day] || []
    return dayEntries.filter(e => e.start_time?.slice(0, 5) === start && e.end_time?.slice(0, 5) === end)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return
    setDeleting(id)
    try {
      await axios.delete(`/api/academician/timetables/${id}`)
      await fetchTimetable()
      showToast('Entry deleted')
    } catch { showToast('Failed to delete', 'error') }
    finally { setDeleting(null) }
  }

  const handleGenerate = async () => {
    if (!selectedClass) return
    if (!window.confirm('Generate full weekly timetable for this class? This will replace any existing timetable for this class.')) return
    setGenerating(true)
    try {
      await axios.post('/api/academician/timetables/generate', { class_id: selectedClass })
      await fetchTimetable()
      showToast('Timetable generated')
    } catch (err) {
      showToast(err.response?.data?.message || 'Generation failed', 'error')
    } finally { setGenerating(false) }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  const selectedClassName = classes.find(c => c.id == selectedClass)?.name || ''

  return (
    <div className="space-y-6">
      <style>{`@media print{body *{visibility:hidden}.print-area,.print-area *{visibility:visible}.print-area{position:absolute;left:0;top:0;width:100%;overflow:visible!important}.no-print{display:none!important}}`}</style>
      {toast && (
        <div className={`no-print px-4 py-3 rounded-lg border text-sm flex items-center space-x-2 ${
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sm text-secondary-500 mb-1">
            <Calendar className="w-4 h-4" /><span>Academician</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Class Timetables</h1>
          <p className="text-secondary-500 mt-0.5">Weekly schedules grouped by grade — Mon–Sat, 45 min sessions</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" disabled={!selectedClass} onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />Download
          </Button>
          <Button disabled={!selectedClass || generating} onClick={handleGenerate}>
            <Layers className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />{generating ? 'Generating...' : 'Generate Full Week'}
          </Button>
          <Button variant="secondary" disabled={!selectedClass} onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />Add Entry
          </Button>
        </div>
      </div>

      {/* Class selector */}
      <Card className="no-print">
        <div className="flex items-center space-x-4">
          <label className="font-medium text-secondary-700 whitespace-nowrap">Select Class / Grade:</label>
          <select
            className="input max-w-xs"
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
          >
            <option value="">— Choose a class —</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </Card>

      {/* Weekly Grid */}
      {selectedClass && (
        <Card className="print-area">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">{selectedClassName} — Weekly Schedule</h3>
              <p className="text-xs text-secondary-400 mt-0.5">45 min sessions · 3 before breakfast, 4 before lunch · Academic (blue), Sports (green), Study (amber), Activity (purple)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider pb-3 pr-3 w-28">Time</th>
                  {DAYS.map(d => (
                    <th key={d} className="text-center text-xs font-semibold text-secondary-500 uppercase tracking-wider pb-3 px-2">{DAY_LABELS[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot) => {
                  const isBreak = slot.isBreak
                  return (
                    <tr key={slot.start} className={isBreak ? 'bg-orange-50/60' : ''}>
                      <td className={`py-2 pr-3 text-xs font-medium align-top whitespace-nowrap ${isBreak ? 'font-semibold text-orange-700' : 'text-secondary-500'}`}>
                        <Clock className="w-3 h-3 inline mr-1" />{slot.label}
                      </td>
                      {DAYS.map(day => {
                        const entries = getEntries(day, slot.start, slot.end)
                        return (
                          <td key={day} className={`px-1 align-top ${isBreak ? 'py-1' : 'py-1'}`}>
                            {isBreak ? (
                              <div className="h-10 rounded-lg bg-orange-100/60 border border-orange-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-orange-600 capitalize">
                                  {entries[0]?.venue || (slot.label.includes('10:15') ? 'Breakfast' : 'Lunch')}
                                </span>
                              </div>
                            ) : entries.length === 0 ? (
                              <div className="h-16 rounded-lg bg-secondary-50 border border-dashed border-secondary-200 flex items-center justify-center">
                                <span className="text-[10px] text-secondary-300">—</span>
                              </div>
                            ) : (
                              entries.map(e => {
                                const typeClass = TYPE_COLORS[e.timetable_type] || TYPE_COLORS.academic
                                return (
                                  <div key={e.id} className={`relative group h-16 rounded-lg border p-1.5 text-xs ${typeClass}`}>
                                    {e.subject && <div className="font-semibold truncate leading-tight">{e.subject.name}</div>}
                                    {!e.subject && <div className="font-semibold truncate leading-tight capitalize">{e.timetable_type || 'Activity'}</div>}
                                    {e.teacher && <div className="truncate opacity-75">{e.teacher.name}</div>}
                                    {e.venue && <div className="truncate opacity-75"><MapPin className="w-2.5 h-2.5 inline mr-0.5" />{e.venue}</div>}
                                    {e.room_number && !e.venue && <div className="truncate opacity-75">{e.room_number}</div>}
                                    <div className="absolute top-0 right-0 hidden group-hover:flex space-x-0.5 p-0.5">
                                      <button onClick={() => setEditEntry(e)}
                                        className="p-0.5 bg-white/80 rounded hover:bg-white text-secondary-400 hover:text-primary-600">
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id}
                                        className="p-0.5 bg-white/80 rounded hover:bg-white text-secondary-400 hover:text-red-600">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-secondary-100">
            <span className="text-xs text-secondary-500 font-medium">Legend:</span>
            {Object.entries(TYPE_COLORS).map(([type, cls]) => (
              <span key={type} className={`text-xs px-2 py-0.5 rounded border capitalize ${cls}`}>
                {type}
              </span>
            ))}
          </div>
        </Card>
      )}

      {!selectedClass && !loading && (
        <Card className="no-print">
          <div className="py-12 text-center text-secondary-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">Select a class above</p>
            <p className="text-sm mt-1">Choose a class or grade to view its weekly timetable</p>
          </div>
        </Card>
      )}

        {(showModal || editEntry) && (
        <div className="no-print"><EntryModal
          onClose={() => { setShowModal(false); setEditEntry(null) }}
          onSaved={() => { setShowModal(false); setEditEntry(null); fetchTimetable(); showToast(editEntry ? 'Entry updated' : 'Entry created') }}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          entry={editEntry}
        /></div>
      )}
    </div>
  )
}

export default Timetables
