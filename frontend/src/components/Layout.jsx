import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSemana } from '../context/SemanaContext'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import io from 'socket.io-client'
import toast from 'react-hot-toast'
import OfflineBanner from './OfflineBanner'
import { usePushNotifications } from '../hooks/usePushNotifications'

export default function Layout({ children }) {
  const { usuario, logout } = useAuth()
  const { semanaVista } = useSemana()
  usePushNotifications()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

  // Rango de la semana que se está viendo en la página activa
  const rangoSemana = `${format(semanaVista, "d 'de' MMMM", { locale: es })} — ${format(addDays(semanaVista, 6), "d 'de' MMMM", { locale: es })}`

  // Socket.io
  useEffect(() => {
    const socket = io('/', { auth: { token: localStorage.getItem('moh_token') } })
    const room = usuario.rol === 'coordinadora' ? 'coordinadora' : usuario.rol === 'supervisora' ? 'supervisora' : `usuario_${usuario.id}`
    socket.emit('join_room', room)

    socket.on('area_completada', ({ mensaje }) => toast.success(mensaje, { icon: '✅', duration: 5000 }))
    socket.on('nueva_alerta', ({ mensaje }) => toast.error(mensaje, { icon: '⚠️', duration: 8000 }))
    socket.on('nuevo_badge', ({ mensaje }) => toast.success(mensaje, { icon: '🌟', duration: 6000 }))
    socket.on('tarea_revision', ({ mensaje }) => toast(mensaje, {
      icon: '↩',
      duration: 10000,
      style: { background: '#dc2626', color: '#fff', fontWeight: '600' }
    }))
    socket.on('area_verificada', ({ mensaje }) => toast.success(mensaje, { icon: '🔍', duration: 6000 }))
    socket.on('comentario_tarea', ({ mensaje }) => toast(mensaje, { icon: '💬', duration: 7000, style: { background: '#1e40af', color: '#fff' } }))

    return () => socket.disconnect()
  }, [usuario])

  const navCoordinadora = [
    { path: '/dashboard', label: 'Panel', icon: '📊' },
    { path: '/asignacion', label: 'Asignar Semana', icon: '📋' },
    { path: '/playbook', label: 'Playbook', icon: '📅' },
    { path: '/reportes', label: 'Reportes', icon: '📈' },
    { path: '/configuracion', label: 'Configuración', icon: '⚙️' },
  ]

  const navSupervisora = [
    { path: '/supervision', label: 'Supervisión', icon: '🔍' },
    { path: '/reportes', label: 'Reportes', icon: '📈' },
  ]

  const navEmpleada = [
    { path: '/mis-tareas', label: 'Mis Tareas', icon: '✅' },
  ]

  const navItems = usuario.rol === 'coordinadora' ? navCoordinadora
    : usuario.rol === 'supervisora' ? navSupervisora
    : navEmpleada

  return (
    <div className="min-h-screen bg-slate-50">
      <OfflineBanner />
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧹</span>
            <div>
              <h1 className="font-bold text-slate-800 text-sm leading-tight">MOH Limpieza</h1>
              <p className="text-xs text-slate-400">{rangoSemana}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Avatar usuario */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer"
              style={{ backgroundColor: usuario.color }}
              onClick={() => setMenuAbierto(!menuAbierto)}
            >
              {usuario.nombre.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="max-w-6xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                location.pathname === item.path
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Menú usuario */}
      {menuAbierto && (
        <div className="fixed inset-0 z-50" onClick={() => setMenuAbierto(false)}>
          <div
            className="absolute top-16 right-4 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 w-56"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-2 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: usuario.color }}>
                {usuario.nombre.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{usuario.nombre}</p>
                <p className="text-xs text-slate-400 capitalize">{usuario.rol}</p>
              </div>
            </div>
            <hr className="border-slate-100 mb-2" />
            <button
              onClick={() => { navigate('/cambiar-password'); setMenuAbierto(false) }}
              className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              🔐 Cambiar contraseña
            </button>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              🚪 Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
