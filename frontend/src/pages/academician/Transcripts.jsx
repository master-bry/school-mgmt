import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { FileText, Plus, X, AlertCircle, CheckCircle, Send, Printer, Trash2, Eye, BookOpen, Layers } from 'lucide-react'
import axios from 'axios'

const Transcripts = () => {
  const [transcripts, setTranscripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [showBulkGenerate, setShowBulkGenerate] = useState(false)
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedClass, setSelectedClass] = useState('')
  const [studentData, setStudentData] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  const [toast, setToast] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [viewTranscript, setViewTranscript] = useState(null)

  useEffect(() => { fetchTranscripts(); fetchClasses() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchTranscripts = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/academician/transcripts')
      setTranscripts(Array.isArray(res.data) ? res.data : res.data.data || [])
    } catch (e) { console.error('Failed to fetch transcripts:', e) }
    finally { setLoading(false) }
  }

  const fetchClasses = async () => {
    try {
      const res = await axios.get('/api/academician/classes')
      setClasses(Array.isArray(res.data) ? res.data : res.data.data || [])
    } catch (e) { console.error('Failed to fetch classes:', e) }
  }

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/academician/students')
      setStudents(Array.isArray(res.data) ? res.data : res.data.data || [])
    } catch (e) { console.error('Failed to fetch students:', e) }
  }

  const openGenerate = () => {
    fetchStudents()
    setSelectedStudent(null)
    setStudentData(null)
    setShowGenerate(true)
  }

  const openBulkGenerate = () => {
    setSelectedClass('')
    setBulkResult(null)
    setShowBulkGenerate(true)
  }

  const fetchStudentGrades = async (studentId) => {
    try {
      const res = await axios.get(`/api/academician/students/${studentId}/grades`)
      setStudentData(res.data)
    } catch (e) { showToast('Failed to load student grades', 'error') }
  }

  const handleGenerate = async () => {
    if (!selectedStudent) return
    setGenerating(true)
    try {
      await axios.post('/api/academician/transcripts/generate', {
        student_id: selectedStudent,
        term: 'Term 1',
        academic_year: new Date().getFullYear().toString(),
      })
      showToast('Transcript generated successfully')
      setShowGenerate(false)
      fetchTranscripts()
    } catch (e) { showToast(e.response?.data?.message || 'Failed to generate transcript', 'error') }
    finally { setGenerating(false) }
  }

  const handleBulkGenerate = async () => {
    if (!selectedClass) return
    setGenerating(true)
    setBulkResult(null)
    try {
      const res = await axios.post('/api/academician/transcripts/generate-bulk', {
        class_id: selectedClass,
        term: 'Term 1',
        academic_year: new Date().getFullYear().toString(),
      })
      setBulkResult(res.data)
      showToast(`Generated ${res.data.generated} transcripts for ${res.data.class}`)
      fetchTranscripts()
    } catch (e) { showToast(e.response?.data?.message || 'Failed to generate transcripts', 'error') }
    finally { setGenerating(false) }
  }

  const handleSubmit = async (id) => {
    setActionLoading(id)
    try {
      await axios.post(`/api/academician/transcripts/${id}/submit`)
      showToast('Transcript submitted for approval')
      fetchTranscripts()
    } catch (e) { showToast(e.response?.data?.message || 'Failed to submit', 'error') }
    finally { setActionLoading(null) }
  }

  const handlePublish = async (id) => {
    setActionLoading(id)
    try {
      await axios.post(`/api/academician/transcripts/${id}/publish`)
      showToast('Transcript published')
      fetchTranscripts()
    } catch (e) { showToast(e.response?.data?.message || 'Failed to publish', 'error') }
    finally { setActionLoading(null) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this draft transcript?')) return
    setActionLoading(id)
    try {
      await axios.delete(`/api/academician/transcripts/${id}`)
      showToast('Transcript deleted')
      fetchTranscripts()
    } catch (e) { showToast(e.response?.data?.message || 'Failed to delete', 'error') }
    finally { setActionLoading(null) }
  }

  const handleView = async (id) => {
    try {
      const res = await axios.get(`/api/academician/transcripts/${id}`)
      setViewTranscript(res.data)
    } catch (e) { showToast('Failed to load transcript', 'error') }
  }

  const handlePrint = (transcript) => {
    const win = window.open('', '_blank')
    if (!win) { showToast('Please allow pop-ups for printing', 'error'); return }
    const subjectsHtml = transcript.subjects?.map(s => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd">${s.subject?.name || 'N/A'}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${s.total_marks}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${s.marks_obtained}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${s.percentage}%</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:bold">${s.grade}</td>
      </tr>
    `).join('')

    win.document.write(`
      <html><head><title>Academic Transcript</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { text-align: center; color: #1a202c; margin-bottom: 4px; font-size: 24px; }
        .subtitle { text-align: center; color: #718096; font-size: 14px; margin-bottom: 30px; }
        .info { display: flex; justify-content: space-between; margin-bottom: 24px; }
        .info div { font-size: 14px; } .info strong { color: #4a5568; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #ebf4ff; padding: 10px 8px; border: 1px solid #ddd; text-align: left; font-size: 14px; }
        td { padding: 8px; border: 1px solid #ddd; font-size: 14px; }
        .summary { text-align: right; font-size: 14px; margin-top: 16px; }
        .summary div { margin-bottom: 4px; }
        .summary .total { font-weight: bold; font-size: 16px; color: #1a202c; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 18px; }
      </style></head><body>
        <h1>ACADEMIC TRANSCRIPT</h1>
        <p class="subtitle">${transcript.academic_year || ''} - ${transcript.term || ''}</p>
        <div class="info">
          <div><strong>Student:</strong> ${transcript.student?.name || 'N/A'}</div>
          <div><strong>Class:</strong> ${transcript.class?.name || 'N/A'}</div>
        </div>
        <div class="info">
          <div><strong>Student ID:</strong> ${transcript.student?.email || 'N/A'}</div>
          <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
        </div>
        <table><thead><tr>
          <th>Subject</th><th>Total Marks</th><th>Marks Obtained</th><th>Percentage</th><th>Grade</th>
        </tr></thead><tbody>${subjectsHtml}</tbody></table>
        <div class="summary">
          <div><strong>Total Marks:</strong> ${transcript.total_marks}</div>
          <div><strong>Marks Obtained:</strong> ${transcript.obtained_marks}</div>
          <div class="total">Overall Percentage: ${transcript.percentage}%</div>
          <div style="margin-top:8px"><span class="badge">Grade: ${transcript.grade}</span></div>
        </div>
        <div class="footer"><p>This is a computer-generated transcript. ${transcript.status === 'published' ? 'Published on: ' + new Date(transcript.published_at).toLocaleDateString() : ''}</p></div>
        <script>window.onload = function() { window.print(); }<\/script>
      </body></html>
    `)
    win.document.close()
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    pending_approval: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    published: 'bg-blue-100 text-blue-700',
  }
  const statusLabels = {
    draft: 'Draft', pending_approval: 'Pending Approval', approved: 'Approved', published: 'Published',
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sm text-secondary-500 mb-1">
            <FileText className="w-4 h-4" /><span>Academician</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Academic Transcripts</h1>
          <p className="text-secondary-500 mt-0.5">Generate and manage student academic transcripts</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={openBulkGenerate}>
            <Layers className="w-4 h-4 mr-2" />Generate by Class
          </Button>
          <Button onClick={openGenerate}>
            <Plus className="w-4 h-4 mr-2" />Generate Transcript
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">Generated Transcripts</h2>
            <p className="text-sm text-secondary-500 mt-0.5">{transcripts.length} transcript{transcripts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {transcripts.length === 0 ? (
          <div className="text-center py-12 text-secondary-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No transcripts yet</p>
            <p className="text-xs mt-1">Generate a transcript for a student to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider px-3 py-3">Student</th>
                  <th className="text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider px-3 py-3">Class</th>
                  <th className="text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider px-3 py-3">Term / Year</th>
                  <th className="text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider px-3 py-3">Percentage</th>
                  <th className="text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider px-3 py-3">Grade</th>
                  <th className="text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider px-3 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transcripts.map(t => (
                  <tr key={t.id} className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors">
                    <td className="px-3 py-3">
                      <p className="text-sm font-medium text-secondary-900">{t.student?.name || 'N/A'}</p>
                      <p className="text-xs text-secondary-500">{t.student?.email || ''}</p>
                    </td>
                    <td className="px-3 py-3 text-sm text-secondary-700">{t.class?.name || 'N/A'}</td>
                    <td className="px-3 py-3 text-sm text-secondary-700">{t.term || 'N/A'} / {t.academic_year || 'N/A'}</td>
                    <td className="px-3 py-3 text-sm font-medium text-secondary-900">{t.percentage}%</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-sm font-bold">{t.grade}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[t.status] || 'bg-gray-100 text-gray-700'}`}>
                        {statusLabels[t.status] || t.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => handleView(t.id)} className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handlePrint(t)} className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Print"><Printer className="w-4 h-4" /></button>
                        {t.status === 'draft' && (
                          <>
                            <button onClick={() => handleSubmit(t.id)} disabled={actionLoading === t.id}
                              className="p-1.5 text-secondary-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Submit for Approval">
                              <Send className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(t.id)} disabled={actionLoading === t.id}
                              className="p-1.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {t.status === 'approved' && (
                          <button onClick={() => handlePublish(t.id)} disabled={actionLoading === t.id}
                            className="p-1.5 text-secondary-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Publish">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Individual Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowGenerate(false)}>
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">Generate Transcript</h3>
                <p className="text-sm text-secondary-500 mt-0.5">Select a student to generate transcript from grades</p>
              </div>
              <button onClick={() => setShowGenerate(false)} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Student</label>
                <select className="input" value={selectedStudent || ''}
                  onChange={e => { setSelectedStudent(e.target.value); fetchStudentGrades(e.target.value) }}>
                  <option value="">Select student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.class?.name || 'No class'}</option>)}
                </select>
              </div>
              {studentData && (
                <div className="px-4 py-3 rounded-lg bg-primary-50 border border-primary-100">
                  <div className="flex items-center space-x-2 text-sm text-primary-700 mb-2">
                    <BookOpen className="w-4 h-4" /><span className="font-medium">{studentData.student?.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-secondary-600">
                    <div>Class: {studentData.class?.name || 'N/A'}</div>
                    <div>Subjects: {studentData.subjects?.length || 0}</div>
                    <div>Total Marks: {studentData.overall_total}</div>
                    <div>Obtained: {studentData.overall_obtained}</div>
                    <div className="col-span-2 font-medium">Overall: {studentData.overall_percentage}%</div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {studentData.subject_results?.map(sr => (
                      <div key={sr.subject?.id} className="flex items-center justify-between text-xs text-secondary-600 bg-white rounded px-2 py-1">
                        <span>{sr.subject?.name}</span>
                        <span>{sr.obtained_marks}/{sr.total_marks} ({sr.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex space-x-3 pt-2">
                <Button onClick={handleGenerate} disabled={!selectedStudent || generating} className="flex-1">
                  {generating ? 'Generating...' : 'Generate Transcript'}
                </Button>
                <Button variant="secondary" onClick={() => setShowGenerate(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bulk Generate Modal */}
      {showBulkGenerate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowBulkGenerate(false)}>
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">Bulk Transcript Generation</h3>
                <p className="text-sm text-secondary-500 mt-0.5">Generate transcripts for all students in a class/grade at once</p>
              </div>
              <button onClick={() => setShowBulkGenerate(false)} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Class / Grade</label>
                <select className="input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                  <option value="">Select class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                <Button onClick={handleBulkGenerate} disabled={!selectedClass || generating} className="flex-1">
                  {generating ? 'Generating...' : 'Generate for All Students'}
                </Button>
                <Button variant="secondary" onClick={() => setShowBulkGenerate(false)} className="flex-1">Cancel</Button>
              </div>

              {bulkResult && (
                <div className="mt-4 p-4 rounded-lg bg-primary-50 border border-primary-100">
                  <div className="flex items-center space-x-2 text-sm font-medium text-primary-700 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Generation Complete</span>
                  </div>
                  <div className="text-sm text-secondary-600 space-y-1">
                    <p>Class: <strong>{bulkResult.class}</strong></p>
                    <p>Term: <strong>{bulkResult.term} {bulkResult.academic_year}</strong></p>
                    <p>Total Students: <strong>{bulkResult.total_students}</strong></p>
                    <p>Generated: <strong className="text-emerald-600">{bulkResult.generated}</strong></p>
                    <p>Skipped: <strong className="text-amber-600">{bulkResult.skipped}</strong></p>
                  </div>
                  {bulkResult.results?.filter(r => r.status === 'skipped').length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-amber-600 mb-1">Skipped students (no grades):</p>
                      <div className="text-xs text-secondary-500 space-y-0.5">
                        {bulkResult.results.filter(r => r.status === 'skipped').map((r, i) => (
                          <p key={i}>- {r.student}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* View Transcript Modal */}
      {viewTranscript && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setViewTranscript(null)}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">Academic Transcript</h3>
                <p className="text-sm text-secondary-500 mt-0.5">{viewTranscript.student?.name} - {viewTranscript.class?.name}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => handlePrint(viewTranscript)} className="p-2 hover:bg-primary-50 text-primary-600 rounded-lg transition-colors" title="Print"><Printer className="w-5 h-5" /></button>
                <button onClick={() => setViewTranscript(null)} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong className="text-secondary-700">Student:</strong> {viewTranscript.student?.name || 'N/A'}</div>
                <div><strong className="text-secondary-700">Class:</strong> {viewTranscript.class?.name || 'N/A'}</div>
                <div><strong className="text-secondary-700">Term:</strong> {viewTranscript.term || 'N/A'}</div>
                <div><strong className="text-secondary-700">Year:</strong> {viewTranscript.academic_year || 'N/A'}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-secondary-200">
                      <th className="text-left text-xs font-semibold text-secondary-500 uppercase px-3 py-2">Subject</th>
                      <th className="text-center text-xs font-semibold text-secondary-500 uppercase px-3 py-2">Total</th>
                      <th className="text-center text-xs font-semibold text-secondary-500 uppercase px-3 py-2">Obtained</th>
                      <th className="text-center text-xs font-semibold text-secondary-500 uppercase px-3 py-2">%</th>
                      <th className="text-center text-xs font-semibold text-secondary-500 uppercase px-3 py-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewTranscript.subjects?.map(s => (
                      <tr key={s.id} className="border-b border-secondary-100">
                        <td className="px-3 py-2 text-sm text-secondary-900">{s.subject?.name || 'N/A'}</td>
                        <td className="px-3 py-2 text-sm text-center text-secondary-700">{s.total_marks}</td>
                        <td className="px-3 py-2 text-sm text-center text-secondary-700">{s.marks_obtained}</td>
                        <td className="px-3 py-2 text-sm text-center text-secondary-700">{s.percentage}%</td>
                        <td className="px-3 py-2 text-sm text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">{s.grade}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end pt-2 border-t border-secondary-100">
                <div className="text-right space-y-1">
                  <p className="text-sm text-secondary-600">Total Marks: <strong>{viewTranscript.total_marks}</strong></p>
                  <p className="text-sm text-secondary-600">Marks Obtained: <strong>{viewTranscript.obtained_marks}</strong></p>
                  <p className="text-base font-bold text-secondary-900">Overall: {viewTranscript.percentage}%</p>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-bold">{viewTranscript.grade}</span>
                </div>
              </div>
              {viewTranscript.head_notes && (
                <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
                  <strong>Head Notes:</strong> {viewTranscript.head_notes}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-secondary-400 pt-2">
                <span>Status: {statusLabels[viewTranscript.status]}</span>
                {viewTranscript.published_at && <span>Published: {new Date(viewTranscript.published_at).toLocaleDateString()}</span>}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Transcripts