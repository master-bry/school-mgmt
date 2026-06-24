import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { FileText, CheckCircle, XCircle, X, AlertCircle, Clock, Search } from 'lucide-react'
import axios from 'axios'

const ApproveModal = ({ transcript, onClose, onSaved }) => {
  const [notes, setNotes] = useState('')
  const [action, setAction] = useState(null)

  const handleAction = async (status) => {
    setAction(status)
    try {
      const endpoint = status === 'approved' ? 'approve' : 'reject'
      await axios.post(`/api/head-of-school/transcripts/${transcript.id}/${endpoint}`, { head_notes: notes })
      onSaved()
    } catch (e) { console.error(e) }
    finally { setAction(null) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">Review Transcript</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-2 mb-4 text-sm">
          <p><strong>Student:</strong> {transcript.student?.name}</p>
          <p><strong>Class:</strong> {transcript.class?.name}</p>
          <p><strong>Submitted:</strong> {transcript.submitted_at ? new Date(transcript.submitted_at).toLocaleDateString() : '-'}</p>
          <p><strong>Term:</strong> {transcript.term || '-'}</p>
        </div>
        <textarea className="input w-full h-24 resize-none" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
        <div className="flex space-x-3 mt-4">
          <Button onClick={() => handleAction('approved')} disabled={action} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
            {action === 'approved' ? 'Approving...' : 'Approve'}
          </Button>
          <Button onClick={() => handleAction('rejected')} disabled={action} variant="secondary" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
            {action === 'rejected' ? 'Rejecting...' : 'Reject'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

const HoSTranscripts = () => {
  const [transcripts, setTranscripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchPending() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchPending = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/head-of-school/transcripts/pending')
      setTranscripts(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const filtered = transcripts.filter(t =>
    !search || [t.student?.name, t.class?.name].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`px-4 py-3 rounded-lg border text-sm flex items-center space-x-2 ${
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Transcript Approvals</h1>
        <p className="text-secondary-500 mt-0.5">Review and approve student transcripts</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
        <input type="text" placeholder="Search student or class..." value={search}
          onChange={e => setSearch(e.target.value)} className="input pl-10" />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200 bg-secondary-50/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Student</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Class</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Term</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Submitted</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-secondary-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-sm font-medium text-secondary-900">{t.student?.name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-secondary-600">{t.class?.name}</td>
                  <td className="py-3 px-4 text-sm text-secondary-600">{t.term || '-'}</td>
                  <td className="py-3 px-4 text-sm text-secondary-600">{t.submitted_at ? new Date(t.submitted_at).toLocaleDateString() : '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end space-x-1">
                      <button onClick={() => setSelected(t)}
                        className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-primary-200">
                        Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="5" className="py-12 text-center text-secondary-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No pending transcripts</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && <ApproveModal transcript={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); fetchPending(); showToast('Transcript reviewed') }} />}
    </div>
  )
}

export default HoSTranscripts