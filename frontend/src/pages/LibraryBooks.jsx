import { useState, useEffect } from 'react'
import Card from '../components/Card'
import { BookOpen, Search, FileText, User, Hash, Building, MapPin } from 'lucide-react'
import axios from 'axios'

const LibraryBooks = ({ apiPrefix }) => {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => { fetchBooks() }, [])

  const fetchBooks = async () => {
    try {
      const res = await axios.get(`${apiPrefix}/books`)
      setBooks(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const categories = [...new Set(books.map(b => b.category).filter(Boolean))]
  const filtered = books.filter(b => {
    const matchSearch = !searchTerm || b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat = !selectedCategory || b.category === selectedCategory
    return matchSearch && matchCat
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-sm text-secondary-500 mb-1">
          <BookOpen className="w-4 h-4" /><span>Library</span>
        </div>
        <h1 className="text-2xl font-bold text-secondary-900">Library Books</h1>
        <p className="text-secondary-500 mt-0.5">Browse available books and materials in the school library</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input type="text" placeholder="Search by title or author..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
        </div>
        {categories.length > 0 && (
          <select className="input sm:w-48" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500">No books available in the library yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((book) => {
            const available = book.available_copies > 0
            return (
              <Card key={book.id}>
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${available ? 'bg-emerald-100' : 'bg-secondary-100'}`}>
                    <BookOpen className={`w-5 h-5 ${available ? 'text-emerald-600' : 'text-secondary-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-secondary-900 truncate">{book.title}</h3>
                    <div className="flex items-center text-xs text-secondary-500 mt-0.5">
                      <User className="w-3 h-3 mr-1" />{book.author || 'Unknown'}
                    </div>
                    {book.isbn && (
                      <div className="flex items-center text-xs text-secondary-400 mt-0.5">
                        <Hash className="w-3 h-3 mr-1" />ISBN: {book.isbn}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {book.category && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">
                          {book.category}
                        </span>
                      )}
                      {book.publisher && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700">
                          <Building className="w-2.5 h-2.5 inline mr-0.5" />{book.publisher}
                        </span>
                      )}
                    </div>
                    {book.description && (
                      <p className="text-xs text-secondary-500 mt-2 line-clamp-2">{book.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-secondary-100">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${available ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {book.available_copies} / {book.total_copies} available
                        </span>
                      </div>
                      {book.location && (
                        <span className="text-[10px] text-secondary-400 flex items-center">
                          <MapPin className="w-2.5 h-2.5 mr-0.5" />{book.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LibraryBooks
