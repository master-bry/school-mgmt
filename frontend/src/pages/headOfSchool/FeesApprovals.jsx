import { useEffect, useState, useCallback } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import {
  DollarSign, CheckCircle, XCircle, Eye, Search,
  Clock, User, X, CreditCard, AlertTriangle
} from 'lucide-react'
import axios from 'axios'

const APPROVAL_STATUS_COLORS = {
  pending_cashier: 'bg-amber-100 text-amber-700',
  pending_hos: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}

const APPROVAL_STATUS_LABELS = {
  pending_cashier: 'Pending AH Review',
  pending_hos: 'Pending HOS Approval',
  approved: 'Approved',
  rejected: 'Rejected',
}

const FeesApprovals = ({ apiPrefix = '/api/head-of-school', statusFilter = 'pending_hos' }) => {
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchFees = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${apiPrefix}/fees/pending`)
      setFees(data || [])
    } catch (err) {
      console.error('Error fetching fees:', err)
      setFees([])
    } finally {
      setLoading(false)
    }
  }, [apiPrefix])

  useEffect(() => { fetchFees() }, [fetchFees])

  const handleAction = async (id, action) => {
    setSubmitting(true)
    try {
      await axios.put(`${apiPrefix}/fees/${id}/${statusFilter === 'pending_hos' ? 'approve' : 'review'}`, { action, notes })
      setFees(prev => prev.filter(f => f.id !== id))
      setSelected(null)
      setNotes('')
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const filteredFees = searchQuery
    ? fees.filter(f => {
        const studentName = (f.student?.first_name || '') + ' ' + (f.student?.last_name || '')
        const q = searchQuery.toLowerCase()
        return studentName.toLowerCase().includes(q) || (f.fee_type || '').toLowerCase().includes(q)
      })
    : fees

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Fees & Fines Approval</h1>
          <p className="text-secondary-600 mt-1">
            {statusFilter === 'pending_hos'
              ? 'Review and approve fees forwarded by Assistant Head'
              : 'Review pending fees from Cashier and forward to Head of School'
            }
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                className="input pl-9"
                placeholder="Search by student name or fee type..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="text-sm text-secondary-500">
            {fees.length} pending fee{fees.length !== 1 ? 's' : ''}
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredFees.length === 0 ? (
          <div className="text-center py-12 text-secondary-500">
            <CheckCircle className="w-16 h-16 mx-auto mb-3 text-green-300" />
            <p className="text-lg font-medium text-secondary-700">No pending fees</p>
            <p className="text-sm">All fees have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Student</th>
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Type</th>
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Fee Type</th>
                  <th className="text-right py-3 px-3 text-secondary-600 font-medium">Amount</th>
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Due Date</th>
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Status</th>
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.map(f => {
                  const studentName = f.student
                    ? `${f.student.first_name || ''} ${f.student.last_name || ''}`
                    : 'All Students'
                  const statusColor = APPROVAL_STATUS_COLORS[f.approval_status] || 'bg-gray-100 text-gray-600'
                  return (
                    <tr key={f.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="py-3 px-3 text-secondary-900 font-medium whitespace-nowrap">{studentName}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          f.type === 'fine' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {f.type === 'fine' ? <AlertTriangle className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                          {(f.type || 'fee').charAt(0).toUpperCase() + (f.type || 'fee').slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-secondary-700 capitalize">{f.fee_type || '-'}</td>
                      <td className="py-3 px-3 text-right font-medium text-secondary-900">
                        ${parseFloat(f.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-secondary-500 whitespace-nowrap">{formatDate(f.due_date)}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {APPROVAL_STATUS_LABELS[f.approval_status] || f.approval_status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Button variant="primary" size="sm" onClick={() => { setSelected(f); setNotes('') }}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />Review
                        </Button>
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
              <h3 className="text-lg font-semibold text-secondary-900">Review Fee</h3>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-secondary-100 rounded">
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-secondary-700">
                <User className="w-4 h-4 text-primary-500 shrink-0" />
                <span className="font-medium">Student:</span>
                <span>
                  {selected.student
                    ? `${selected.student.first_name || ''} ${selected.student.last_name || ''}`
                    : 'All Students'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-secondary-700">
                <CreditCard className="w-4 h-4 text-accent-500 shrink-0" />
                <span className="font-medium">Fee Type:</span>
                <span className="capitalize">{selected.fee_type || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-secondary-700">
                <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-medium">Amount:</span>
                <span className="font-semibold">${parseFloat(selected.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-secondary-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>Due: {formatDate(selected.due_date)}</span>
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
            <div className="mb-6">
              <label className="label">Notes</label>
              <textarea
                className="input min-h-[80px]"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes (optional)"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => { setSelected(null); setNotes('') }}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => handleAction(selected.id, 'reject')} disabled={submitting}>
                <XCircle className="w-4 h-4 mr-1" />Reject
              </Button>
              <Button variant="primary" onClick={() => handleAction(selected.id, 'approve')} disabled={submitting}>
                <CheckCircle className="w-4 h-4 mr-1" />
                {statusFilter === 'pending_hos' ? 'Final Approve' : 'Forward to HOS'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeesApprovals
