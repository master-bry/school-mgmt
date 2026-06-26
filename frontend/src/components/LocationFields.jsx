import { useState, useEffect } from 'react'
import axios from 'axios'

const LocationFields = ({ apiPrefix, values, onChange, errors }) => {
  const [countries, setCountries] = useState([])
  const [nationalities, setNationalities] = useState([])
  const [cities, setCities] = useState([])
  const [loadingCities, setLoadingCities] = useState(false)

  useEffect(() => {
    axios.get(`${apiPrefix}/locations/countries`).then(({ data }) => {
      if (Array.isArray(data)) {
        setCountries(data)
        const nats = [...new Set(data.map(c => c.nationality).filter(Boolean))].sort()
        setNationalities(nats)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (values.country) {
      setLoadingCities(true)
      setCities([])
      axios.get(`${apiPrefix}/locations/cities`, { params: { country: values.country } })
        .then(({ data }) => setCities(Array.isArray(data) ? data : []))
        .catch(() => setCities([]))
        .finally(() => setLoadingCities(false))
    } else {
      setCities([])
    }
  }, [values.country])

  return (
    <>
      <div>
        <label className="label">Country</label>
        <select className="input" value={values.country || ''} onChange={e => onChange('country', e.target.value)}>
          <option value="">Select Country</option>
          {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
        </select>
        {errors?.country && <p className="text-xs text-red-500 mt-0.5">{errors.country}</p>}
      </div>
      <div>
        <label className="label">City</label>
        <select className="input" value={values.city || ''} onChange={e => onChange('city', e.target.value)} disabled={!values.country || loadingCities}>
          <option value="">{loadingCities ? 'Loading...' : values.country ? 'Select City' : 'Select a country first'}</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors?.city && <p className="text-xs text-red-500 mt-0.5">{errors.city}</p>}
      </div>
      <div>
        <label className="label">Nationality</label>
        <select className="input" value={values.nationality || ''} onChange={e => onChange('nationality', e.target.value)}>
          <option value="">Select Nationality</option>
          {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        {errors?.nationality && <p className="text-xs text-red-500 mt-0.5">{errors.nationality}</p>}
      </div>
    </>
  )
}

export default LocationFields
