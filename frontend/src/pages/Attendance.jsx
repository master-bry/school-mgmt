import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, Users, FileText, CheckSquare, BarChart3 } from 'lucide-react'
import axios from 'axios'

const STATUSES = ['present', 'absent', 'late', 'excused', 'permission']

const Attendance = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id: childId } = useParams()
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('view')
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState([])
  const [attendanceData, setAttendanceData] = useState({})
  const [permissionReasons, setPermissionReasons] = useState({})
  const [permissionDays, setPermissionDays] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState(null)
  const [totalEnrolled, setTotalEnrolled] = useState(0)
  const [classInfo, setClassInfo] = useState(null)

  const isTeacher = user?.role === 'teacher'

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (isTeacher && mode === 'mark') return
    if (isTeacher && mode === 'view' && classes.length === 0) loadViewClasses()
    fetchAttendance()
  }, [user, navigate, childId, mode, selectedClass])

  const loadViewClasses = async () => {
    try {
      const { data } = await axios.get('/api/teacher/classes')
      setClasses(data || [])
    } catch (error) {
      console.error('Error loading classes:', error)
    }
  }

  const fetchAttendance = async () => {
    try {
      let res
      if (user.role === 'student') {
        res = await axios.get('/api/student/attendance')
        setAttendance(res.data.data || res.data)
      } else if (user.role === 'parent' && childId) {
        res = await axios.get(`/api/parent/child/${childId}/attendance`)
        setAttendance(res.data.data || res.data)
      } else if (isTeacher && selectedClass) {
        res = await axios.get(`/api/teacher/attendance/${selectedClass}`)
        if (res.data.attendances) {
          setAttendance(res.data.attendances)
          setTotalEnrolled(res.data.total_enrolled)
          setClassInfo(res.data.class)
        } else {
          setAttendance(res.data.data || res.data)
        }
      } else {
        return
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMarkAttendance = async () => {
    try {
      const { data } = await axios.get('/api/teacher/classes')
      setClasses(data || [])
      setAttendance([])
      setSummary(null)
      setSelectedClass('')
      setStudents([])
      setAttendanceData({})
      setPermissionReasons({})
      setPermissionDays({})
      setLoading(false)
    } catch (error) {
      console.error('Error loading mark attendance:', error)
      setLoading(false)
    }
  }

  const loadStudentsForClass = async (classId) => {
    if (!classId) {
      setStudents([])
      setAttendanceData({})
      return
    }
    const cls = classes.find(c => String(c.id) === String(classId))
    const classStudents = cls?.students || []
    setStudents(classStudents)
    const initial = {}
    const reasons = {}
    const days = {}
    classStudents.forEach(s => {
      initial[s.id] = 'present'
      reasons[s.id] = ''
      days[s.id] = 1
    })
    setAttendanceData(initial)
    setPermissionReasons(reasons)
    setPermissionDays(days)
  }

  const handleClassChange = (e) => {
    const val = e.target.value
    setSelectedClass(val)
    setSummary(null)
    if (val) loadStudentsForClass(val)
  }

  const handleSubmitAttendance = async () => {
    if (!selectedClass || !selectedDate) return
    setSubmitting(true)
    try {
      const attendances = Object.entries(attendanceData).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        status,
        ...(status === 'permission' ? {
          permission_reason: permissionReasons[studentId] || '',
          permission_days: parseInt(permissionDays[studentId]) || 1,
        } : {}),
      }))
      const res = await axios.post('/api/teacher/attendance', {
        class_id: parseInt(selectedClass),
        date: selectedDate,
        attendances,
      })
      setSummary(res.data.summary)
      setAttendance(res.data.attendances)
      setTotalEnrolled(res.data.summary.total_enrolled)
      setMode('view')
    } catch (error) {
      console.error('Error submitting attendance:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-5 h-5 text-accent-500" />
      case 'absent': return <XCircle className="w-5 h-5 text-red-500" />
      case 'late': return <Clock className="w-5 h-5 text-orange-500" />
      case 'excused': return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'permission': return <FileText className="w-5 h-5 text-blue-500" />
      default: return null
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700'
      case 'absent': return 'bg-red-100 text-red-700'
      case 'late': return 'bg-orange-100 text-orange-700'
      case 'excused': return 'bg-yellow-100 text-yellow-700'
      case 'permission': return 'bg-blue-100 text-blue-700'
      default: return 'bg-secondary-100 text-secondary-600'
    }
  }

  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    excused: attendance.filter(a => a.status === 'excused').length,
    permission: attendance.filter(a => a.status === 'permission').length,
  }

  const total = attendance.length
  const percentage = total > 0 ? Math.round((stats.present / total) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (isTeacher && mode === 'mark') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-primary-600" />
            <h2 className="text-2xl font-semibold text-secondary-900">Mark Attendance</h2>
          </div>
          <Button variant="secondary" onClick={() => { setMode('view'); fetchAttendance() }}>
            View Records
          </Button>
        </div>

        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Select Class</label>
              <select className="input" value={selectedClass} onChange={handleClassChange}>
                <option value="">Choose a class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.section ? `- ${c.section}` : ''} ({c.students?.length || 0} students)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
          </div>
          {students.length > 0 && (
            <div className="text-sm text-secondary-500 mb-2">
              Total enrolled: <strong>{students.length}</strong> students
            </div>
          )}
        </Card>

        {students.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 text-secondary-600 font-medium">#</th>
                    <th className="text-left py-3 px-4 text-secondary-600 font-medium">Student</th>
                    {STATUSES.map((s) => (
                      <th key={s} className="text-center py-3 px-4 text-secondary-600 font-medium capitalize">{s}</th>
                    ))}
                    <th className="text-left py-3 px-4 text-secondary-600 font-medium">Permission Details</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, idx) => (
                    <tr key={student.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="py-3 px-4 text-secondary-400 text-sm">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">{student.name?.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-secondary-900">{student.name}</span>
                        </div>
                      </td>
                      {STATUSES.map((status) => (
                        <td key={status} className="text-center py-3 px-4">
                          <input
                            type="radio"
                            name={`student_${student.id}`}
                            checked={attendanceData[student.id] === status}
                            onChange={() => setAttendanceData({ ...attendanceData, [student.id]: status })}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                      ))}
                      <td className="py-3 px-4">
                        {attendanceData[student.id] === 'permission' && (
                          <div className="flex flex-col space-y-1 min-w-[200px]">
                            <input
                              type="text"
                              placeholder="Reason for permission..."
                              className="input text-xs"
                              value={permissionReasons[student.id] || ''}
                              onChange={e => setPermissionReasons(p => ({ ...p, [student.id]: e.target.value }))}
                            />
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-secondary-500">Days:</span>
                              <input
                                type="number"
                                min="1"
                                className="input text-xs w-16"
                                value={permissionDays[student.id] || 1}
                                onChange={e => setPermissionDays(p => ({ ...p, [student.id]: e.target.value }))}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-secondary-500">
                <CheckSquare className="w-4 h-4 inline mr-1" />
                {Object.keys(attendanceData).length} / {students.length} students marked
              </div>
              <Button onClick={handleSubmitAttendance} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Attendance'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="w-8 h-8 text-primary-600" />
          <h2 className="text-2xl font-semibold text-secondary-900">Attendance Records</h2>
        </div>
        {isTeacher && (
          <Button onClick={() => { setMode('mark'); loadMarkAttendance() }}>
            <Users className="w-4 h-4 mr-2" /> Mark Attendance
          </Button>
        )}
      </div>

      {isTeacher && (
        <Card className="mb-6">
          <div className="flex items-center space-x-4">
            <label className="label mb-0 whitespace-nowrap">Filter by Class</label>
            <select className="input max-w-xs" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setAttendance([]); setLoading(true); }}>
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.section ? `- ${c.section}` : ''}</option>
              ))}
            </select>
            {classInfo && (
              <span className="text-sm text-secondary-500">
                Enrolled: <strong>{totalEnrolled}</strong>
              </span>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white text-center">
          <p className="text-primary-100 text-sm">Attendance Rate</p>
          <p className="text-3xl font-bold">{percentage}%</p>
          <p className="text-primary-200 text-xs mt-1">{stats.present} present of {total} recorded</p>
        </Card>
        <Card className="bg-gradient-to-br from-accent-500 to-accent-600 text-white text-center">
          <p className="text-accent-100 text-sm">Present</p>
          <p className="text-3xl font-bold">{stats.present}</p>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white text-center">
          <p className="text-red-100 text-sm">Absent</p>
          <p className="text-3xl font-bold">{stats.absent}</p>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-center">
          <p className="text-orange-100 text-sm">Late</p>
          <p className="text-3xl font-bold">{stats.late}</p>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white text-center">
          <p className="text-yellow-100 text-sm">Excused</p>
          <p className="text-3xl font-bold">{stats.excused}</p>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-center">
          <p className="text-blue-100 text-sm">Permission</p>
          <p className="text-3xl font-bold">{stats.permission}</p>
        </Card>
      </div>

      {summary && (
        <Card className="mb-6 border-2 border-accent-300 bg-accent-50">
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="w-5 h-5 text-accent-600" />
            <h3 className="font-semibold text-accent-800">Last Submission Summary</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-secondary-500">Enrolled:</span> <strong>{summary.total_enrolled}</strong></div>
            <div><span className="text-secondary-500">Marked:</span> <strong>{summary.total_marked}</strong></div>
            <div><span className="text-green-600">Present:</span> <strong>{summary.present}</strong></div>
            <div><span className="text-red-600">Absent:</span> <strong>{summary.absent}</strong></div>
            <div><span className="text-orange-600">Late:</span> <strong>{summary.late}</strong></div>
            <div><span className="text-yellow-600">Excused:</span> <strong>{summary.excused}</strong></div>
            <div><span className="text-blue-600">Permission:</span> <strong>{summary.permission}</strong></div>
            <div><span className="text-primary-600">Percentage:</span> <strong>{summary.percentage}%</strong></div>
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200">
                <th className="text-left py-3 px-4 text-secondary-600 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-secondary-600 font-medium">Student</th>
                <th className="text-left py-3 px-4 text-secondary-600 font-medium">Class</th>
                <th className="text-left py-3 px-4 text-secondary-600 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-secondary-600 font-medium">Permission Reason</th>
                <th className="text-left py-3 px-4 text-secondary-600 font-medium">Permission Days</th>
                <th className="text-left py-3 px-4 text-secondary-600 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a) => (
                <tr key={a.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                  <td className="py-3 px-4 text-secondary-900">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-600">{a.student?.name?.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-secondary-900">{a.student?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-secondary-600">{a.class?.name || classInfo?.name || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(a.status)}`}>
                      {getStatusIcon(a.status)}
                      <span className="capitalize">{a.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-secondary-600">{a.permission_reason || '-'}</td>
                  <td className="py-3 px-4 text-secondary-600">{a.permission_days || '-'}</td>
                  <td className="py-3 px-4 text-secondary-600">{a.remarks || '-'}</td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-secondary-500">No attendance records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default Attendance
