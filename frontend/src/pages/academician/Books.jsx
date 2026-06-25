import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import ConfirmDialog from '../../components/ConfirmDialog'
import { BookOpen, Plus, X, Search, FileText, FileSpreadsheet, File, AlertCircle, Edit2, Trash2, CheckCircle } from 'lucide-react'
import axios from 'axios'

const typeIcons = { pdf: FileText, doc: FileText, xls: FileSpreadsheet, ppt: File, image: File, video: File, other: File }
const typeColors = {
  pdf: 'bg-red-100 text-red-700', doc: 'bg-blue-100 text-blue-700', xls: 'bg-emerald-100 text-emerald-700',
  ppt: 'bg-orange-100 text-orange-700', image: 'bg-violet-100 text-violet-700', video: 'bg-purple-100 text-purple-700', other: 'bg-secondary-100 text-secondary-600',
}
const ALLOWED_TYPES = ['pdf', 'doc', 'docx', 'ppt', 'pptx']
const MAX_FILE_SIZE = 50 * 1024 * 1024

const BookModal = ({ onClose, onSaved, book }) => {
  const isEdit = !!book
  const [form, setForm] = useState({
    title: book?.title || '', author: book?.author || '', isbn: book?.isbn || '',
    publisher: book?.publisher || '', publication_year: book?.publication_year || '',
    category: book?.category || '', description: book?.description || '', location: book?.location || '',
  })
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.author.trim()) errs.author = 'Author is required'
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (!ALLOWED_TYPES.includes(ext)) errs.file = `Invalid type. Allowed: ${ALLOWED_TYPES.join(', ')}`
      else if (file.size > MAX_FILE_SIZE) errs.file = 'File must be under 50MB'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setSaving(true)
    try {
      if (isEdit) {
        await axios.put(`/api/academician/books/${book.id}`, form)
      } else {
        const fd = new FormData()
        Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
        if (file) fd.append('file', file)
        await axios.post('/api/academician/books', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      onSaved()
    } catch (err) {
      setServerError(err.response?.data?.message || (isEdit ? 'Failed to update' : 'Failed to create'))
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">{isEdit ? 'Edit Material' : 'Add Material'}</h3>
            <p className="text-sm text-secondary-500 mt-0.5">{isEdit ? 'Update book details' : 'Create a new book or learning material'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {serverError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">{serverError}</div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Book title" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>
            <div>
              <Input label="Author" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Author name" />
              {errors.author && <p className="text-xs text-red-500 mt-1">{errors.author}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="ISBN" value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} placeholder="ISBN (optional)" />
            <Input label="Publisher" value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} placeholder="Publisher (optional)" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                <option value="textbook">Textbook</option>
                <option value="reference">Reference</option>
                <option value="workbook">Workbook</option>
                <option value="exam">Exam Material</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input label="Publication Year" type="number" value={form.publication_year} onChange={e => setForm({ ...form, publication_year: e.target.value })} placeholder="e.g. 2024" />
          </div>
          <Input label="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Shelf / location (optional)" />
          {!isEdit && (
            <div>
              <label className="label">File (PDF, DOC, PPT)</label>
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={e => setFile(e.target.files[0] || null)}
                className="input file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
              {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
            </div>
          )}
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
          </div>
          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Saving...' : isEdit ? 'Update Material' : 'Add Material'}</Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

const Books = () => {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editBook, setEditBook] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchBooks() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/academician/books')
      setBooks(Array.isArray(data) ? data : data.data || [])
    } catch (e) { console.error('Failed to fetch books:', e) }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(confirmDelete)
    try {
      await axios.delete(`/api/academician/books/${confirmDelete}`)
      setConfirmDelete(null)
      setBooks(prev => prev.filter(b => b.id !== confirmDelete))
      showToast('Book deleted')
    } catch (e) { showToast('Failed to delete', 'error') }
    finally { setDeleting(null) }
  }

  const filtered = books.filter(b =>
    !searchTerm || [b.title, b.author, b.isbn, b.category, b.publisher].some(f =>
      f?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

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
            <BookOpen className="w-4 h-4" /><span>Academician</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Books & Materials</h1>
          <p className="text-secondary-500 mt-0.5">Manage learning materials and textbooks</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-2" />Add Material</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
        <input type="text" placeholder="Search by title, author, ISBN, publisher, category..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input pl-10 max-w-md" />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200 bg-secondary-50/50">
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Title</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Author</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">ISBN</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Category</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Publisher</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Type</th>
                <th className="text-right py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filtered.map(b => {
                const fileType = b.file_type?.toLowerCase() || 'other'
                const TypeIcon = typeIcons[fileType] || File
                const badgeColor = typeColors[fileType] || typeColors.other
                return (
                  <tr key={b.id} className="hover:bg-secondary-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{b.title}</p>
                          {b.description && <p className="text-xs text-secondary-400 line-clamp-1">{b.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-secondary-600">{b.author}</td>
                    <td className="py-3.5 px-4 text-sm text-secondary-600 font-mono">{b.isbn || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700 capitalize">{b.category || 'Other'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-secondary-600">{b.publisher || '-'}</td>
                    <td className="py-3.5 px-4">
                      {b.file_type && (
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
                          <TypeIcon className="w-3 h-3" /><span>{b.file_type.toUpperCase()}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => setEditBook(b)}
                          className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(b.id)} disabled={deleting === b.id}
                          className="p-1.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <BookOpen className="w-8 h-8 text-secondary-300 mx-auto mb-2" />
                    <p className="text-sm text-secondary-500">{searchTerm ? 'No materials match your search' : 'No materials found'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {(showModal || editBook) && (
        <BookModal
          onClose={() => { setShowModal(false); setEditBook(null) }}
          onSaved={() => { setShowModal(false); setEditBook(null); fetchBooks(); showToast(editBook ? 'Book updated' : 'Book created') }}
          book={editBook}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}
        title="Delete Book"
        message="Are you sure you want to delete this book?"
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        loading={!!deleting}
      />
    </div>
  )
}

export default Books