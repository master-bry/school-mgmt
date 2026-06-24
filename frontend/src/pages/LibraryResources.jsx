import { useState, useEffect } from 'react'
import Card from '../components/Card'
import { FolderOpen, Search, File, FileText, Download, ExternalLink, BookOpen } from 'lucide-react'
import axios from 'axios'

const typeIcons = {
  document: FileText, pdf: FileText, video: ExternalLink, link: ExternalLink, book: BookOpen,
}

const LibraryResources = ({ apiPrefix }) => {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => { fetchResources() }, [])

  const fetchResources = async () => {
    try {
      const res = await axios.get(`${apiPrefix}/resources`)
      setResources(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const categories = [...new Set(resources.map(r => r.category).filter(Boolean))]
  const filtered = resources.filter(r => {
    const matchSearch = !searchTerm || r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat = !selectedCategory || r.category === selectedCategory
    return matchSearch && matchCat
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-sm text-secondary-500 mb-1">
          <FolderOpen className="w-4 h-4" /><span>Learning Resources</span>
        </div>
        <h1 className="text-2xl font-bold text-secondary-900">Learning Resources</h1>
        <p className="text-secondary-500 mt-0.5">Study materials, guides, and academic resources</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input type="text" placeholder="Search resources..." value={searchTerm}
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
          <FolderOpen className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500">No resources available yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((resource) => {
            const Icon = typeIcons[resource.resource_type] || File
            return (
              <Card key={resource.id}>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-secondary-900 truncate">{resource.title}</h3>
                    {resource.description && (
                      <p className="text-xs text-secondary-500 mt-0.5 line-clamp-2">{resource.description}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary-100 text-secondary-600">
                        {resource.category || resource.resource_type}
                      </span>
                      <span className="text-[10px] text-secondary-400">
                        {new Date(resource.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {resource.file_path && (
                      <a href={resource.file_path} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 mt-2 text-xs text-primary-600 hover:text-primary-700">
                        <Download className="w-3 h-3" /><span>Download</span>
                      </a>
                    )}
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

export default LibraryResources
