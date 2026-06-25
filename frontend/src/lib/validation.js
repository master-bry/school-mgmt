export const required = (value, label = 'This field') => {
  if (value === undefined || value === null) return `${label} is required`
  if (typeof value === 'string' && value.trim() === '') return `${label} is required`
  return null
}

export const email = (value) => {
  if (!value || value.trim() === '') return null
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(value.trim())) return 'Invalid email address'
  return null
}

export const minLength = (min) => (value, label = 'This field') => {
  if (!value || !value.trim()) return null
  if (value.trim().length < min) return `${label} must be at least ${min} characters`
  return null
}

export const maxLength = (max) => (value, label = 'This field') => {
  if (!value || !value.trim()) return null
  if (value.trim().length > max) return `${label} must not exceed ${max} characters`
  return null
}

export const min = (minVal) => (value, label = 'This field') => {
  const num = parseFloat(value)
  if (isNaN(num)) return `${label} must be a number`
  if (num < minVal) return `${label} must be at least ${minVal}`
  return null
}

export const max = (maxVal) => (value, label = 'This field') => {
  const num = parseFloat(value)
  if (isNaN(num)) return `${label} must be a number`
  if (num > maxVal) return `${label} must not exceed ${maxVal}`
  return null
}

export const number = (value, label = 'This field') => {
  if (!value || value.trim() === '') return null
  if (isNaN(parseFloat(value)) || !isFinite(value)) return `${label} must be a valid number`
  return null
}

export const phone = (value) => {
  if (!value || value.trim() === '') return null
  const re = /^[\d\s+\-()]{7,20}$/
  if (!re.test(value.trim())) return 'Invalid phone number'
  return null
}

export const requiredIf = (condition, label) => (value) => {
  if (!condition) return null
  return required(value, label)
}

export const validate = (value, rules = []) => {
  for (const rule of rules) {
    const error = rule(value)
    if (error) return error
  }
  return null
}

export const validateForm = (fields) => {
  const errors = {}
  let isValid = true
  for (const [key, { value, rules }] of Object.entries(fields)) {
    const error = validate(value, rules)
    if (error) {
      errors[key] = error
      isValid = false
    }
  }
  return { errors, isValid }
}
