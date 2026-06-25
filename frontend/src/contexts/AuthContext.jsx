import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [features, setFeatures] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchFeatures = async () => {
    try {
      const res = await axios.get('/api/school/features')
      setFeatures(res.data)
    } catch {
      setFeatures({})
    }
  }

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/user')
      setUser(response.data)
      fetchFeatures()
    } catch (error) {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const response = await axios.post('/api/login', { email, password })
    localStorage.setItem('token', response.data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
    setUser(response.data.user)
    fetchFeatures()
    return response.data
  }

  const register = async (userData) => {
    const response = await axios.post('/api/register', userData)
    localStorage.setItem('token', response.data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
    setUser(response.data.user)
    fetchFeatures()
    return response.data
  }

  const logout = async () => {
    try {
      await axios.post('/api/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
      setFeatures(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, features }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
