import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { CreditCard, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react'
import axios from 'axios'

const statusIcon = { active: CheckCircle, trial: Clock, expired: XCircle, suspended: AlertCircle }
const statusColor = {
  active: 'text-emerald-600 bg-emerald-50',
  trial: 'text-blue-600 bg-blue-50',
  expired: 'text-red-600 bg-red-50',
  suspended: 'text-amber-600 bg-amber-50',
  cancelled: 'text-secondary-500 bg-secondary-50',
}

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Subscriptions</h1>
        <p className="text-secondary-500 text-sm">Manage school subscription plans and billing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions.map(s => {
          const Icon = statusIcon[s.subscription_status] || Clock
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
                <span className="text-xs text-secondary-400">{s.is_active ? 'Active' : 'Suspended'}</span>
              </div>
              {s.subscription_ends_at && (
                <p className="text-xs text-secondary-500 mb-3">
                  Expires: {new Date(s.subscription_ends_at).toLocaleDateString()}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-secondary-100">
                {['free', 'starter', 'growth', 'enterprise'].map(plan => (
                  <button key={plan}
                    onClick={() => updatePlan(s.id, plan)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize transition-colors ${
                      s.subscription_plan === plan
                        ? 'bg-primary-600 text-white'
                        : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                    }`}
                  >{plan}</button>
                ))}
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
    </div>
  )
}

export default Subscriptions
