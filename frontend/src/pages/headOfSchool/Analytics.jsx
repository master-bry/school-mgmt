import { useEffect, useState } from 'react'
import Card from '../../components/Card'
import {
  BarChart3, Users, CalendarCheck, DollarSign, TrendingUp,
  BookOpen, Award
} from 'lucide-react'
import axios from 'axios'

const HoSAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    students_per_class: [],
    attendance_by_class: [],
    fee_completion_rate: { completed: 0, pending: 0 },
    subject_performance: [],
  })

  useEffect(() => { fetchAnalytics() }, [])

  const fetchAnalytics = async () => {
    try {
      const { data } = await axios.get('/api/head-of-school/analytics')
      setAnalytics(data)
    } catch (err) {
      console.error('Error fetching analytics:', err)
    }
  }

  const maxStudents = Math.max(...(analytics.students_per_class?.map(s => s.count) || [1]), 1)
  const maxAttendance = Math.max(...(analytics.attendance_by_class?.map(a => a.percentage || a.present_count) || [1]), 1)
  const maxPerformance = Math.max(...(analytics.subject_performance?.map(s => s.average || s.score) || [1]), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Analytics</h1>
        <p className="text-secondary-600 mt-1">Performance overview across all dimensions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-secondary-900">Students Per Class</h2>
          </div>
          {analytics.students_per_class?.length > 0 ? (
            <div className="space-y-3">
              {analytics.students_per_class.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-secondary-700 font-medium">{item.class_name || item.name || item.class}</span>
                    <span className="text-secondary-600">{item.count} students</span>
                  </div>
                  <div className="w-full bg-secondary-100 rounded-full h-3">
                    <div className="bg-primary-500 h-3 rounded-full transition-all" style={{ width: `${(item.count / maxStudents) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary-400 text-center py-8">No data available</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="w-5 h-5 text-accent-500" />
            <h2 className="text-lg font-semibold text-secondary-900">Attendance By Class</h2>
          </div>
          {analytics.attendance_by_class?.length > 0 ? (
            <div className="space-y-3">
              {analytics.attendance_by_class.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-secondary-700 font-medium">{item.class_name || item.name || item.class}</span>
                    <span className="text-secondary-600">{item.percentage || Math.round((item.present_count / (item.total_count || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-secondary-100 rounded-full h-3">
                    <div className="bg-accent-500 h-3 rounded-full transition-all" style={{ width: `${item.percentage || (item.present_count / (item.total_count || 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary-400 text-center py-8">No data available</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-secondary-900">Fee Completion Rate</h2>
          </div>
          <div className="flex items-center justify-center py-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-secondary-200" fill="none" stroke="currentColor" strokeWidth="3.8" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-green-500" fill="none" stroke="currentColor" strokeWidth="3.8" strokeDasharray={`${analytics.fee_completion_rate?.completed || 0}, ${(analytics.fee_completion_rate?.completed || 0) + (analytics.fee_completion_rate?.pending || 1)}`} strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-secondary-900">
                    {Math.round((analytics.fee_completion_rate?.completed / ((analytics.fee_completion_rate?.completed || 0) + (analytics.fee_completion_rate?.pending || 1))) * 100)}%
                  </p>
                  <p className="text-sm text-secondary-500">Completed</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-secondary-700">Paid: {analytics.fee_completion_rate?.completed || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary-300" />
              <span className="text-secondary-700">Pending: {analytics.fee_completion_rate?.pending || 0}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-secondary-900">Subject Performance</h2>
          </div>
          {analytics.subject_performance?.length > 0 ? (
            <div className="space-y-3">
              {analytics.subject_performance.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-secondary-700 font-medium">{item.subject_name || item.name || item.subject}</span>
                    <span className="text-secondary-600">{item.average || item.score}%</span>
                  </div>
                  <div className="w-full bg-secondary-100 rounded-full h-3">
                    <div className="bg-purple-500 h-3 rounded-full transition-all" style={{ width: `${item.average || item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary-400 text-center py-8">No data available</p>
          )}
        </Card>
      </div>
    </div>
  )
}

export default HoSAnalytics