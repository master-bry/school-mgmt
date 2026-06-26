import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const PhoneInput = ({ apiPrefix, label, value, onChange, error, className }) => {
  const [countries, setCountries] = useState([])
  const [selected, setSelected] = useState(null)
  const [localNumber, setLocalNumber] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    axios.get(`${apiPrefix}/locations/countries`).then(({ data }) => {
      if (Array.isArray(data)) {
        const filtered = data.filter(c => c.phone_code)
        setCountries(filtered)
        if (!selected) {
          const tz = filtered.find(c => c.code === 'TZ')
          setSelected(tz || filtered[0])
        }
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (value && selected) {
      const prefix = selected.phone_code
      if (value.startsWith(prefix)) {
        setLocalNumber(value.slice(prefix.length))
      }
    }
  }, [value, selected])

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleNumberChange = (val) => {
    const digits = val.replace(/[^0-9]/g, '')
    setLocalNumber(digits)
    if (selected) {
      onChange(selected.phone_code + digits)
    }
  }

  const handleSelect = (c) => {
    setSelected(c)
    setOpen(false)
    onChange(c.phone_code + localNumber)
  }

  return (
    <div ref={ref}>
      {label && <label className="label">{label}</label>}
      <div className="flex">
        <div className="relative">
          <button
            type="button"
            className="input flex items-center space-x-1.5 rounded-r-none border-r-0 min-w-[120px] cursor-pointer"
            onClick={() => setOpen(!open)}
          >
            {selected ? (
              <>
                <img src={selected.flag} alt="" className="w-5 h-3.5 object-cover rounded" />
                <span className="text-sm">{selected.phone_code}</span>
              </>
            ) : (
              <span className="text-sm text-secondary-400">Code</span>
            )}
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 w-72 max-h-48 overflow-y-auto bg-white border border-secondary-200 rounded-lg shadow-lg z-50">
              {countries.filter(c => c.phone_code).map(c => (
                <button
                  key={c.code}
                  type="button"
                  className={`flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-secondary-50 ${selected?.code === c.code ? 'bg-primary-50' : ''}`}
                  onClick={() => handleSelect(c)}
                >
                  <img src={c.flag} alt="" className="w-5 h-3.5 object-cover rounded" />
                  <span className="text-secondary-500 text-xs">{c.code}</span>
                  <span className="text-secondary-700">{c.phone_code}</span>
                  <span className="text-secondary-400 text-xs ml-auto truncate">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          type="tel"
          className={`input rounded-l-none ${className || ''}`}
          value={localNumber}
          onChange={e => handleNumberChange(e.target.value)}
          placeholder="712345678"
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

export default PhoneInput
