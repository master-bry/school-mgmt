import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { DollarSign, Plus, X, Filter, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import axios from 'axios'

const Fees = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id: childId } = useParams()
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedFee, setSelectedFee] = useState(null)
  const [formData, setFormData] = useState({
    student_id: '', fee_type: '', amount: '', due_date: '',
  })
  const [paymentData, setPaymentData] = useState({
    paid_amount: '', paid_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash', transaction_id: '',
  })

  const isParent = user?.role === 'parent'

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchData()
  }, [user, navigate, childId])

  const fetchData = async () => {
    try {
      if (isParent && childId) {
        const res = await axios.get(`/api/parent/child/${childId}/fees`)
        setFees(res.data)
      } else {
        const [feesRes, studentsRes] = await Promise.all([
          axios.get('/api/fees'),
          axios.get('/api/admin/users'),
        ])
        setFees(feesRes.data)
        setStudents(studentsRes.data.filter(u => u.role === 'student'))
      }
    } catch (error) {
      console.error('Error fetching fees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/fees', formData)
      setShowModal(false)
      setFormData({ student_id: '', fee_type: '', amount: '', due_date: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating fee:', error)
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    if (!selectedFee) return
    try {
      await axios.put(`/api/fees/${selectedFee.id}`, paymentData)
      setShowPaymentModal(false)
      setSelectedFee(null)
      setPaymentData({ paid_amount: '', paid_date: new Date().toISOString().split('T')[0], payment_method: 'cash', transaction_id: '' })
      fetchData()
    } catch (error) {
      console.error('Error processing payment:', error)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-5 h-5 text-accent-500" />
      case 'partial': return <Clock className="w-5 h-5 text-orange-500" />
      case 'overdue': return <AlertCircle className="w-5 h-5 text-red-500" />
      default: return <CreditCard className="w-5 h-5 text-secondary-400" />
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700'
      case 'partial': return 'bg-orange-100 text-orange-700'
      case 'overdue': return 'bg-red-100 text-red-700'
      default: return 'bg-secondary-100 text-secondary-600'
    }
  }

  const remainingAmount = (fee) => {
    return (parseFloat(fee.amount) - parseFloat(fee.paid_amount || 0)).toFixed(2)
  }

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
          <DollarSign className="w-8 h-8 text-primary-600" />
          <h2 className="text-2xl font-semibold text-secondary-900">Fee Management</h2>
        </div>
        {user.role === 'admin' && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Fee
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {fees.map((fee) => (
          <Card key={fee.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="mt-1">{getStatusIcon(fee.status)}</div>
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-secondary-900">{fee.fee_type}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusStyle(fee.status)}`}>
                      {fee.status}
                    </span>
                  </div>
                  {fee.student && (
                    <p className="text-sm text-secondary-600 mt-1">Student: {fee.student.name}</p>
                  )}
                  <div className="flex items-center space-x-6 mt-2 text-sm">
                    <span className="text-secondary-600">Amount: <strong className="text-secondary-900">${parseFloat(fee.amount).toFixed(2)}</strong></span>
                    <span className="text-secondary-600">Paid: <strong className="text-accent-600">${parseFloat(fee.paid_amount || 0).toFixed(2)}</strong></span>
                    <span className="text-secondary-600">Remaining: <strong className={parseFloat(remainingAmount(fee)) > 0 ? 'text-red-600' : 'text-green-600'}>${remainingAmount(fee)}</strong></span>
                    <span className="text-secondary-600">Due: {new Date(fee.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              {fee.status !== 'paid' && user.role !== 'parent' && (
                <Button onClick={() => { setSelectedFee(fee); setPaymentData({ ...paymentData, paid_amount: remainingAmount(fee) }); setShowPaymentModal(true) }}>
                  Record Payment
                </Button>
              )}
            </div>
          </Card>
        ))}
        {fees.length === 0 && (
          <div className="text-center py-12 text-secondary-500">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
            <p className="text-lg font-medium">No fees found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-secondary-900">Add New Fee</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Student</label>
                <select className="input" value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })} required>
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <Input label="Fee Type" type="text" value={formData.fee_type}
                onChange={(e) => setFormData({ ...formData, fee_type: e.target.value })} required placeholder="e.g. Tuition, Lab, Sports" />
              <Input label="Amount ($)" type="number" min="0" step="0.01" value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              <Input label="Due Date" type="date" value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required />
              <div className="flex space-x-3">
                <Button type="submit" className="flex-1">Create Fee</Button>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showPaymentModal && selectedFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-secondary-900">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4 p-3 bg-secondary-50 rounded-lg">
              <p className="text-sm text-secondary-600">{selectedFee.fee_type} - {selectedFee.student?.name}</p>
              <p className="text-lg font-bold text-secondary-900">${remainingAmount(selectedFee)} remaining</p>
            </div>
            <form onSubmit={handlePayment} className="space-y-4">
              <Input label="Amount Paid ($)" type="number" min="0" step="0.01" value={paymentData.paid_amount}
                onChange={(e) => setPaymentData({ ...paymentData, paid_amount: e.target.value })} required />
              <Input label="Payment Date" type="date" value={paymentData.paid_date}
                onChange={(e) => setPaymentData({ ...paymentData, paid_date: e.target.value })} required />
              <div>
                <label className="label">Payment Method</label>
                <select className="input" value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>
              <Input label="Transaction ID (Optional)" type="text" value={paymentData.transaction_id}
                onChange={(e) => setPaymentData({ ...paymentData, transaction_id: e.target.value })} />
              <div className="flex space-x-3">
                <Button type="submit" className="flex-1">Record Payment</Button>
                <Button type="button" variant="secondary" onClick={() => setShowPaymentModal(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Fees
