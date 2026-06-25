import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import { Users, Calendar, BookOpen, DollarSign } from 'lucide-react'
import axios from 'axios'

const Children = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'parent') {
      navigate('/dashboard')
      return
    }
    fetchChildren()
  }, [user, navigate])

  const fetchChildren = async () => {
    try {
      const response = await axios.get('/api/parent/dashboard')
      setChildren(response.data.children || [])
    } catch (error) {
      console.error('Error fetching children:', error)
    } finally {
      setLoading(false)
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
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <Users className="w-8 h-8 text-primary-600" />
        <h2 className="text-2xl font-semibold text-secondary-900">My Children</h2>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-12 text-secondary-500">
          <Users className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
          <p className="text-lg font-medium">No children linked</p>
          <p className="text-sm">No children are linked to your parent account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => {
            const student = child.user || child
            return (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-600">
                    {student.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900 text-lg">{student.name}</h3>
                  <p className="text-sm text-secondary-600">
                    {student.class?.name || child.class?.name || 'No class assigned'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate(`/dashboard/child/${student.id}/attendance`)}
                  className="p-3 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors text-left"
                >
                  <Calendar className="w-5 h-5 text-primary-600 mb-1" />
                  <p className="text-sm font-medium text-secondary-900">Attendance</p>
                  <p className="text-xs text-secondary-600">View records</p>
                </button>
                <button
                  onClick={() => navigate(`/dashboard/child/${student.id}/grades`)}
                  className="p-3 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors text-left"
                >
                  <BookOpen className="w-5 h-5 text-accent-600 mb-1" />
                  <p className="text-sm font-medium text-secondary-900">Grades</p>
                  <p className="text-xs text-secondary-600">View results</p>
                </button>
                <button
                  onClick={() => navigate(`/dashboard/child/${student.id}/fees`)}
                  className="p-3 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors text-left col-span-2"
                >
                  <DollarSign className="w-5 h-5 text-orange-600 mb-1" />
                  <p className="text-sm font-medium text-secondary-900">Fees</p>
                  <p className="text-xs text-secondary-600">Check payment status</p>
                </button>
              </div>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Children
