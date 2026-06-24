import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/Card'
import { MapPin, Calendar, Clock, Search } from 'lucide-react'
import axios from 'axios'

const StudentEvents = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'student') { navigate('/dashboard'); return }
    fetchEvents()
  }, [user])

  const fetchEvents = async () => {
    try {
      const res = await axios.get('/api/student/events')
      setEvents(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = events.filter(e =>
    !searchTerm || e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <Calendar className="w-4 h-4" />
          <span>School Calendar</span>
        </div>
        <h1 className="text-2xl font-bold text-secondary-900">Upcoming Events</h1>
        <p className="text-secondary-500 mt-0.5">School events, academic activities, and important dates</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
        <input type="text" placeholder="Search events..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Calendar className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500">No upcoming events</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event) => (
            <Card key={event.id}>
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  event.type === 'academic' ? 'bg-blue-100 text-blue-700' :
                  event.type === 'sports' ? 'bg-emerald-100 text-emerald-700' :
                  event.type === 'cultural' ? 'bg-purple-100 text-purple-700' :
                  'bg-secondary-100 text-secondary-600'
                }`}>
                  {event.type || 'General'}
                </span>
              </div>
              <h3 className="text-base font-semibold text-secondary-900 mb-2">{event.title}</h3>
              {event.description && (
                <p className="text-sm text-secondary-600 mb-3 line-clamp-2">{event.description}</p>
              )}
              <div className="space-y-1.5 text-xs text-secondary-500">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                {event.start_time && (
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{event.start_time.substring(0, 5)}{event.end_time ? ` - ${event.end_time.substring(0, 5)}` : ''}</span>
                  </div>
                )}
                {event.venue && (
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{event.venue}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentEvents
