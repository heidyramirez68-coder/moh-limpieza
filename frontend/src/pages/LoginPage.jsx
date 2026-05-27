import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const COLORES_USUARIO = {
  'Jeidi Ramírez': '#7C3AED',
  'Erika': '#0891B2',
  'Yakira': '#059669',
  'Yinelda': '#DC2626',
  'Ederlin': '#D97706',
  'Senaida': '#BE185D',
  'Katherine': '#7C3AED',
  'Ana Iris': '#65A30D',
}

export default function LoginPage() {
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre || !password) return toast.error('Ingresa tu nombre y contraseña')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-900 flex flex-col items-center justify-center p-4">
      {/* Logo y nombre */}
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
            <label className="text-sm font-medium text-slate-600 block mb-1">Tu nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Yakira"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
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
        <p className="text-center text-xs text-slate-400 mt-4">
          Si olvidaste tu contraseña, habla con Jeidi
        </p>
      </div>
    </div>
  )
}
