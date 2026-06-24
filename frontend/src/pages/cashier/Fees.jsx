import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { DollarSign, Plus, X, Search, CheckCircle, Clock, AlertCircle, CreditCard, Ban, UserCheck, Users } from 'lucide-react'
import axios from 'axios'

const TABS = [
  { key: 'fees', label: 'All Fees' },
  { key: 'create', label: 'Create Fee' },
  { key: 'fines', label: 'Fines' },
]

const CashierFees = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'fees'
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedFee, setSelectedFee] = useState(null)

  const [createData, setCreateData] = useState({
    fee_type: '', amount: '', due_date: '', applies_to: 'all', grade: '', student_id: '', fee_category: 'tuition',
  })

  const [fineData, setFineData] = useState({
    student_id: '', fee_type: '', amount: '', due_date: '', description: '',
  })

  const [paymentData, setPaymentData] = useState({
    paid_amount: '', paid_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash', transaction_id: '',
  })

  useEffect(() => {
    if (!user || user.role !== 'cashier') { navigate('/login'); return }
    fetchData()
  }, [user, navigate])

  const fetchData = async () => {
    try {
      const [feesRes, studentsRes] = await Promise.all([
        axios.get('/api/cashier/fees'),
        axios.get('/api/cashier/students'),
      ])
      setFees(feesRes.data)
      setStudents(studentsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const setTab = (tab) => {
    setSearchParams(tab === 'fees' ? {} : { tab })
  }

  const filteredFees = fees.filter((f) =>
    !search || f.fee_type?.toLowerCase().includes(search.toLowerCase()) ||
    f.student?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateFee = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/cashier/fees', createData)
      setCreateData({ fee_type: '', amount: '', due_date: '', applies_to: 'all', grade: '', student_id: '', fee_category: 'tuition' })
      setTab('fees')
      fetchData()
    } catch (error) {
      console.error('Error creating fee:', error)
    }
  }

  const handleCreateFine = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/cashier/fines', fineData)
      setFineData({ student_id: '', fee_type: '', amount: '', due_date: '', description: '' })
      setTab('fees')
      fetchData()
    } catch (error) {
      console.error('Error creating fine:', error)
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    if (!selectedFee) return
    try {
      await axios.put(`/api/cashier/fees/${selectedFee.id}/payment`, paymentData)
      setShowPaymentModal(false)
      setSelectedFee(null)
      setPaymentData({ paid_amount: '', paid_date: new Date().toISOString().split('T')[0], payment_method: 'cash', transaction_id: '' })
      fetchData()
    } catch (error) {
      console.error('Error recording payment:', error)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-100 text-green-700',
      partial: 'bg-orange-100 text-orange-700',
      overdue: 'bg-red-100 text-red-700',
      pending: 'bg-secondary-100 text-secondary-600',
    }
    return styles[status] || styles.pending
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-5 h-5 text-accent-500" />
      case 'partial': return <Clock className="w-5 h-5 text-orange-500" />
      case 'overdue': return <AlertCircle className="w-5 h-5 text-red-500" />
      default: return <CreditCard className="w-5 h-5 text-secondary-400" />
    }
  }

  const remainingAmount = (fee) => (parseFloat(fee.amount) - parseFloat(fee.paid_amount || 0)).toFixed(2)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <DollarSign className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-secondary-900">Fee Management</h1>
        </div>

        <div className="flex space-x-1 bg-secondary-100 rounded-lg p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? 'bg-white text-secondary-900 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'fees' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                className="input pl-10"
                placeholder="Search by fee type or student name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filteredFees.length > 0 ? (
              <div className="space-y-3">
                {filteredFees.map((fee) => (
                  <Card key={fee.id} className="hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="mt-1">{getStatusIcon(fee.status)}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-secondary-900">{fee.fee_type}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(fee.status)}`}>
                              {fee.status}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary-100 text-secondary-600">
                              {fee.fee_category}
                            </span>
                          </div>
                          {fee.student && (
                            <p className="text-sm text-secondary-600 mt-1">Student: {fee.student.name}</p>
                          )}
                          <div className="flex items-center space-x-6 mt-2 text-sm">
                            <span className="text-secondary-600">
                              Amount: <strong className="text-secondary-900">${parseFloat(fee.amount).toFixed(2)}</strong>
                            </span>
                            <span className="text-secondary-600">
                              Paid: <strong className="text-accent-600">${parseFloat(fee.paid_amount || 0).toFixed(2)}</strong>
                            </span>
                            <span className="text-secondary-600">
                              Remaining: <strong className={parseFloat(remainingAmount(fee)) > 0 ? 'text-red-600' : 'text-green-600'}>
                                ${remainingAmount(fee)}
                              </strong>
                            </span>
                            <span className="text-secondary-600">Due: {new Date(fee.due_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {fee.status !== 'paid' && (
                        <Button
                          onClick={() => {
                            setSelectedFee(fee)
                            setPaymentData({ ...paymentData, paid_amount: remainingAmount(fee) })
                            setShowPaymentModal(true)
                          }}
                        >
                          Record Payment
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-secondary-500">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
                <p className="text-lg font-medium">{search ? 'No fees match your search' : 'No fees found'}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <Card>
            <h2 className="text-xl font-semibold text-secondary-900 mb-6">Create New Fee</h2>
            <form onSubmit={handleCreateFee} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Applies To</label>
                  <select
                    className="input"
                    value={createData.applies_to}
                    onChange={(e) => setCreateData({ ...createData, applies_to: e.target.value, grade: '', student_id: '' })}
                  >
                    <option value="all">All Students</option>
                    <option value="grade">Specific Grade</option>
                    <option value="student">Specific Student</option>
                  </select>
                </div>
                <Input
                  label="Fee Type"
                  type="text"
                  value={createData.fee_type}
                  onChange={(e) => setCreateData({ ...createData, fee_type: e.target.value })}
                  required
                  placeholder="e.g. Tuition, Lab, Sports"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Amount ($)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={createData.amount}
                  onChange={(e) => setCreateData({ ...createData, amount: e.target.value })}
                  required
                />
                <Input
                  label="Due Date"
                  type="date"
                  value={createData.due_date}
                  onChange={(e) => setCreateData({ ...createData, due_date: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Fee Category</label>
                  <select
                    className="input"
                    value={createData.fee_category}
                    onChange={(e) => setCreateData({ ...createData, fee_category: e.target.value })}
                  >
                    <option value="tuition">Tuition</option>
                    <option value="sports">Sports</option>
                    <option value="library">Library</option>
                    <option value="transport">Transport</option>
                    <option value="lab">Lab</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {createData.applies_to === 'grade' && (
                  <Input
                    label="Grade"
                    type="text"
                    value={createData.grade}
                    onChange={(e) => setCreateData({ ...createData, grade: e.target.value })}
                    required
                    placeholder="e.g. Grade 10"
                  />
                )}

                {createData.applies_to === 'student' && (
                  <div>
                    <label className="label">Student</label>
                    <select
                      className="input"
                      value={createData.student_id}
                      onChange={(e) => setCreateData({ ...createData, student_id: e.target.value })}
                      required
                    >
                      <option value="">Select student</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}{s.class ? ` - ${s.class.name || s.class}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-2">
                <Button type="submit">Create Fee</Button>
                <Button type="button" variant="secondary" onClick={() => setTab('fees')}>Cancel</Button>
              </div>
            </form>
          </Card>
        )}

        {activeTab === 'fines' && (
          <Card>
            <h2 className="text-xl font-semibold text-secondary-900 mb-6">Issue Fine</h2>
            <form onSubmit={handleCreateFine} className="space-y-4 max-w-2xl">
              <div>
                <label className="label">Student</label>
                <select
                  className="input"
                  value={fineData.student_id}
                  onChange={(e) => setFineData({ ...fineData, student_id: e.target.value })}
                  required
                >
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.class ? ` - ${s.class.name || s.class}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Fine Type"
                  type="text"
                  value={fineData.fee_type}
                  onChange={(e) => setFineData({ ...fineData, fee_type: e.target.value })}
                  required
                  placeholder="e.g. Late fee, Damage fine"
                />
                <Input
                  label="Amount ($)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={fineData.amount}
                  onChange={(e) => setFineData({ ...fineData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Due Date"
                  type="date"
                  value={fineData.due_date}
                  onChange={(e) => setFineData({ ...fineData, due_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input min-h-[80px]"
                  value={fineData.description}
                  onChange={(e) => setFineData({ ...fineData, description: e.target.value })}
                  placeholder="Reason for the fine..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <Button type="submit">Issue Fine</Button>
                <Button type="button" variant="secondary" onClick={() => setTab('fees')}>Cancel</Button>
              </div>
            </form>
          </Card>
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
                <Input
                  label="Amount Paid ($)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentData.paid_amount}
                  onChange={(e) => setPaymentData({ ...paymentData, paid_amount: e.target.value })}
                  required
                />
                <Input
                  label="Payment Date"
                  type="date"
                  value={paymentData.paid_date}
                  onChange={(e) => setPaymentData({ ...paymentData, paid_date: e.target.value })}
                  required
                />
                <div>
                  <label className="label">Payment Method</label>
                  <select
                    className="input"
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online">Online Payment</option>
                  </select>
                </div>
                <Input
                  label="Transaction ID (Optional)"
                  type="text"
                  value={paymentData.transaction_id}
                  onChange={(e) => setPaymentData({ ...paymentData, transaction_id: e.target.value })}
                />
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

export default CashierFees
