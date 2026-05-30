import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

export default function DashboardSupervisora() {
  const { usuario } = useAuth()
  const [resumen, setResumen] = useState([])
  const [cargando, setCargando] = useState(true)
  const [fechaVista, setFechaVista] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notaModal, setNotaModal] = useState(null) // { tareaId, areaNombre }
  const [nota, setNota] = useState('')

  useEffect(() => { cargarDatos() }, [fechaVista])

  // Notificaciones en tiempo real
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', { transports: ['websocket', 'polling'] })
    socket.emit('join_room', 'supervisora')
    socket.on('area_completada', ({ mensaje }) => {
      toast.success(mensaje || '✅ Área completada', {
        duration: 8000,
        style: { background: '#065f46', color: '#fff', fontWeight: '600' }
      })
      const hoyStr = format(new Date(), 'yyyy-MM-dd')
      if (fechaVista === hoyStr) cargarDatos()
    })
    return () => socket.disconnect()
  }, [fechaVista])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const { data } = await axios.get(`/api/tareas/resumen/${fechaVista}`)
      setResumen(data)
    } catch { toast.error('Error cargando datos') }
    finally { setCargando(false) }
  }

  const verificar = async (tareaId, aprobada, notaTexto = '') => {
    try {
      await axios.patch(`/api/tareas/${tareaId}/verificar`, { aprobada, nota: notaTexto })
      setResumen(prev => prev.map(t =>
        t.id === tareaId ? { ...t, verificada: aprobada, notaVerif: notaTexto || (aprobada ? '✓ Verificada' : '↩ Necesita revisión') } : t
      ))
      toast.success(aprobada ? '✅ Área aprobada' : '↩ Enviada a revisión')
      setNotaModal(null)
      setNota('')
    } catch { toast.error('Error') }
  }

  const abrirModalRevision = (tareaId, areaNombre) => {
    setNotaModal({ tareaId, areaNombre })
    setNota('')
  }

  // Separar por estado
  const completadas = resumen.filter(t => t.estado === 'completada')
  const pendientes = resumen.filter(t => t.estado !== 'completada')
  const verificadas = completadas.filter(t => t.verificada)
  const porVerificar = completadas.filter(t => !t.verificada)

  const progreso = resumen.length > 0 ? Math.round((completadas.length / resumen.length) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Supervisión</h2>
          <p className="text-slate-500 text-sm capitalize">
            {format(new Date(fechaVista + 'T12:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <input type="date" value={fechaVista} onChange={e => setFechaVista(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-3xl font-bold text-violet-600">{progreso}%</p>
          <p className="text-xs text-slate-500 mt-1">Progreso equipo</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-cyan-600">{verificadas.length}</p>
          <p className="text-xs text-slate-500 mt-1">Verificadas</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-500">{porVerificar.length}</p>
          <p className="text-xs text-slate-500 mt-1">Por revisar</p>
        </div>
      </div>

      {/* Por verificar */}
      {porVerificar.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-700">🔍 Por verificar ({porVerificar.length})</h3>
          {porVerificar.map(t => (
            <div key={t.id} className="card border-2 border-amber-200 bg-amber-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: t.usuario.color }}>
                  {t.usuario.nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{t.area.nombre}</p>
                  <p className="text-xs text-slate-500">{t.usuario.nombre.split(' ')[0]}
                    {t.minutosTotal ? ` · ${t.minutosTotal} min` : ''}
                  </p>
                  {t.comentario && (
                    <p className="text-xs text-amber-700 mt-0.5">💬 {t.comentario}</p>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => verificar(t.id, true)}
                    className="bg-green-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold"
                  >✓ OK</button>
                  <button
                    onClick={() => abrirModalRevision(t.id, t.area.nombre)}
                    className="bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold"
                  >↩</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verificadas */}
      {verificadas.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-700">✅ Verificadas ({verificadas.length})</h3>
          {verificadas.map(t => (
            <div key={t.id} className="card flex items-center gap-3 opacity-80 bg-green-50 border border-green-100">
              <span className="text-green-500 text-lg">✅</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{t.area.nombre}</p>
                <p className="text-xs text-slate-400">{t.usuario.nombre.split(' ')[0]}
                  {t.minutosTotal ? ` · ${t.minutosTotal} min` : ''}
                </p>
              </div>
              <button onClick={() => abrirModalRevision(t.id, t.area.nombre)}
                className="text-xs text-slate-400 border border-slate-200 px-2 py-1 rounded-lg">
                ↩ Revisión
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pendientes del equipo */}
      {pendientes.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-700">⏳ Pendientes del equipo ({pendientes.length})</h3>
          {pendientes.map(t => (
            <div key={t.id} className={`card flex items-center gap-3 ${t.estado === 'en_progreso' ? 'bg-blue-50' : 'bg-slate-50'}`}>
              <span>{t.estado === 'en_progreso' ? '🔄' : '⏳'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{t.area.nombre}</p>
                <p className="text-xs text-slate-400">{t.usuario.nombre.split(' ')[0]}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {cargando && (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full" />
        </div>
      )}

      {!cargando && resumen.length === 0 && (
        <div className="card text-center py-10 text-slate-400">
          <p className="text-3xl mb-2">📋</p>
          <p>No hay tareas asignadas para esta fecha</p>
        </div>
      )}

      <button onClick={cargarDatos} className="w-full btn-secondary">🔄 Actualizar</button>

      {/* Modal para enviar a revisión */}
      {notaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
            <h3 className="font-bold text-slate-800">↩ Enviar a revisión</h3>
            <p className="text-sm text-slate-500">{notaModal.areaNombre}</p>
            <textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="¿Qué necesita revisión? (ej: Falta barrer bajo las camas)"
              className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => verificar(notaModal.tareaId, false, nota)}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold"
              >↩ Enviar a revisión</button>
              <button
                onClick={() => { setNotaModal(null); setNota('') }}
                className="flex-1 btn-secondary"
              >Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
