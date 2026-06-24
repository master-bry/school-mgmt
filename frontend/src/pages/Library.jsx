import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { Library as LibraryIcon, Plus, X, BookOpen, Search, Users, Calendar, Edit2, Trash2 } from 'lucide-react'
import axios from 'axios'

const Library = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    title: '', author: '', isbn: '', publisher: '', publication_year: '',
    category: '', total_copies: 1, location: '', description: '',
  })
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [loanUserId, setLoanUserId] = useState('')
  const [students, setStudents] = useState([])

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      navigate('/dashboard')
      return
    }
    fetchBooks()
  }, [user, navigate])

  const fetchBooks = async () => {
    try {
      const response = await axios.get('/api/books')
      setBooks(response.data)
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingBook) {
        await axios.put(`/api/books/${editingBook.id}`, formData)
      } else {
        await axios.post('/api/books', formData)
      }
      setShowModal(false)
      setEditingBook(null)
      setFormData({ title: '', author: '', isbn: '', publisher: '', publication_year: '', category: '', total_copies: 1, location: '', description: '' })
      fetchBooks()
    } catch (error) {
      console.error('Error saving book:', error)
    }
  }

  const handleEdit = (book) => {
    setEditingBook(book)
    setFormData({
      title: book.title, author: book.author, isbn: book.isbn,
      publisher: book.publisher || '', publication_year: book.publication_year || '',
      category: book.category || '', total_copies: book.total_copies,
      location: book.location || '', description: book.description || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this book?')) return
    try {
      await axios.delete(`/api/books/${id}`)
      fetchBooks()
    } catch (error) {
      console.error('Error deleting book:', error)
    }
  }

  const handleIssue = async () => {
    if (!selectedBook || !loanUserId) return
    try {
      await axios.post(`/api/books/${selectedBook.id}/issue`, { user_id: loanUserId })
      setShowLoanModal(false)
      setSelectedBook(null)
      setLoanUserId('')
      fetchBooks()
    } catch (error) {
      console.error('Error issuing book:', error)
    }
  }

  const handleReturn = async (book) => {
    try {
      const activeLoan = book.loans?.find(l => l.status === 'issued')
      if (activeLoan) {
        await axios.post(`/api/books/${book.id}/return`)
        fetchBooks()
      }
    } catch (error) {
      console.error('Error returning book:', error)
    }
  }

  const openLoanModal = async (book) => {
    setSelectedBook(book)
    try {
      const res = await axios.get('/api/admin/users')
      setStudents(res.data.filter(u => u.role === 'student'))
    } catch (error) {
      console.error('Error fetching students:', error)
    }
    setShowLoanModal(true)
  }

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.isbn.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <LibraryIcon className="w-8 h-8 text-primary-600" />
          <h2 className="text-2xl font-semibold text-secondary-900">Library Management</h2>
        </div>
        <Button onClick={() => { setEditingBook(null); setFormData({ title: '', author: '', isbn: '', publisher: '', publication_year: '', category: '', total_copies: 1, location: '', description: '' }); setShowModal(true) }}>
          <Plus className="w-4 h-4 mr-2" /> Add Book
        </Button>
      </div>

      <Card className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input type="text" placeholder="Search books by title, author or ISBN..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((book) => (
          <Card key={book.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-secondary-900 truncate">{book.title}</h3>
                  <p className="text-sm text-secondary-600">{book.author}</p>
                </div>
              </div>
            </div>
            <div className="space-y-1 text-sm text-secondary-600 mb-3">
              <p>ISBN: <span className="font-medium text-secondary-900">{book.isbn}</span></p>
              {book.category && <p>Category: <span className="font-medium text-secondary-900">{book.category}</span></p>}
              <div className="flex items-center space-x-4 mt-2">
                <span className="flex items-center space-x-1">
                  <BookOpen className="w-4 h-4" />
                  <span className={book.available_copies > 0 ? 'text-accent-600 font-medium' : 'text-red-600 font-medium'}>
                    {book.available_copies}/{book.total_copies}
                  </span>
                </span>
                {book.location && (
                  <span className="flex items-center space-x-1">
                    <span>📍 {book.location}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              {book.available_copies > 0 && (
                <Button onClick={() => openLoanModal(book)} size="sm" className="flex-1 text-sm py-1.5">
                  Issue
                </Button>
              )}
              {book.loans?.some(l => l.status === 'issued') && (
                <Button onClick={() => handleReturn(book)} variant="secondary" className="flex-1 text-sm py-1.5">
                  Return
                </Button>
              )}
              <button onClick={() => handleEdit(book)} className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(book.id)} className="p-2 text-secondary-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}
        {filteredBooks.length === 0 && (
          <div className="col-span-full text-center py-12 text-secondary-500">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
            <p className="text-lg font-medium">No books found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-secondary-900">{editingBook ? 'Edit Book' : 'Add New Book'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-secondary-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Title" type="text" value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              <Input label="Author" type="text" value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })} required />
              <Input label="ISBN" type="text" value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} required />
              <Input label="Publisher" type="text" value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })} />
              <Input label="Publication Year" type="number" min="1900" max="2099" value={formData.publication_year}
                onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })} />
              <Input label="Category" type="text" value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
              <Input label="Total Copies" type="number" min="1" value={formData.total_copies}
                onChange={(e) => setFormData({ ...formData, total_copies: parseInt(e.target.value) })} required />
              <Input label="Location" type="text" value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows="3" value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="flex space-x-3">
                <Button type="submit" className="flex-1">{editingBook ? 'Update' : 'Add'} Book</Button>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showLoanModal && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-secondary-900">Issue Book</h3>
              <button onClick={() => setShowLoanModal(false)} className="p-2 hover:bg-secondary-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-4">
              <p className="font-medium text-secondary-900">{selectedBook.title}</p>
              <p className="text-sm text-secondary-600">{selectedBook.author}</p>
              <p className="text-sm text-accent-600 mt-1">{selectedBook.available_copies} copies available</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Student</label>
                <select className="input" value={loanUserId}
                  onChange={(e) => setLoanUserId(e.target.value)}>
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <Button onClick={handleIssue} className="flex-1">Issue Book</Button>
                <Button type="button" variant="secondary" onClick={() => setShowLoanModal(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Library
