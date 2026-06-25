import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { CreditCard, CheckCircle, AlertCircle, Clock, XCircle, Edit2, X } from 'lucide-react'
import axios from 'axios'

const statusIcon = { active: CheckCircle, trial: Clock, expired: XCircle, suspended: AlertCircle }
const statusColor = {
  active: 'text-emerald-600 bg-emerald-50',
  trial: 'text-blue-600 bg-blue-50',
  expired: 'text-red-600 bg-red-50',
  suspended: 'text-amber-600 bg-amber-50',
  cancelled: 'text-secondary-500 bg-secondary-50',
}

const plans = ['free', 'starter', 'growth', 'enterprise']

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editSchool, setEditSchool] = useState(null)
  const [form, setForm] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchSubscriptions() }, [])

  const fetchSubscriptions = async () => {
    try {
      const { data } = await axios.get('/api/super-admin/subscriptions')
      setSubscriptions(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const updatePlan = async (id, plan) => {
    try {
      await axios.put(`/api/super-admin/schools/${id}/subscription`, {
        subscription_plan: plan, subscription_status: 'active',
      })
      fetchSubscriptions()
    } catch (err) { console.error(err) }
  }

  const openEdit = (s) => {
    setForm({
      subscription_plan: s.subscription_plan || 'free',
      subscription_status: s.subscription_status || 'trial',
      subscription_ends_at: s.subscription_ends_at ? s.subscription_ends_at.slice(0, 10) : '',
    })
    setEditSchool(s)
  }

  const handleEdit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await axios.put(`/api/super-admin/schools/${editSchool.id}/subscription`, form)
      setEditSchool(null)
      fetchSubscriptions()
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Subscriptions</h1>
        <p className="text-secondary-500 text-sm">Manage school subscription plans, status, and billing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions.map(s => {
          const Icon = statusIcon[s.subscription_status] || Clock
          const isExpired = s.subscription_ends_at && new Date(s.subscription_ends_at) < new Date()
          return (
            <Card key={s.id}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-secondary-900 truncate">{s.name}</h3>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[s.subscription_status] || 'bg-secondary-100 text-secondary-600'}`}>
                  <Icon className="w-3 h-3" />
                  {s.subscription_status}
                </span>
              </div>
              <p className="text-xs text-secondary-500 mb-3">{s.code}</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-primary-600 capitalize">{s.subscription_plan || 'free'}</span>
                <span className={`text-xs ${s.is_active ? 'text-emerald-600' : 'text-red-500'}`}>{s.is_active ? 'Active' : 'Suspended'}</span>
              </div>
              {s.subscription_ends_at && (
                <p className={`text-xs mb-3 ${isExpired ? 'text-red-500 font-medium' : 'text-secondary-500'}`}>
                  {isExpired ? 'Expired: ' : 'Expires: '}{new Date(s.subscription_ends_at).toLocaleDateString()}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-secondary-100">
                {plans.map(plan => (
                  <button key={plan}
                    onClick={() => updatePlan(s.id, plan)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize transition-colors ${
                      s.subscription_plan === plan
                        ? 'bg-primary-600 text-white'
                        : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                    }`}
                  >{plan}</button>
                ))}
                <button onClick={() => openEdit(s)}
                  className="px-2.5 py-1 text-xs rounded-lg font-medium bg-secondary-100 text-secondary-600 hover:bg-secondary-200 ml-auto"
                ><Edit2 className="w-3 h-3" /></button>
              </div>
            </Card>
          )
        })}
        {subscriptions.length === 0 && (
          <div className="col-span-full text-center py-12 text-secondary-400">
            <CreditCard className="w-12 h-12 mx-auto mb-2" />
            <p>No subscriptions found</p>
          </div>
        )}
      </div>

      {editSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditSchool(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Subscription — {editSchool.name}</h3>
              <button onClick={() => setEditSchool(null)} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div><label className="label">Plan</label>
                <select className="input" value={form.subscription_plan} onChange={e => setForm(f => ({...f, subscription_plan: e.target.value}))}>
                  {plans.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div><label className="label">Status</label>
                <select className="input" value={form.subscription_status} onChange={e => setForm(f => ({...f, subscription_status: e.target.value}))}>
                  <option value="active">Active</option><option value="trial">Trial</option><option value="expired">Expired</option><option value="suspended">Suspended</option><option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div><label className="label">Expiry Date</label>
                <input className="input" type="date" value={form.subscription_ends_at} onChange={e => setForm(f => ({...f, subscription_ends_at: e.target.value}))} />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setEditSchool(null)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Subscriptions
