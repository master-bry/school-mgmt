import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/Card'
import { Newspaper, Search, Calendar, User } from 'lucide-react'
import axios from 'axios'

const StudentBlogs = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'student') { navigate('/dashboard'); return }
    fetchBlogs()
  }, [user])

  const fetchBlogs = async () => {
    try {
      const res = await axios.get('/api/student/blogs')
      setBlogs(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const categories = [...new Set(blogs.map(b => b.category).filter(Boolean))]

  const filtered = blogs.filter(b => {
    const matchSearch = !searchTerm || b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat = !selectedCategory || b.category === selectedCategory
    return matchSearch && matchCat
  })

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
          <Newspaper className="w-4 h-4" />
          <span>Academic Blog</span>
        </div>
        <h1 className="text-2xl font-bold text-secondary-900">Blogs & Notes</h1>
        <p className="text-secondary-500 mt-0.5">Academic articles and notes published by your school</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input type="text" placeholder="Search blogs..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
        </div>
        {categories.length > 0 && (
          <select className="input sm:w-48" value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Newspaper className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500">No blog posts found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((blog) => (
            <Card key={blog.id}>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${
                blog.category ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-600'
              }`}>
                {blog.category || 'General'}
              </span>
              <h3 className="text-base font-semibold text-secondary-900 mb-1">{blog.title}</h3>
              <p className="text-sm text-secondary-600 line-clamp-4 mb-3">{blog.content}</p>
              <div className="flex items-center justify-between text-xs text-secondary-400 mt-auto pt-2 border-t border-secondary-100">
                <span className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{blog.author?.name || 'Academician'}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(blog.published_at || blog.created_at).toLocaleDateString()}</span>
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentBlogs
