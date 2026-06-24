import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import { TrendingUp, Users, GraduationCap, DollarSign, School, UserCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import axios from 'axios'

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const Analytics = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAnalytics() }, [])

  const fetchAnalytics = async () => {
    try {
      const { data: res } = await axios.get('/api/super-admin/analytics')
      setData(res)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
  if (!data) return <div className="text-center py-12 text-secondary-400">Failed to load analytics</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Cross-Tenant Analytics</h1>
        <p className="text-secondary-500 text-sm">High-level metrics across all schools</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Schools', value: data.overview?.total_schools, icon: School, color: 'from-primary-500 to-primary-600' },
          { label: 'Active', value: data.overview?.active_schools, icon: UserCheck, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Students', value: data.overview?.total_students, icon: GraduationCap, color: 'from-violet-500 to-violet-600' },
          { label: 'Teachers', value: data.overview?.total_teachers, icon: Users, color: 'from-orange-500 to-orange-600' },
          { label: 'Collected', value: data.revenue?.total_collected ? `$${data.revenue.total_collected}` : '$0', icon: DollarSign, color: 'from-cyan-500 to-cyan-600' },
          { label: 'Pending', value: data.revenue?.total_pending ? `$${data.revenue.total_pending}` : '$0', icon: TrendingUp, color: 'from-rose-500 to-rose-600' },
        ].map((s, i) => (
          <div key={i} className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${s.color} p-4 shadow-sm`}>
            <p className="text-white/70 text-[11px] font-medium uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value || 0}</p>
            <s.icon className="absolute right-2 bottom-2 w-8 h-8 text-white/20" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-base font-semibold mb-4">Role Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={(data.role_distribution || []).map(r => ({ name: r.role, value: r.count }))}
                dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {(data.role_distribution || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="text-base font-semibold mb-4">Top Schools by Revenue</h2>
          <div className="space-y-3">
            {(data.top_schools || []).map((s, i) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-secondary-400 w-5">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-secondary-900">{s.name}</p>
                    <p className="text-xs text-secondary-500">{s.student_count || 0} students</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-primary-600">${s.total_collected || 0}</span>
              </div>
            ))}
            {(data.top_schools || []).length === 0 && (
              <p className="text-center py-8 text-secondary-400">No data yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Analytics
