import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/Card'
import { FileText, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import axios from 'axios'

const CashierReports = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState({
    summary: { total_fees_created: 0, total_collected: 0, total_outstanding: 0 },
    by_status: { paid: 0, partial: 0, pending: 0, overdue: 0 },
    by_category: [],
  })

  useEffect(() => {
    if (!user || user.role !== 'cashier') {
      navigate('/login')
      return
    }
    fetchReports()
  }, [user, navigate])

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/cashier/reports')
      setReports(response.data)
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

  const s = reports.summary || reports
  const bs = reports.by_status || {}

  return (
    <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <FileText className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-secondary-900">Financial Reports</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100">Total Fees Created</p>
                <p className="text-3xl font-bold mt-1">${parseFloat(s.total_fees_created || 0).toFixed(2)}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-primary-200" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-accent-500 to-accent-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-accent-100">Total Collected</p>
                <p className="text-3xl font-bold mt-1">${parseFloat(s.total_collected || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-accent-200" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100">Total Outstanding</p>
                <p className="text-3xl font-bold mt-1">${parseFloat(s.total_outstanding || 0).toFixed(2)}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-200" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">By Status</h2>
            <div className="space-y-4">
              {[
                { label: 'Paid', value: bs.paid || 0, color: 'bg-accent-500', icon: CheckCircle },
                { label: 'Partial', value: bs.partial || 0, color: 'bg-orange-500', icon: Clock },
                { label: 'Pending', value: bs.pending || 0, color: 'bg-secondary-400', icon: Clock },
                { label: 'Overdue', value: bs.overdue || 0, color: 'bg-red-500', icon: AlertCircle },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="font-medium text-secondary-900">{item.label}</span>
                  </div>
                  <span className="font-bold text-secondary-900">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">By Category</h2>
            {(reports.by_category || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-secondary-200">
                      <th className="text-left py-3 pr-4 text-secondary-600 font-medium">Category</th>
                      <th className="text-right py-3 px-4 text-secondary-600 font-medium">Total</th>
                      <th className="text-right py-3 pl-4 text-secondary-600 font-medium">Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reports.by_category || []).map((cat, i) => (
                      <tr key={i} className="border-b border-secondary-100 hover:bg-secondary-50">
                        <td className="py-3 pr-4 text-secondary-900 font-medium capitalize">{cat.fee_category || cat.category}</td>
                        <td className="text-right py-3 px-4 text-secondary-700">${parseFloat(cat.total).toFixed(2)}</td>
                        <td className="text-right py-3 pl-4 text-accent-600 font-medium">${parseFloat(cat.collected).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-secondary-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
                <p>No category data available</p>
              </div>
            )}
          </Card>
        </div>
      </div>
  )
}

export default CashierReports
