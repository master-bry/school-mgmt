import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import { BarChart3, Users, CheckCircle, XCircle, GraduationCap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import axios from 'axios'

const AHPerformance = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/assistant-head/class-performance')
      setData(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>

  const chartData = data.map(c => ({
    name: c.name,
    students: c.students_count || 0,
    present: c.present_count || 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Class Performance</h1>
        <p className="text-secondary-500 mt-0.5">Monitor attendance and enrollment across classes</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Classes', value: data.length, icon: BarChart3, color: 'from-primary-500 to-primary-600' },
          { label: 'Total Students', value: data.reduce((s, c) => s + (c.students_count || 0), 0), icon: Users, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Total Present', value: data.reduce((s, c) => s + (c.present_count || 0), 0), icon: CheckCircle, color: 'from-violet-500 to-violet-600' },
          { label: 'Avg Attendance', value: (() => { const tot = data.reduce((s, c) => s + (c.students_count || 0), 0); return tot > 0 ? Math.round(data.reduce((s, c) => s + (c.present_count || 0), 0) / tot * 100) + '%' : '0%' })(), icon: GraduationCap, color: 'from-cyan-500 to-cyan-600' },
        ].map((s, i) => (
          <div key={i} className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${s.color} p-4 shadow-sm`}>
            <p className="text-white/70 text-[11px] font-medium uppercase">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
            <s.icon className="absolute right-2 bottom-2 w-8 h-8 text-white/20" />
          </div>
        ))}
      </div>

      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-secondary-900">Students per Class</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="students" fill="#4f46e5" name="Enrolled" radius={[4, 4, 0, 0]} />
            <Bar dataKey="present" fill="#10b981" name="Present Today" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200 bg-secondary-50/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Class</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Students</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Present Today</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Attendance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {data.map(c => {
                const rate = c.students_count > 0 ? Math.round((c.present_count || 0) / c.students_count * 100) : 0
                return (
                  <tr key={c.id || c.name} className="hover:bg-secondary-50/50">
                    <td className="py-3 px-4 text-sm font-medium text-secondary-900">{c.name}</td>
                    <td className="py-3 px-4 text-center text-sm text-secondary-600">{c.students_count || 0}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center space-x-1 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>{c.present_count || 0}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${
                        rate >= 80 ? 'bg-emerald-100 text-emerald-700' : rate >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>{rate}%</span>
                    </td>
                  </tr>
                )
              })}
              {data.length === 0 && (
                <tr><td colSpan="4" className="py-12 text-center text-secondary-400"><BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No class data available</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default AHPerformance