import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { Users, Search, Wallet, DollarSign, X, AlertCircle, CheckCircle, User, Building2, CreditCard, Hash } from 'lucide-react'
import axios from 'axios'

const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-700',
  head_of_school: 'bg-purple-100 text-purple-700',
  assistant_head: 'bg-indigo-100 text-indigo-700',
  teacher: 'bg-blue-100 text-blue-700',
  academician: 'bg-cyan-100 text-cyan-700',
  cashier: 'bg-emerald-100 text-emerald-700',
  secretary: 'bg-amber-100 text-amber-700',
}
const ROLE_LABELS = {
  admin: 'Admin',
  head_of_school: 'Head of School',
  assistant_head: 'Assistant Head',
  teacher: 'Teacher',
  academician: 'Academician',
  cashier: 'Cashier',
  secretary: 'Secretary',
}

const CashierStaff = () => {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editTarget, setEditTarget] = useState(null)
  const [salaryPaymentTarget, setSalaryPaymentTarget] = useState(null)
  const [bonusPaymentTarget, setBonusPaymentTarget] = useState(null)
  const [form, setForm] = useState({ salary: '', bank_name: '', bank_account: '', bank_code: '', tax_id: '' })
  const [paymentAmount, setPaymentAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => { fetchStaff() }, [])

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/cashier/staff')
      setStaff(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleEditInfo = (s) => {
    const d = s.teacher_detail || s.teacherDetail || {}
    setForm({
      salary: d.salary || '',
      bank_name: d.bank_name || '',
      bank_account: d.bank_account || '',
      bank_code: d.bank_code || '',
      tax_id: d.tax_id || '',
    })
    setEditTarget(s)
  }

  const handleSaveInfo = async () => {
    setSaving(true)
    try {
      await axios.put(`/api/cashier/staff/${editTarget.id}/info`, form)
      showToast('Staff info updated')
      setEditTarget(null)
      fetchStaff()
    } catch (e) { showToast('Failed to update', 'error') }
    finally { setSaving(false) }
  }

  const handleSalaryPayment = async () => {
    setSaving(true)
    try {
      await axios.put(`/api/cashier/staff/${salaryPaymentTarget.id}/salary`, { salary: parseFloat(paymentAmount) })
      showToast(`Salary payment of $${parseFloat(paymentAmount).toLocaleString()} submitted for approval`)
      setSalaryPaymentTarget(null)
      setPaymentAmount('')
      fetchStaff()
    } catch (e) { showToast('Failed to submit', 'error') }
    finally { setSaving(false) }
  }

  const handleBonusPayment = async () => {
    setSaving(true)
    try {
      await axios.put(`/api/cashier/staff/${bonusPaymentTarget.id}/bonus`, { bonus: parseFloat(paymentAmount) })
      showToast(`Bonus payment of $${parseFloat(paymentAmount).toLocaleString()} submitted for approval`)
      setBonusPaymentTarget(null)
      setPaymentAmount('')
      fetchStaff()
    } catch (e) { showToast('Failed to submit', 'error') }
    finally { setSaving(false) }
  }

  const filtered = staff.filter(s => {
    if (roleFilter && s.role !== roleFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return [s.name, s.email, s.role, ROLE_LABELS[s.role]].some(f => f?.toLowerCase().includes(q))
  })

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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Staff Compensation & Payroll</h1>
          <p className="text-secondary-500 mt-0.5">Manage base salaries, payment info, and submit salary/bonus payments for approval</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input className="input pl-9" placeholder="Search by name, email, role..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-44" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="head_of_school">Head of School</option>
            <option value="assistant_head">Assistant Head</option>
            <option value="teacher">Teacher</option>
            <option value="academician">Academician</option>
            <option value="cashier">Cashier</option>
            <option value="secretary">Secretary</option>
          </select>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-secondary-500">
            <Users className="w-16 h-16 mx-auto mb-3 text-secondary-300" />
            <p className="text-lg font-medium text-secondary-700">No staff found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Staff</th>
                  <th className="text-left py-3 px-3 text-secondary-600 font-medium">Role</th>
                  <th className="text-right py-3 px-3 text-secondary-600 font-medium">Base Salary</th>
                  <th className="text-right py-3 px-3 text-secondary-600 font-medium">Bank</th>
                  <th className="text-center py-3 px-3 text-secondary-600 font-medium">Salary Approved</th>
                  <th className="text-center py-3 px-3 text-secondary-600 font-medium">Bonus Approved</th>
                  <th className="text-center py-3 px-3 text-secondary-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const d = s.teacher_detail || s.teacherDetail || {}
                  return (
                    <tr key={s.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">{s.name?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-secondary-900">{s.name}</p>
                            <p className="text-xs text-secondary-500">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[s.role] || 'bg-secondary-100 text-secondary-600'}`}>
                          {ROLE_LABELS[s.role] || s.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-secondary-900">
                        {d.salary ? `$${Number(d.salary).toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-secondary-600 text-xs">
                        {d.bank_name ? (
                          <span>{d.bank_name}{d.bank_account ? ` (${d.bank_account.slice(-4)})` : ''}</span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {d.salary_approved_by ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Yes</span>
                        ) : d.salary ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {d.bonus_approved_by ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Yes</span>
                        ) : d.bonus ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <Button variant="ghost" size="sm" onClick={() => handleEditInfo(s)}>
                            <DollarSign className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="primary" size="sm" onClick={() => { setSalaryPaymentTarget(s); setPaymentAmount(d.salary || '') }}>
                            <Wallet className="w-3.5 h-3.5 mr-1" />Pay
                          </Button>
                          <Button variant="accent" size="sm" onClick={() => { setBonusPaymentTarget(s); setPaymentAmount('') }}>
                            <Users className="w-3.5 h-3.5 mr-1" />Bonus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditTarget(null)}>
          <Card className="w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">Edit Staff Info</h3>
                <p className="text-sm text-secondary-500">{editTarget.name} — {ROLE_LABELS[editTarget.role] || editTarget.role}</p>
              </div>
              <button onClick={() => setEditTarget(null)} className="p-1 hover:bg-secondary-100 rounded">
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>
            <div className="space-y-4">
              <Input label="Base Salary ($)" type="number" value={form.salary}
                onChange={e => setForm(f => ({...f, salary: e.target.value}))} icon={DollarSign} />
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-secondary-700 mb-3">Payment / Bank Info</p>
                <div className="grid grid-cols-1 gap-3">
                  <Input label="Bank Name" value={form.bank_name}
                    onChange={e => setForm(f => ({...f, bank_name: e.target.value}))} icon={Building2} />
                  <Input label="Account Number" value={form.bank_account}
                    onChange={e => setForm(f => ({...f, bank_account: e.target.value}))} icon={CreditCard} />
                  <Input label="Bank Code / Sort Code" value={form.bank_code}
                    onChange={e => setForm(f => ({...f, bank_code: e.target.value}))} icon={Hash} />
                  <Input label="Tax ID" value={form.tax_id}
                    onChange={e => setForm(f => ({...f, tax_id: e.target.value}))} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
                <Button variant="primary" onClick={handleSaveInfo} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Info'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {salaryPaymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setSalaryPaymentTarget(null); setPaymentAmount('') }}>
          <Card className="w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">Salary Payment</h3>
                <p className="text-sm text-secondary-500">{salaryPaymentTarget.name}</p>
              </div>
              <button onClick={() => { setSalaryPaymentTarget(null); setPaymentAmount('') }} className="p-1 hover:bg-secondary-100 rounded">
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>
            <div className="space-y-4">
              <Input label="Payment Amount ($)" type="number" value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)} icon={Wallet} />
              <p className="text-xs text-amber-600">Submits a salary payment approval request to AH → HOS.</p>
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={() => { setSalaryPaymentTarget(null); setPaymentAmount('') }}>Cancel</Button>
                <Button variant="primary" onClick={handleSalaryPayment} disabled={saving || !paymentAmount}>
                  {saving ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {bonusPaymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setBonusPaymentTarget(null); setPaymentAmount('') }}>
          <Card className="w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">Bonus Payment</h3>
                <p className="text-sm text-secondary-500">{bonusPaymentTarget.name}</p>
              </div>
              <button onClick={() => { setBonusPaymentTarget(null); setPaymentAmount('') }} className="p-1 hover:bg-secondary-100 rounded">
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>
            <div className="space-y-4">
              <Input label="Bonus Amount ($)" type="number" value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)} icon={Wallet} />
              <p className="text-xs text-amber-600">Submits a bonus payment approval request to AH → HOS.</p>
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={() => { setBonusPaymentTarget(null); setPaymentAmount('') }}>Cancel</Button>
                <Button variant="accent" onClick={handleBonusPayment} disabled={saving || !paymentAmount}>
                  {saving ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default CashierStaff
