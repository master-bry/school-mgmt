import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import { Calendar, Clock, BookOpen, Users, Search, MapPin, Filter, SlidersHorizontal } from 'lucide-react'
import axios from 'axios'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const Timetable = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    academic_year: '', term: '', venue: '', timetable_type: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!user) return
    if (user.role !== 'student') {
      navigate('/dashboard')
      return
    }
    fetchTimetable()
  }, [user, navigate, filters])

  const fetchTimetable = async () => {
    setLoading(true)
    try {
      const params = {}
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      const response = await axios.get('/api/student/timetables', { params })
      const data = response.data || []
      setTimetable(data)
    } catch (error) {
      console.error('Error fetching timetable:', error)
      setTimetable([])
    } finally {
      setLoading(false)
    }
  }

  const groupedByDay = {}
  DAYS.forEach(day => {
    const lower = day.toLowerCase()
    groupedByDay[day] = timetable.filter(t => t.day?.toLowerCase() === lower)
  })

  const timeSlots = timetable.map(t => t.start_time).filter(Boolean)
  const uniqueTimes = [...new Set(timeSlots)].sort()

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
            <Calendar className="w-4 h-4" />
            <span>Timetable</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Class Timetable</h1>
          <p className="text-secondary-500 mt-0.5">View your scheduled classes and sessions</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 border border-secondary-200 rounded-lg text-sm text-secondary-700 hover:bg-secondary-50 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {showFilters && (
        <Card className="animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-secondary-600 mb-1 block">Academic Year</label>
              <input type="text" className="input" placeholder="e.g. 2026"
                value={filters.academic_year}
                onChange={(e) => setFilters({ ...filters, academic_year: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-secondary-600 mb-1 block">Term / Semester</label>
              <input type="text" className="input" placeholder="e.g. Semester 1"
                value={filters.term}
                onChange={(e) => setFilters({ ...filters, term: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-secondary-600 mb-1 block">Venue</label>
              <input type="text" className="input" placeholder="e.g. Building A"
                value={filters.venue}
                onChange={(e) => setFilters({ ...filters, venue: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-secondary-600 mb-1 block">Type</label>
              <select className="input" value={filters.timetable_type}
                onChange={(e) => setFilters({ ...filters, timetable_type: e.target.value })}>
                <option value="">All Types</option>
                <option value="class">Class</option>
                <option value="exam">Exam</option>
                <option value="lab">Lab</option>
                <option value="study">Study Session</option>
                <option value="sports">Sports</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={() => setFilters({ academic_year: '', term: '', venue: '', timetable_type: '' })}
              className="text-sm text-primary-600 hover:text-primary-700">
              Clear Filters
            </button>
          </div>
        </Card>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-secondary-100 p-3 text-left text-secondary-700 font-medium min-w-[100px]">
                <Clock className="w-4 h-4 inline mr-1" /> Time
              </th>
              {DAYS.map((day) => (
                <th key={day} className="bg-secondary-100 p-3 text-left text-secondary-700 font-medium min-w-[150px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uniqueTimes.length === 0 || timetable.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-secondary-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
                  <p className="text-lg font-medium">No timetable available</p>
                  <p className="text-sm">Try adjusting your filters or check back later.</p>
                </td>
              </tr>
            ) : (
              uniqueTimes.map((time) => (
                <tr key={time}>
                  <td className="border border-secondary-200 p-3 font-medium text-secondary-700">
                    {time.substring(0, 5)}
                  </td>
                  {DAYS.map((day) => {
                    const entries = groupedByDay[day]?.filter(t => t.start_time === time) || []
                    return (
                      <td key={day} className="border border-secondary-200 p-2">
                        {entries.map((entry, i) => (
                          <div key={i}
                            className="bg-primary-50 border border-primary-200 rounded-lg p-2 mb-1 last:mb-0">
                            <p className="font-medium text-primary-700 text-sm">
                              {entry.subject?.name || 'Subject'}
                            </p>
                            <p className="text-xs text-primary-500 mt-0.5">
                              {entry.teacher?.name || 'Teacher'}
                            </p>
                            {entry.room_number && (
                              <p className="text-xs text-primary-400 mt-0.5">Room: {entry.room_number}</p>
                            )}
                            {entry.venue && (
                              <p className="text-xs text-primary-400 mt-0.5 flex items-center space-x-0.5">
                                <MapPin className="w-3 h-3 inline" /> {entry.venue}
                              </p>
                            )}
                            <p className="text-xs text-primary-400 mt-0.5">
                              {entry.start_time?.substring(0, 5)} - {entry.end_time?.substring(0, 5)}
                            </p>
                            {entry.timetable_type && entry.timetable_type !== 'class' && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary-200 text-primary-800 uppercase">
                                {entry.timetable_type}
                              </span>
                            )}
                          </div>
                        ))}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Timetable
