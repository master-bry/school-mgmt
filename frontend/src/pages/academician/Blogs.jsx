import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { Newspaper, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react'
import axios from 'axios'

const BlogForm = ({ blog: editingBlog, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    title: '', content: '', category: '', is_published: false,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (editingBlog) {
      setFormData({
        title: editingBlog.title,
        content: editingBlog.content,
        category: editingBlog.category || '',
        is_published: editingBlog.is_published,
      })
    }
  }, [editingBlog])

  const validate = () => {
    const errs = {}
    if (!formData.title.trim()) errs.title = 'Title is required'
    else if (formData.title.trim().length < 3) errs.title = 'Title must be at least 3 characters'
    if (!formData.content.trim()) errs.content = 'Content is required'
    else if (formData.content.trim().length < 10) errs.content = 'Content must be at least 10 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setSaving(true)
    try {
      if (editingBlog) {
        await axios.put(`/api/academician/blogs/${editingBlog.id}`, formData)
      } else {
        await axios.post('/api/academician/blogs', formData)
      }
      onSaved()
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        setServerError(Object.values(data.errors).flat().join('\n'))
      } else {
        setServerError(data?.message || 'Failed to save blog')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-secondary-900">
            {editingBlog ? 'Edit Blog Post' : 'New Blog Post'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        {serverError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 whitespace-pre-wrap">
            <AlertCircle className="w-4 h-4 inline mr-1" />{serverError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input label="Title" type="text" value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter blog title" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="label">Content</label>
            <textarea className="input min-h-[200px]" value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your blog content here..." />
            {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
          </div>
          <Input label="Category" type="text" value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g. announcement, study_tips, news" />
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-secondary-700">Publish immediately</span>
          </label>
          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Saving...' : (editingBlog ? 'Update' : 'Create Blog')}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

const AcademicianBlogs = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBlog, setEditingBlog] = useState(null)

  useEffect(() => {
    if (!user || user.role !== 'academician') { navigate('/dashboard'); return }
    fetchBlogs()
  }, [user])

  const fetchBlogs = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/academician/blogs')
      setBlogs(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return
    try {
      await axios.delete(`/api/academician/blogs/${id}`)
      fetchBlogs()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-sm text-secondary-500 mb-1">
            <Newspaper className="w-4 h-4" />
            <span>Content Management</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Blog / Notes</h1>
          <p className="text-secondary-500 mt-0.5">Create and manage blog posts and academic notes</p>
        </div>
        <Button onClick={() => { setEditingBlog(null); setShowForm(true) }}>
          <Plus className="w-4 h-4 mr-2" />New Post
        </Button>
      </div>

      {blogs.length === 0 ? (
        <Card className="text-center py-12">
          <Newspaper className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500">No blog posts yet. Create your first post!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blogs.map((blog) => (
            <Card key={blog.id} className="relative">
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  blog.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {blog.is_published ? 'Published' : 'Draft'}
                </span>
                <div className="flex space-x-1">
                  <button onClick={() => { setEditingBlog(blog); setShowForm(true) }}
                    className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(blog.id, blog.title)}
                    className="p-1.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="text-base font-semibold text-secondary-900 mb-1 line-clamp-2">{blog.title}</h3>
              <p className="text-sm text-secondary-600 line-clamp-3 mb-3">{blog.content}</p>
              <div className="flex items-center justify-between text-xs text-secondary-400 mt-auto">
                <span>{blog.category || 'General'}</span>
                <span>{new Date(blog.created_at).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <BlogForm
          blog={editingBlog}
          onClose={() => { setShowForm(false); setEditingBlog(null) }}
          onSaved={() => { setShowForm(false); setEditingBlog(null); fetchBlogs() }}
        />
      )}
    </div>
  )
}

export default AcademicianBlogs
