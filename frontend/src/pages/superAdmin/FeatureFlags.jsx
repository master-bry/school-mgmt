import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { ShieldCheck, Plus, X, ToggleLeft, ToggleRight } from 'lucide-react'
import axios from 'axios'

const FeatureFlags = () => {
  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ feature_key: '', display_name: '', description: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchFlags() }, [])

  const fetchFlags = async () => {
    try {
      const { data } = await axios.get('/api/super-admin/feature-flags')
      setFlags(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const toggleFlag = async (id, is_enabled) => {
    try {
      await axios.put(`/api/super-admin/feature-flags/${id}`, { is_enabled })
      fetchFlags()
    } catch (err) { console.error(err) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await axios.post('/api/super-admin/feature-flags', form)
      setShowModal(false); setForm({ feature_key: '', display_name: '', description: '' })
      fetchFlags()
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Feature Flags</h1>
          <p className="text-secondary-500 text-sm">Globally toggle features across tenants</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-1" /> New Flag</Button>
      </div>

      <div className="space-y-3">
        {flags.map(flag => (
          <Card key={flag.id} className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-secondary-900">{flag.display_name}</h3>
                <code className="text-xs bg-secondary-100 px-1.5 py-0.5 rounded text-secondary-500">{flag.feature_key}</code>
              </div>
              {flag.description && <p className="text-xs text-secondary-500 mt-0.5">{flag.description}</p>}
              <div className="flex items-center gap-3 mt-1 text-xs text-secondary-400">
                {flag.school_id ? <span>Applied to school #{flag.school_id}</span> : <span>Global</span>}
              </div>
            </div>
            <button
              onClick={() => toggleFlag(flag.id, !flag.is_enabled)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                flag.is_enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-secondary-100 text-secondary-500'
              }`}
            >
              {flag.is_enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              {flag.is_enabled ? 'Enabled' : 'Disabled'}
            </button>
          </Card>
        ))}
        {flags.length === 0 && (
          <div className="text-center py-12 text-secondary-400">
            <ShieldCheck className="w-12 h-12 mx-auto mb-2" />
            <p>No feature flags configured</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Feature Flag</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Feature Key" value={form.feature_key} onChange={e => setForm(f => ({...f, feature_key: e.target.value}))} placeholder="e.g., necta_grading" required />
              <Input label="Display Name" value={form.display_name} onChange={e => setForm(f => ({...f, display_name: e.target.value}))} placeholder="NECTA Grading Engine" required />
              <div><label className="label">Description</label><textarea className="input" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Flag'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeatureFlags
