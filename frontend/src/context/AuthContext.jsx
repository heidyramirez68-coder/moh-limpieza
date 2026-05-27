import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('moh_token')
    const user = localStorage.getItem('moh_usuario')
    if (token && user) {
      setUsuario(JSON.parse(user))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    setCargando(false)
  }, [])

  const login = async (nombre, password) => {
    const { data } = await axios.post('/api/auth/login', { nombre, password })
    localStorage.setItem('moh_token', data.token)
    localStorage.setItem('moh_usuario', JSON.stringify(data.usuario))
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUsuario(data.usuario)
    return data.usuario
  }

  const logout = () => {
    localStorage.removeItem('moh_token')
    localStorage.removeItem('moh_usuario')
    delete axios.defaults.headers.common['Authorization']
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
