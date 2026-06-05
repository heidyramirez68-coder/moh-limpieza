import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || ''

export default function LoginPage() {
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [usuarios, setUsuarios] = useState([])
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false)
  const [emailRecuperar, setEmailRecuperar] = useState('')
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    axios.get(`${API}/api/auth/usuarios-publicos`)
      .then(r => setUsuarios(r.data))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre || !password) return toast.error('Selecciona tu nombre y contraseña')
    setCargando(true)
    try {
      const usuario = await login(nombre, password)
      toast.success(`¡Bienvenida, ${usuario.nombre.split(' ')[0]}! 🙏`)
      if (usuario.primerLogin) {
        navigate('/cambiar-password')
      } else if (usuario.rol === 'coordinadora' || usuario.rol === 'supervisora') {
        navigate('/dashboard')
      } else {
        navigate('/mis-tareas')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  const handleRecuperar = async (e) => {
    e.preventDefault()
    if (!nombre) return toast.error('Primero selecciona tu nombre')
    if (!emailRecuperar) return toast.error('Ingresa tu email')
    setEnviandoEmail(true)
    try {
      await axios.post(`${API}/api/auth/recuperar-password`, { nombre, email: emailRecuperar })
      toast.success('¡Revisa tu email! Te enviamos una contraseña temporal.')
      setMostrarRecuperar(false)
      setEmailRecuperar('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo enviar el email')
    } finally {
      setEnviandoEmail(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-900 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
          <span className="text-4xl">🧹</span>
        </div>
        <h1 className="text-white text-3xl font-bold">MOH Limpieza</h1>
        <p className="text-violet-300 text-sm mt-1">Mission of Hope</p>
      </div>

      {/* Pasaje bíblico */}
      <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-6 max-w-sm w-full text-center border border-white/20">
        <p className="text-white/90 text-sm italic leading-relaxed">
          "Todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres."
        </p>
        <p className="text-violet-300 text-xs mt-2 font-medium">— Colosenses 3:23</p>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
        <h2 className="text-slate-800 font-bold text-xl mb-5 text-center">Iniciar sesión</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">¿Quién eres?</label>
            <select
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
            >
              <option value="">— Selecciona tu nombre —</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.nombre}>{u.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 mt-2"
          >
            {cargando ? 'Entrando...' : 'Entrar →'}
          </button>
        </form>

        <button
          onClick={() => setMostrarRecuperar(!mostrarRecuperar)}
          className="w-full text-center text-sm text-violet-600 mt-4 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </button>

        {mostrarRecuperar && (
          <form onSubmit={handleRecuperar} className="mt-4 space-y-3 border-t pt-4">
            <p className="text-xs text-slate-500 text-center">Te enviaremos una contraseña temporal a tu email</p>
            {!nombre && <p className="text-xs text-red-500 text-center">↑ Primero selecciona tu nombre arriba</p>}
            <input
              type="email"
              value={emailRecuperar}
              onChange={e => setEmailRecuperar(e.target.value)}
              placeholder="Tu email"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
            <button
              type="submit"
              disabled={enviandoEmail}
              className="w-full bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-semibold py-2 rounded-xl transition-all text-sm"
            >
              {enviandoEmail ? 'Enviando...' : 'Enviar contraseña temporal'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
