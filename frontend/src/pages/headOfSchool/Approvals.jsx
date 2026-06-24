import { useEffect, useState, useCallback } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import {
  FileText, ShieldAlert, DollarSign, Award, GraduationCap,
  Send, CheckCircle, XCircle, AlertCircle, Eye, Plus, Search, Clock, Filter, User, X
} from 'lucide-react'
import axios from 'axios'

const CATEGORY_LABELS = {
  all: 'All',
  grade_submissions: 'Grade Submissions',
  transcripts: 'Transcripts',
  permission: 'Permission',
  results: 'Results',
  salary: 'Salary',
  bonus: 'Bonus',
  transcript: 'Transcript',
  transfer: 'Transfer',
  disciplinary: 'Disciplinary',
  other: 'Other',
}

const CATEGORY_ICONS = {
  grade_submissions: FileText,
  transcripts: GraduationCap,
  permission: ShieldAlert,
  results: Award,
  salary: DollarSign,
  bonus: DollarSign,
  transcript: GraduationCap,
  transfer: Send,
  disciplinary: AlertCircle,
  other: FileText,
}

const CATEGORY_COLORS = {
  grade_submissions: 'bg-blue-100 text-blue-700',
  transcripts: 'bg-purple-100 text-purple-700',
  permission: 'bg-indigo-100 text-indigo-700',
  results: 'bg-teal-100 text-teal-700',
  salary: 'bg-cyan-100 text-cyan-700',
  bonus: 'bg-amber-100 text-amber-700',
  transcript: 'bg-violet-100 text-violet-700',
  transfer: 'bg-orange-100 text-orange-700',
  disciplinary: 'bg-rose-100 text-rose-700',
  other: 'bg-slate-100 text-slate-700',
}

const CATEGORY_GROUP = {
  salary: { label: 'Staff', style: 'bg-purple-100 text-purple-700' },
  bonus: { label: 'Staff', style: 'bg-purple-100 text-purple-700' },
  permission: { label: 'Student', style: 'bg-teal-100 text-teal-700' },
  results: { label: 'Student', style: 'bg-teal-100 text-teal-700' },
  transcript: { label: 'Student', style: 'bg-teal-100 text-teal-700' },
  transfer: { label: 'Student', style: 'bg-teal-100 text-teal-700' },
  disciplinary: { label: 'Student', style: 'bg-teal-100 text-teal-700' },
  grade_submissions: { label: 'Student', style: 'bg-teal-100 text-teal-700' },
  transcripts: { label: 'Student', style: 'bg-teal-100 text-teal-700' },
}

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

const CreateApprovalModal = ({ open, onClose, onSubmit, apiPrefix }) => {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    category: '', title: '', description: '',
    approvable_type: '', approvable_id: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      axios.get(`${apiPrefix}/approvals/categories`)
        .then(({ data }) => setCategories(data.categories || data))
        .catch(() => setCategories([]))
      setForm({ category: '', title: '', description: '', approvable_type: '', approvable_id: '' })
    }
  }, [open, apiPrefix])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await axios.post(`${apiPrefix}/approvals`, {
        ...form,
        approvable_id: parseInt(form.approvable_id, 10) || null,
      })
      onSubmit()
      onClose()
    } catch (err) {
      console.error('Error creating approval:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">New Approval Request</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary-100 rounded">
            <X className="w-5 h-5 text-secondary-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] || cat}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
          />
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[100px]"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
            />
          </div>
          <Input
            label="Approvable Type"
            value={form.approvable_type}
            onChange={e => setForm(f => ({ ...f, approvable_type: e.target.value }))}
            placeholder="e.g. App\Models\User"
          />
          <Input
            label="Approvable ID"
            type="number"
            value={form.approvable_id}
            onChange={e => setForm(f => ({ ...f, approvable_id: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              <Send className="w-4 h-4 mr-1" />
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

const HoSApprovals = ({ apiPrefix = '/api/head-of-school' }) => {
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [pendingCounts, setPendingCounts] = useState({})
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeStatus, setActiveStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [responseNotes, setResponseNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchApprovals = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeCategory !== 'all') params.set('category', activeCategory)
      if (activeStatus) params.set('status', activeStatus)
      const qs = params.toString()
      const { data } = await axios.get(`${apiPrefix}/approvals${qs ? `?${qs}` : ''}`)
      setApprovals(data.approvals || data.data || data)
    } catch (err) {
      console.error('Error fetching approvals:', err)
      setApprovals([])
    } finally {
      setLoading(false)
    }
  }, [apiPrefix, activeCategory, activeStatus])

  const fetchMeta = useCallback(async () => {
    try {
      const [catRes, countRes] = await Promise.all([
        axios.get(`${apiPrefix}/approvals/categories`),
        axios.get(`${apiPrefix}/approvals/pending-counts`),
      ])
      setCategories(catRes.data.categories || catRes.data)
      setPendingCounts(countRes.data.counts || countRes.data)
    } catch (err) {
      console.error('Error fetching metadata:', err)
    }
  }, [apiPrefix])

  useEffect(() => { fetchMeta() }, [fetchMeta])
  useEffect(() => { fetchApprovals() }, [fetchApprovals])

  const handleRespond = async (id, status) => {
    setSubmitting(true)
    try {
      await axios.put(`${apiPrefix}/approvals/${id}/respond`, {
        status,
        response_notes: responseNotes,
      })
      setApprovals(prev => prev.filter(a => a.id !== id))
      setSelected(null)
      setResponseNotes('')
      fetchMeta()
    } catch (err) {
      console.error('Error responding to approval:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const allTabs = [
    'all',
    ...(pendingCounts.grade_submissions !== undefined ? ['grade_submissions'] : []),
    ...(pendingCounts.transcripts !== undefined ? ['transcripts'] : []),
    ...(categories || []).filter(c => c !== 'grade_submissions' && c !== 'transcripts'),
  ]

  const filteredApprovals = searchQuery
    ? approvals.filter(a => {
        const title = (a.title || '').toLowerCase()
        const requester = (typeof a.requester === 'string' ? a.requester : a.requester?.name || '').toLowerCase()
        const q = searchQuery.toLowerCase()
        return title.includes(q) || requester.includes(q)
      })
    : approvals

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const getRequesterName = (a) => {
    if (typeof a.requester === 'string') return a.requester
    return a.requester?.name || a.requester?.full_name || '-'
  }

  const getTargetName = (a) => {
    if (typeof a.target === 'string') return a.target
    return a.target?.name || a.target?.full_name || '-'
  }

  const activeCount = pendingCounts[activeCategory]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Approvals</h1>
          <p className="text-secondary-600 mt-1">Review and manage all approval requests</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1" />New Approval
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {allTabs.map(cat => {
            const count = pendingCounts[cat]
            const Icon = CATEGORY_ICONS[cat] || FileText
            const isActive = activeCategory === cat
            const colorClass = CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-700'
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {CATEGORY_LABELS[cat] || cat}
                {count !== undefined && (
                  <span className={`ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${colorClass}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by title or requester..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-secondary-500" />
            <select
              className="input w-auto"
              value={activeStatus}
              onChange={e => setActiveStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="text-center py-12 text-secondary-500">
            <CheckCircle className="w-16 h-16 mx-auto mb-3 text-green-300" />
            <p className="text-lg font-medium text-secondary-700">No approvals found</p>
            <p className="text-sm">Try changing your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Title</th>
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Category</th>
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Group</th>
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Requester</th>
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Target</th>
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Status</th>
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Created</th>
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApprovals.map(a => {
                  const catColor = CATEGORY_COLORS[a.category] || 'bg-gray-100 text-gray-700'
                  const statusColor = STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'
                  return (
                    <tr key={a.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="py-3 px-3 text-secondary-900 font-medium max-w-[200px] truncate">
                        {a.title || '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${catColor}`}>
                          {CATEGORY_LABELS[a.category] || a.category || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {CATEGORY_GROUP[a.category] && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_GROUP[a.category].style}`}>
                            {CATEGORY_GROUP[a.category].label}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-secondary-700 whitespace-nowrap">{getRequesterName(a)}</td>
                      <td className="py-3 px-3 text-secondary-700 whitespace-nowrap">{getTargetName(a)}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1) : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-secondary-500 whitespace-nowrap">{formatDate(a.created_at)}</td>
                      <td className="py-3 px-3">
                        {a.status === 'pending' ? (
                          <Button variant="primary" size="sm" onClick={() => { setSelected(a); setResponseNotes('') }}>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />Review
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => { setSelected(a); setResponseNotes('') }}>
                            <Eye className="w-3.5 h-3.5 mr-1" />View
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">
                {selected.status === 'pending' ? 'Review Approval' : 'Approval Details'}
              </h3>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-secondary-100 rounded">
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-secondary-700">
                <FileText className="w-4 h-4 text-primary-500 shrink-0" />
                <span className="font-medium">Title:</span>
                <span>{selected.title}</span>
              </div>
              <div className="flex items-center gap-2 text-secondary-700">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[selected.category] || 'bg-gray-100 text-gray-700'}`}>
                  {CATEGORY_LABELS[selected.category] || selected.category}
                </span>
              </div>
              <div className="flex items-center gap-2 text-secondary-700">
                <User className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="font-medium">Requester:</span>
                <span>{getRequesterName(selected)}</span>
              </div>
              <div className="flex items-center gap-2 text-secondary-700">
                <User className="w-4 h-4 text-accent-500 shrink-0" />
                <span className="font-medium">Target:</span>
                <span>{getTargetName(selected)}</span>
              </div>
              {selected.description && (
                <div className="text-secondary-700 bg-secondary-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-secondary-500 mb-1">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{selected.description}</p>
                </div>
              )}
              <div className="flex items-center gap-2 text-secondary-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>Created {formatDate(selected.created_at)}</span>
              </div>
            </div>
            {selected.status === 'pending' ? (
              <>
                <div className="mb-6">
                  <label className="label">Response Notes</label>
                  <textarea
                    className="input min-h-[80px]"
                    value={responseNotes}
                    onChange={e => setResponseNotes(e.target.value)}
                    placeholder="Add notes (optional)"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => { setSelected(null); setResponseNotes('') }}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={() => handleRespond(selected.id, 'rejected')} disabled={submitting}>
                    <XCircle className="w-4 h-4 mr-1" />Reject
                  </Button>
                  <Button variant="primary" onClick={() => handleRespond(selected.id, 'approved')} disabled={submitting}>
                    <CheckCircle className="w-4 h-4 mr-1" />Approve
                  </Button>
                </div>
              </>
            ) : (
              <>
                {selected.response_notes && (
                  <div className="mb-6">
                    <label className="label">Response Notes</label>
                    <p className="text-sm text-secondary-700 bg-secondary-50 rounded-lg p-3">{selected.response_notes}</p>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={() => setSelected(null)}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <CreateApprovalModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={() => { fetchApprovals(); fetchMeta() }}
        apiPrefix={apiPrefix}
      />
    </div>
  )
}

export default HoSApprovals
