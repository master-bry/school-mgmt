import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { ClipboardCheck, X, CheckCircle, XCircle, Send, Upload, AlertCircle, Eye } from 'lucide-react'
import axios from 'axios'

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  published: 'bg-blue-100 text-blue-700',
}

const ReviewModal = ({ submission, onClose, onDone }) => {
  const [status, setStatus] = useState('approved')
  const [reviewNotes, setReviewNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await axios.put(`/api/academician/submissions/${submission.id}/review`, { status, review_notes: reviewNotes })
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to review submission')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">Review Submission</h3>
            <p className="text-sm text-secondary-500 mt-0.5">Approve or reject this submission</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submission.exam && (
          <div className="mb-4 p-3 rounded-lg bg-secondary-50 text-sm space-y-1">
            <p><span className="font-medium text-secondary-700">Exam:</span> {submission.exam.name || submission.exam.title}</p>
            <p><span className="font-medium text-secondary-700">Class:</span> {submission.class?.name || submission.class_name}</p>
            <p><span className="font-medium text-secondary-700">Teacher:</span> {submission.teacher?.name || submission.teacher_name}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Decision</label>
            <div className="flex space-x-4 mt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="status" value="approved" checked={status === 'approved'}
                  onChange={e => setStatus(e.target.value)} className="w-4 h-4 text-emerald-600" />
                <div className="flex items-center space-x-1 text-sm font-medium text-emerald-700">
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve</span>
                </div>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="status" value="rejected" checked={status === 'rejected'}
                  onChange={e => setStatus(e.target.value)} className="w-4 h-4 text-red-600" />
                <div className="flex items-center space-x-1 text-sm font-medium text-red-700">
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="label">Review Notes</label>
            <textarea className="input" rows={3} value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              placeholder={status === 'rejected' ? 'Explain why this submission was rejected...' : 'Optional notes...'} />
          </div>

          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Submitting...' : 'Submit Review'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

const Submissions = () => {
  const [tab, setTab] = useState('pending')
  const [pending, setPending] = useState([])
  const [published, setPublished] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewTarget, setReviewTarget] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchData() }, [tab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (tab === 'pending') {
        const { data } = await axios.get('/api/academician/submissions/pending')
        setPending(Array.isArray(data) ? data : data.data || [])
      } else {
        const { data } = await axios.get('/api/academician/results/combined')
        setPublished(Array.isArray(data) ? data : data.data || [])
      }
    } catch (e) {
      console.error('Failed to fetch submissions:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleForward = async (id) => {
    setActionLoading(id)
    try {
      await axios.post(`/api/academician/submissions/${id}/forward`)
      setPending(prev => prev.filter(s => s.id !== id))
    } catch (e) {
      console.error('Failed to forward:', e)
    } finally {
      setActionLoading(null)
    }
  }

  const handlePublish = async (id) => {
    setActionLoading(id)
    try {
      await axios.post(`/api/academician/submissions/${id}/publish`)
      setPending(prev => prev.filter(s => s.id !== id))
    } catch (e) {
      console.error('Failed to publish:', e)
    } finally {
      setActionLoading(null)
    }
  }

  const items = tab === 'pending' ? pending : published

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
          <ClipboardCheck className="w-4 h-4" />
          <span>Academician</span>
        </div>
        <h1 className="text-2xl font-bold text-secondary-900">Submissions & Results</h1>
        <p className="text-secondary-500 mt-0.5">Review, approve, and publish exam results</p>
      </div>

      <div className="flex space-x-1 bg-secondary-100 rounded-lg p-1 w-fit">
        {[
          { id: 'pending', label: 'Pending Review', icon: ClipboardCheck },
          { id: 'published', label: 'Published Results', icon: Upload },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-secondary-500 hover:text-secondary-700'
            }`}>
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
            {t.id === 'pending' && pending.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200 bg-secondary-50/50">
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Exam</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Class</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Teacher</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Status</th>
                <th className="text-right py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {items.map(s => (
                <tr key={s.id} className="hover:bg-secondary-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ClipboardCheck className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-secondary-900">{s.exam?.name || s.exam?.title || 'Exam'}</p>
                        <p className="text-xs text-secondary-400">{s.subject?.name || s.subject_name || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-secondary-600">{s.class?.name || s.class_name}</td>
                  <td className="py-3.5 px-4 text-sm text-secondary-600">{s.teacher?.name || s.teacher_name}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[s.status] || 'bg-secondary-100 text-secondary-600'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {tab === 'pending' && (
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => setReviewTarget(s)}
                          className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Review">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleForward(s.id)} disabled={actionLoading === s.id}
                          className="p-2 text-secondary-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          title="Forward to Head">
                          <Send className="w-4 h-4" />
                        </button>
                        <button onClick={() => handlePublish(s.id)} disabled={actionLoading === s.id}
                          className="p-2 text-secondary-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Publish">
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {tab === 'published' && (
                      <span className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-700">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Published</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <ClipboardCheck className="w-8 h-8 text-secondary-300 mx-auto mb-2" />
                    <p className="text-sm text-secondary-500">{tab === 'pending' ? 'No pending submissions' : 'No published results yet'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {reviewTarget && (
        <ReviewModal
          submission={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onDone={() => { setReviewTarget(null); fetchData() }}
        />
      )}
    </div>
  )
}

export default Submissions
