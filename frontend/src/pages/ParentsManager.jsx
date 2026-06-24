import { useState, useEffect } from 'react'
import Card from '../components/Card'
import { Users, Search, User, Eye, X, Mail, ChevronDown, ChevronUp, DollarSign, FileText, CheckCircle, Clock, AlertTriangle, Send } from 'lucide-react'
import axios from 'axios'

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-secondary-100 text-secondary-600',
  suspended: 'bg-amber-100 text-amber-700',
  transferred: 'bg-blue-100 text-blue-700',
  withdrawn: 'bg-red-100 text-red-700',
  expelled: 'bg-red-100 text-red-700',
}

const statusLabel = (s) => {
  if (s === 'active') return 'Active'
  if (s === 'suspended') return 'Suspended'
  if (s === 'transferred') return 'Transferred'
  if (s === 'withdrawn') return 'Withdrawn'
  if (s === 'expelled') return 'Expelled'
  return 'Inactive'
}

const ViewParentModal = ({ parent, onClose, isCashier, apiPrefix, onReminderSent }) => {
  const [expanded, setExpanded] = useState({})
  const [sending, setSending] = useState(false)
  const [reminderMsg, setReminderMsg] = useState('')

  if (!parent) return null

  const toggleChild = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  const sendReminder = async () => {
    if (!confirm('Send fee reminder to this parent?')) return
    setSending(true)
    try {
      await axios.post(`${apiPrefix}/parents/${parent.id}/fee-reminder`, { message: reminderMsg || undefined })
      onReminderSent?.()
    } catch {
      alert('Failed to send reminder')
    } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">Parent Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center space-x-4 mb-6 p-4 bg-secondary-50 rounded-lg">
          <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
            <User className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-secondary-900">{parent.name}</h4>
            <p className="text-sm text-secondary-500">{parent.email}</p>
            {parent.phone && <p className="text-sm text-secondary-400">{parent.phone}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-primary-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary-700">{parent.children_count}</p>
            <p className="text-xs text-primary-600">Children</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">{parent.notifications?.results_sent || 0}</p>
            <p className="text-xs text-emerald-600">Results Sent</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{parent.notifications?.reminders_sent || 0}</p>
            <p className="text-xs text-amber-600">Reminders</p>
          </div>
        </div>

        {isCashier && (
          <div className="mb-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <label className="text-sm font-medium text-amber-800 mb-1 block">Send Fee Reminder</label>
            <div className="flex gap-2">
              <input value={reminderMsg} onChange={e => setReminderMsg(e.target.value)}
                placeholder="Optional custom message..." className="input flex-1 text-sm" />
              <button onClick={sendReminder} disabled={sending}
                className="btn btn-primary btn-sm flex items-center gap-1.5">
                <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        )}

        <h5 className="text-sm font-semibold text-secondary-700 mb-3">Children ({parent.children?.length || 0})</h5>
        <div className="space-y-2">
          {(parent.children || []).map(child => (
            <div key={child.id} className="border border-secondary-200 rounded-lg overflow-hidden">
              <button onClick={() => toggleChild(child.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-secondary-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-secondary-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-secondary-900">{child.name}</p>
                    <p className="text-xs text-secondary-400">{child.grade} {child.section ? `• ${child.section}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[child.status] || statusColors.inactive}`}>
                    {statusLabel(child.status)}
                  </span>
                  {expanded[child.id] ? <ChevronUp className="w-4 h-4 text-secondary-400" /> : <ChevronDown className="w-4 h-4 text-secondary-400" />}
                </div>
              </button>
              {expanded[child.id] && (
                <div className="px-3 pb-3 pt-0 border-t border-secondary-100 bg-secondary-50/50">
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-white rounded-lg p-3 border border-secondary-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <DollarSign className="w-3.5 h-3.5 text-secondary-400" />
                        <p className="text-xs text-secondary-500">Fee Status</p>
                      </div>
                      <p className="text-sm font-medium text-secondary-900">
                        ${(child.fees?.total_paid || 0).toFixed(2)} / ${(child.fees?.total_fees || 0).toFixed(2)} paid
                      </p>
                      {child.fees?.pending > 0 && (
                        <p className="text-xs text-amber-600 mt-0.5">${(child.fees?.pending || 0).toFixed(2)} pending</p>
                      )}
                      {child.fees?.overdue_fees > 0 && (
                        <p className="text-xs text-red-600">{child.fees.overdue_fees} overdue fee(s)</p>
                      )}
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-secondary-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-secondary-400" />
                        <p className="text-xs text-secondary-500">Status</p>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[child.status] || statusColors.inactive}`}>
                        {statusLabel(child.status)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {(!parent.children || parent.children.length === 0) && (
            <p className="text-sm text-secondary-400 text-center py-4">No children assigned</p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-secondary-100">
          <div className="flex justify-between py-2">
            <span className="text-sm text-secondary-500">Registered Since</span>
            <span className="text-sm font-medium text-secondary-900">
              {parent.created_at ? new Date(parent.created_at).toLocaleDateString() : '-'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}

const ParentsManager = ({ apiPrefix, title, subtitle, isCashier = false }) => {
  const [parents, setParents] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [viewTarget, setViewTarget] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchParents() }, [])

  const fetchParents = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${apiPrefix}/parents`)
      setParents(data.parents || [])
      setTotal(data.total || 0)
    } catch {
      setParents([])
      setTotal(0)
    } finally { setLoading(false) }
  }

  const filtered = parents.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return [p.name, p.email, p.phone].some(f => f?.toLowerCase().includes(q)) ||
      (p.children || []).some(c => c.name?.toLowerCase().includes(q))
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>
          <p className="text-secondary-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-secondary-500 bg-secondary-50 px-4 py-2 rounded-lg">
          <Users className="w-4 h-4" />
          <span><strong className="text-secondary-900">{total}</strong> unique parent{total !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
        <input type="text" placeholder="Search parents or children..." value={search}
          onChange={e => setSearch(e.target.value)} className="input pl-10" />
      </div>

      <div className="space-y-3">
        {filtered.map(parent => (
          <Card key={parent.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-secondary-900 truncate">{parent.name}</p>
                  <p className="text-xs text-secondary-400 truncate">{parent.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-3 text-xs text-secondary-500">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{parent.children_count}</span>
                  <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{parent.notifications?.results_sent || 0}</span>
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{parent.notifications?.reminders_sent || 0}</span>
                </div>
                <button onClick={() => setViewTarget(parent)}
                  className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="View details">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            {parent.children?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-secondary-100 flex flex-wrap gap-2">
                {parent.children.slice(0, 4).map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1.5 px-2 py-1 bg-secondary-50 rounded-md text-xs text-secondary-600">
                    <span className={`w-2 h-2 rounded-full ${
                      c.status === 'active' ? 'bg-emerald-500' :
                      c.status === 'suspended' ? 'bg-amber-500' :
                      c.status === 'transferred' ? 'bg-blue-500' :
                      c.status === 'withdrawn' || c.status === 'expelled' ? 'bg-red-500' :
                      'bg-secondary-300'
                    }`} />
                    {c.name}
                    <span className="text-secondary-400">{c.grade}</span>
                    {c.fees?.pending > 0 && <span className="text-amber-600 font-medium">${(c.fees.pending).toFixed(0)}</span>}
                  </span>
                ))}
                {parent.children.length > 4 && (
                  <span className="px-2 py-1 text-xs text-secondary-400">+{parent.children.length - 4} more</span>
                )}
              </div>
            )}
          </Card>
        ))}
        {!loading && filtered.length === 0 && (
          <Card className="p-12 text-center text-secondary-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No parents found</p>
          </Card>
        )}
        {loading && (
          <Card className="p-12 text-center text-secondary-400">
            <p>Loading...</p>
          </Card>
        )}
      </div>

      {viewTarget && (
        <ViewParentModal
          parent={viewTarget}
          onClose={() => setViewTarget(null)}
          isCashier={isCashier}
          apiPrefix={apiPrefix}
          onReminderSent={fetchParents}
        />
      )}
    </div>
  )
}

export default ParentsManager
