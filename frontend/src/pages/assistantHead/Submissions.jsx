import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import { ClipboardCheck, Search, FileText, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import axios from 'axios'

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-blue-100 text-blue-700',
  forwarded: 'bg-violet-100 text-violet-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  published: 'bg-emerald-100 text-emerald-700',
}

const AHSubmissions = () => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { fetchSubmissions() }, [])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/assistant-head/submissions')
      setSubmissions(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const statuses = [...new Set(submissions.map(s => s.status))]
  const filtered = submissions.filter(s => {
    const matchSearch = !search || [s.exam?.subject?.name, s.class?.name, s.submittedBy?.name].some(f => f?.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = !statusFilter || s.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Grade Submissions</h1>
        <p className="text-secondary-500 mt-0.5">Monitor grade submissions across classes</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: submissions.length, icon: ClipboardCheck, color: 'from-primary-500 to-primary-600' },
          { label: 'Pending', value: submissions.filter(s => s.status === 'pending').length, icon: Clock, color: 'from-amber-500 to-amber-600' },
          { label: 'Forwarded', value: submissions.filter(s => s.status === 'forwarded').length, icon: AlertCircle, color: 'from-violet-500 to-violet-600' },
          { label: 'Approved', value: submissions.filter(s => s.status === 'approved').length, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
        ].map((s, i) => (
          <div key={i} className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${s.color} p-4 shadow-sm`}>
            <p className="text-white/70 text-[11px] font-medium uppercase">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
            <s.icon className="absolute right-2 bottom-2 w-8 h-8 text-white/20" />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input type="text" placeholder="Search subject, class, teacher..." value={search}
            onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <select className="input w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200 bg-secondary-50/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Subject</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Class</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Teacher</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-secondary-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-violet-600" />
                      </div>
                      <p className="text-sm font-medium text-secondary-900">{s.exam?.subject?.name || '-'}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-secondary-600">{s.class?.name}</td>
                  <td className="py-3 px-4 text-sm text-secondary-600">{s.submittedBy?.name}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[s.status] || 'bg-secondary-100 text-secondary-700'}`}>
                      {s.status?.charAt(0).toUpperCase() + s.status?.slice(1) || 'Unknown'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-secondary-600">{s.created_at ? new Date(s.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="5" className="py-12 text-center text-secondary-400"><ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No submissions found</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default AHSubmissions