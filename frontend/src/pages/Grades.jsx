import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import { BookOpen, TrendingUp, Award, Plus, BarChart3, PieChart, CheckCircle, XCircle, Users, FileSpreadsheet } from 'lucide-react'
import axios from 'axios'

const GRADE_COLORS = {
  'A+': 'text-emerald-600 bg-emerald-100', 'A': 'text-emerald-600 bg-emerald-100',
  'B+': 'text-blue-600 bg-blue-100', 'B': 'text-blue-600 bg-blue-100',
  'C': 'text-yellow-600 bg-yellow-100',
  'D': 'text-orange-600 bg-orange-100',
  'F': 'text-red-600 bg-red-100',
}

const GRADE_BAR_COLORS = {
  'A+': 'bg-emerald-500', 'A': 'bg-emerald-500',
  'B+': 'bg-blue-500', 'B': 'bg-blue-500',
  'C': 'bg-yellow-500',
  'D': 'bg-orange-500',
  'F': 'bg-red-500',
}

const Grades = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id: childId } = useParams()
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('view')
  const [classes, setClasses] = useState([])
  const [exams, setExams] = useState([])
  const [students, setStudents] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [selectedExamInfo, setSelectedExamInfo] = useState(null)
  const [gradeData, setGradeData] = useState({})
  const [existingGrades, setExistingGrades] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)

  const isTeacher = user?.role === 'teacher'

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchGrades()
  }, [user, navigate, childId, mode])

  const fetchGrades = async () => {
    try {
      let res
      if (user.role === 'student') {
        res = await axios.get('/api/student/grades')
      } else if (user.role === 'parent' && childId) {
        res = await axios.get(`/api/parent/child/${childId}/grades`)
      } else if (isTeacher && mode === 'view') {
        return setGrades([])
      } else {
        return setGrades([])
      }
      setGrades(res.data)
    } catch (error) {
      console.error('Error fetching grades:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEnterGrades = async () => {
    setLoading(true)
    setSubmitMessage(null)
    try {
      const classesRes = await axios.get('/api/teacher/classes')
      const data = Array.isArray(classesRes.data) ? classesRes.data : (classesRes.data.data || [])
      setClasses(data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading grade entry:', error)
      setLoading(false)
    }
  }

  const loadExams = async (classId) => {
    if (!classId) {
      setExams([])
      setSelectedExam('')
      setSelectedExamInfo(null)
      return
    }
    try {
      const res = await axios.get('/api/exams', { params: { class_id: classId } })
      setExams(res.data)
    } catch (error) {
      console.error('Error loading exams:', error)
    }
  }

  const handleClassChange = (e) => {
    const val = e.target.value
    setSelectedClass(val)
    setSelectedExam('')
    setSelectedExamInfo(null)
    setGradeData({})
    setExistingGrades({})
    setStudents([])
    setSubmitMessage(null)
    if (val) {
      const cls = classes.find(c => String(c.id) === String(val))
      setStudents(cls?.students || [])
    }
    loadExams(val)
  }

  const handleExamChange = async (e) => {
    const val = e.target.value
    setSelectedExam(val)
    setGradeData({})
    setExistingGrades({})
    setSubmitMessage(null)

    if (!val) {
      setSelectedExamInfo(null)
      return
    }

    const exam = exams.find(ex => String(ex.id) === String(val))
    setSelectedExamInfo(exam)

    if (!exam) return

    const classStudents = students.filter(s => String(s.class_id) === String(exam.class_id))
    const initial = {}
    classStudents.forEach(s => { initial[s.id] = '' })

    // Try to load existing grades
    try {
      const res = await axios.get(`/api/teacher/exams/${exam.id}/grades`)
      const existing = res.data.grades || []
      const existingMap = {}
      existing.forEach(g => {
        if (g.student_id) {
          initial[g.student_id] = String(g.marks_obtained)
          existingMap[g.student_id] = g
        }
      })
      setExistingGrades(existingMap)
    } catch (error) {
      // No existing grades
    }

    setGradeData(initial)
  }

  const handleSubmitGrades = async () => {
    if (!selectedExam) return
    setSubmitting(true)
    setSubmitMessage(null)
    try {
      const grades = Object.entries(gradeData)
        .filter(([, marks]) => marks !== '' && !isNaN(parseFloat(marks)))
        .map(([studentId, marks]) => ({
          student_id: parseInt(studentId),
          marks_obtained: parseFloat(marks),
        }))

      if (grades.length === 0) {
        setSubmitMessage({ type: 'error', text: 'No valid marks entered' })
        return
      }

      const res = await axios.post('/api/teacher/grades', {
        exam_id: parseInt(selectedExam),
        grades,
      })
      setSubmitMessage({ type: 'success', text: res.data.message || 'Grades recorded successfully' })
      setMode('view')
      setGrades([])
    } catch (error) {
      setSubmitMessage({ type: 'error', text: error.response?.data?.message || 'Error submitting grades' })
    } finally {
      setSubmitting(false)
    }
  }

  const getGradeColor = (grade) => GRADE_COLORS[grade] || 'text-secondary-600 bg-secondary-100'

  const averageGrade = grades.length > 0
    ? (grades.reduce((sum, g) => sum + parseFloat(g.percentage), 0) / grades.length).toFixed(2)
    : 0

  const groupedByClass = grades.reduce((acc, grade) => {
    const className = grade.exam?.class?.name || 'Unknown Class'
    if (!acc[className]) acc[className] = []
    acc[className].push(grade)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (isTeacher && mode === 'enter') {
    const submissionStatus = selectedExamInfo?.submission_status
    const totalMarks = selectedExamInfo?.total_marks || 100
    const enteredCount = Object.entries(gradeData).filter(([, m]) => m !== '' && !isNaN(parseFloat(m))).length
    const totalStudents = Object.keys(gradeData).length

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-primary-600" />
            <h2 className="text-2xl font-semibold text-secondary-900">Enter Grades</h2>
          </div>
          <Button variant="secondary" onClick={() => setMode('view')}>
            View Results
          </Button>
        </div>

        {submitMessage && (
          <Card className={`mb-4 ${submitMessage.type === 'success' ? 'border-accent-300 bg-accent-50' : 'border-red-300 bg-red-50'}`}>
            <p className={`text-sm font-medium ${submitMessage.type === 'success' ? 'text-accent-700' : 'text-red-700'}`}>
              {submitMessage.text}
            </p>
          </Card>
        )}

        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="label">Select Exam</label>
              <select className="input" value={selectedExam} onChange={handleExamChange}>
                <option value="">Choose an exam...</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name} - {ex.subject?.name} ({new Date(ex.exam_date).toLocaleDateString()})</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {selectedExamInfo && (
          <Card className="mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-secondary-500">Exam:</span> <strong>{selectedExamInfo.name}</strong></div>
              <div><span className="text-secondary-500">Subject:</span> <strong>{selectedExamInfo.subject?.name}</strong></div>
              <div><span className="text-secondary-500">Total Marks:</span> <strong>{selectedExamInfo.total_marks}</strong></div>
              <div><span className="text-secondary-500">Date:</span> <strong>{new Date(selectedExamInfo.exam_date).toLocaleDateString()}</strong></div>
            </div>
          </Card>
        )}

        {Object.keys(gradeData).length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 text-secondary-600 font-medium">#</th>
                    <th className="text-left py-3 px-4 text-secondary-600 font-medium">Student</th>
                    <th className="text-left py-3 px-4 text-secondary-600 font-medium">Marks / {totalMarks}</th>
                    <th className="text-left py-3 px-4 text-secondary-600 font-medium">Percentage</th>
                    <th className="text-left py-3 px-4 text-secondary-600 font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(gradeData).map(([studentId, marks], idx) => {
                    const student = students.find(s => String(s.id) === studentId)
                    const existing = existingGrades[studentId]
                    const parsedMarks = parseFloat(marks)
                    const pct = !isNaN(parsedMarks) && parsedMarks >= 0 ? Math.round((parsedMarks / totalMarks) * 100) : null
                    return (
                      <tr key={studentId} className={`border-b border-secondary-100 hover:bg-secondary-50 ${existing ? 'bg-accent-50/30' : ''}`}>
                        <td className="py-3 px-4 text-secondary-400 text-sm">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-primary-600">{student?.name?.charAt(0)}</span>
                            </div>
                            <span className="font-medium text-secondary-900">{student?.name || 'Unknown'}</span>
                            {existing && <CheckCircle className="w-3.5 h-3.5 text-accent-500" title="Previously graded" />}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            max={totalMarks}
                            step="0.5"
                            className="input max-w-[130px]"
                            placeholder={`0-${totalMarks}`}
                            value={marks}
                            onChange={(e) => setGradeData({ ...gradeData, [studentId]: e.target.value })}
                          />
                        </td>
                        <td className="py-3 px-4">
                          {pct !== null ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-secondary-200 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-accent-500' : pct >= 60 ? 'bg-primary-500' : pct >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                              <span className="text-xs font-medium text-secondary-600">{pct}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-secondary-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {pct !== null ? (
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getGradeColor(pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F')}`}>
                              {pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F'}
                            </span>
                          ) : (
                            <span className="text-xs text-secondary-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-secondary-500 flex items-center space-x-3">
                <Users className="w-4 h-4" />
                <span>{enteredCount} / {totalStudents} graded</span>
                {Object.keys(existingGrades).length > 0 && (
                  <span className="text-accent-600">({Object.keys(existingGrades).length} previously graded)</span>
                )}
              </div>
              <Button onClick={handleSubmitGrades} disabled={submitting || enteredCount === 0}>
                {submitting ? 'Saving...' : 'Save Grades'}
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
          <TrendingUp className="w-8 h-8 text-primary-600" />
          <h2 className="text-2xl font-semibold text-secondary-900">Grades & Results</h2>
        </div>
        {isTeacher && (
          <Button onClick={() => { setMode('enter'); loadEnterGrades() }}>
            <Plus className="w-4 h-4 mr-2" /> Enter Grades
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Overall Average</p>
              <p className="text-3xl font-bold mt-1">{averageGrade}%</p>
            </div>
            <BarChart3 className="w-12 h-12 text-primary-200" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm">Total Entries</p>
              <p className="text-3xl font-bold mt-1">{grades.length}</p>
            </div>
            <FileSpreadsheet className="w-12 h-12 text-accent-200" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Classes</p>
              <p className="text-3xl font-bold mt-1">{Object.keys(groupedByClass).length}</p>
            </div>
            <Award className="w-12 h-12 text-purple-200" />
          </div>
        </Card>
      </div>

      {Object.entries(groupedByClass).map(([className, classGrades]) => {
        const groupedByExam = classGrades.reduce((acc, g) => {
          const examName = g.exam?.name || 'Unknown Exam'
          if (!acc[examName]) acc[examName] = []
          acc[examName].push(g)
          return acc
        }, {})

        return (
          <Card key={className} className="mb-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-1 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              <span>{className}</span>
            </h3>
            {Object.entries(groupedByExam).map(([examName, examGrades]) => {
              const avgPct = examGrades.reduce((sum, g) => sum + parseFloat(g.percentage), 0) / examGrades.length
              return (
                <div key={examName} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-2 mt-3">
                    <h4 className="text-sm font-semibold text-secondary-700">{examName}</h4>
                    <span className="text-xs text-secondary-500">Avg: {avgPct.toFixed(1)}%</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-secondary-200">
                          <th className="text-left py-2 px-3 text-secondary-500 font-medium">Student</th>
                          <th className="text-left py-2 px-3 text-secondary-500 font-medium">Subject</th>
                          <th className="text-left py-2 px-3 text-secondary-500 font-medium">Marks</th>
                          <th className="text-left py-2 px-3 text-secondary-500 font-medium">Percentage</th>
                          <th className="text-left py-2 px-3 text-secondary-500 font-medium">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examGrades.map((grade) => (
                          <tr key={grade.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                            <td className="py-2 px-3 font-medium text-secondary-900">{grade.student?.name || 'Unknown'}</td>
                            <td className="py-2 px-3 text-secondary-600">{grade.exam?.subject?.name || 'N/A'}</td>
                            <td className="py-2 px-3 text-secondary-600">{grade.marks_obtained} / {grade.exam?.total_marks || 100}</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-secondary-200 rounded-full h-2">
                                  <div className={`h-2 rounded-full ${
                                    grade.percentage >= 80 ? 'bg-accent-500' :
                                    grade.percentage >= 60 ? 'bg-primary-500' :
                                    grade.percentage >= 40 ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }`} style={{ width: `${Math.min(grade.percentage, 100)}%` }} />
                                </div>
                                <span className="text-xs font-medium text-secondary-700">{grade.percentage}%</span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getGradeColor(grade.grade)}`}>
                                {grade.grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </Card>
        )
      })}

      {grades.length === 0 && (
        <div className="text-center py-12 text-secondary-500">
          <Award className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
          <p className="text-lg font-medium">No grades available yet</p>
          <p className="text-sm">Grades will appear here once exams are graded.</p>
        </div>
      )}
    </div>
  )
}

export default Grades
