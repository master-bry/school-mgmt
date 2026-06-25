import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import { BookOpen, TrendingUp, Award, Plus } from 'lucide-react'
import axios from 'axios'

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
  const [gradeData, setGradeData] = useState({})
  const [submitting, setSubmitting] = useState(false)

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
    setGradeData({})
    setStudents([])
    if (val) {
      const cls = classes.find(c => String(c.id) === String(val))
      setStudents(cls?.students || [])
    }
    loadExams(val)
  }

  const handleExamChange = (e) => {
    const val = e.target.value
    setSelectedExam(val)
    if (val) {
      const exam = exams.find(ex => String(ex.id) === String(val))
      if (exam) {
        const classStudents = students.filter(s => String(s.class_id) === String(exam.class_id))
        const initial = {}
        classStudents.forEach(s => { initial[s.id] = '' })
        setGradeData(initial)
      }
    }
  }

  const handleSubmitGrades = async () => {
    if (!selectedExam) return
    setSubmitting(true)
    try {
      const grades = Object.entries(gradeData)
        .filter(([, marks]) => marks !== '')
        .map(([studentId, marks]) => ({
          student_id: parseInt(studentId),
          marks_obtained: parseFloat(marks),
        }))
      await axios.post('/api/teacher/grades', {
        exam_id: parseInt(selectedExam),
        grades,
      })
      setMode('view')
      setGrades([])
    } catch (error) {
      console.error('Error submitting grades:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+': case 'A': return 'text-green-600 bg-green-100'
      case 'B+': case 'B': return 'text-blue-600 bg-blue-100'
      case 'C': return 'text-yellow-600 bg-yellow-100'
      case 'D': return 'text-orange-600 bg-orange-100'
      case 'F': return 'text-red-600 bg-red-100'
      default: return 'text-secondary-600 bg-secondary-100'
    }
  }

  const averageGrade = grades.length > 0
    ? (grades.reduce((sum, g) => sum + parseFloat(g.percentage), 0) / grades.length).toFixed(2)
    : 0

  const groupedByExam = grades.reduce((acc, grade) => {
    const examName = grade.exam?.name || 'Unknown Exam'
    if (!acc[examName]) acc[examName] = []
    acc[examName].push(grade)
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

        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Select Class</label>
              <select className="input" value={selectedClass}
                onChange={handleClassChange}>
                <option value="">Choose a class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Select Exam</label>
              <select className="input" value={selectedExam} onChange={handleExamChange}>
                <option value="">Choose an exam...</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name} - {ex.subject?.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {Object.keys(gradeData).length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 text-secondary-600 font-medium">Student</th>
                    <th className="text-left py-3 px-4 text-secondary-600 font-medium">Marks Obtained</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(gradeData).map(([studentId, marks]) => {
                    const student = students.find(s => String(s.id) === studentId)
                    return (
                      <tr key={studentId} className="border-b border-secondary-100 hover:bg-secondary-50">
                        <td className="py-3 px-4 font-medium text-secondary-900">{student?.name || 'Unknown'}</td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            className="input max-w-[150px]"
                            placeholder="Enter marks"
                            value={marks}
                            onChange={(e) => setGradeData({ ...gradeData, [studentId]: e.target.value })}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSubmitGrades} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Grades'}
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
              <p className="text-primary-100">Overall Average</p>
              <p className="text-3xl font-bold mt-1">{averageGrade}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-primary-200" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100">Total Exams</p>
              <p className="text-3xl font-bold mt-1">{grades.length}</p>
            </div>
            <BookOpen className="w-12 h-12 text-accent-200" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Subjects</p>
              <p className="text-3xl font-bold mt-1">{Object.keys(groupedByExam).length}</p>
            </div>
            <Award className="w-12 h-12 text-purple-200" />
          </div>
        </Card>
      </div>

      {Object.entries(groupedByExam).map(([examName, examGrades]) => (
        <Card key={examName} className="mb-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">{examName}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-4 text-secondary-600 font-medium">Subject</th>
                  <th className="text-left py-3 px-4 text-secondary-600 font-medium">Marks</th>
                  <th className="text-left py-3 px-4 text-secondary-600 font-medium">Percentage</th>
                  <th className="text-left py-3 px-4 text-secondary-600 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody>
                {examGrades.map((grade) => (
                  <tr key={grade.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="py-3 px-4 font-medium text-secondary-900">
                      {grade.exam?.subject?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-secondary-600">
                      {grade.marks_obtained} / {grade.exam?.total_marks || 100}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-secondary-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              grade.percentage >= 80 ? 'bg-accent-500' :
                              grade.percentage >= 60 ? 'bg-primary-500' :
                              grade.percentage >= 40 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(grade.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-secondary-700">{grade.percentage}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 text-sm font-bold rounded-full ${getGradeColor(grade.grade)}`}>
                        {grade.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

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
