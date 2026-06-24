import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import { Users, Search } from 'lucide-react'
import axios from 'axios'

const AcademicianStudents = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { fetchStudents() }, [])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/academician/students')
      setStudents(Array.isArray(data) ? data : data.data || [])
    } catch (e) { console.error('Failed to fetch:', e) }
    finally { setLoading(false) }
  }

  const filtered = students.filter(s =>
    !searchTerm || [s.name, s.email, s.class?.name].some(f =>
      f?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Students</h1>
        <p className="text-secondary-500 mt-0.5">View registered students</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
        <input type="text" placeholder="Search by name, email, or class..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input pl-10" />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200 bg-secondary-50/50">
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase">Name</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase">Email</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase">Class</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase">Phone</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-secondary-500 uppercase">DOB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-secondary-50/50">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary-600" />
                      </div>
                      <p className="text-sm font-medium text-secondary-900">{s.name}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-secondary-600">{s.email}</td>
                  <td className="py-3.5 px-4 text-sm text-secondary-600">{s.class?.name || '-'}</td>
                  <td className="py-3.5 px-4 text-sm text-secondary-600">{s.phone || '-'}</td>
                  <td className="py-3.5 px-4 text-sm text-secondary-600">{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="5" className="py-12 text-center"><Users className="w-8 h-8 text-secondary-300 mx-auto mb-2" /><p className="text-sm text-secondary-500">No students found</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default AcademicianStudents