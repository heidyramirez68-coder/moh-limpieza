import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const ESTADO_COLORES = {
  pendiente: 'bg-amber-100 text-amber-700',
  en_progreso: 'bg-blue-100 text-blue-700',
  completada: 'bg-green-100 text-green-700',
}

const ESTADO_LABELS = {
  pendiente: '⏳ Pendiente',
  en_progreso: '🔄 En progreso',
  completada: '✅ Completada',
}

export default function DashboardEmpleada() {
  const { usuario } = useAuth()
  const [tareas, setTareas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [tareaAbierta, setTareaAbierta] = useState(null)
  const [badges, setBadges] = useState([])
  const [gruposHoy, setGruposHoy] = useState([])
  const hoy = new Date()

  useEffect(() => {
    cargarTareas()
    cargarBadges()
    cargarGrupos()
  }, [])

  const cargarGrupos = async () => {
    try {
      const { data } = await axios.get('/api/playbook/activos-hoy')
      setGruposHoy(data)
    } catch {}
  }

  const cargarTareas = async () => {
    try {
      const fecha = format(hoy, 'yyyy-MM-dd')
      const { data } = await axios.get(`/api/tareas/dia/${fecha}`)
      setTareas(data)
    } catch { toast.error('Error cargando tareas') }
    finally { setCargando(false) }
  }

  const cargarBadges = async () => {
    const { data } = await axios.get(`/api/usuarios/${usuario.id}/badges`)
    setBadges(data.slice(0, 5))
  }

  const iniciarTarea = async (tareaId) => {
    try {
      const { data } = await axios.patch(`/api/tareas/${tareaId}/iniciar`)
      setTareas(prev => prev.map(t => t.id === tareaId ? data : t))
      if (tareaAbierta?.id === tareaId) setTareaAbierta(data)
    } catch { toast.error('Error') }
  }

  const toggleChecklist = async (tareaId, itemId, completado) => {
    try {
      const { data } = await axios.patch(`/api/tareas/${tareaId}/checklist/${itemId}`, { completado })
      setTareas(prev => prev.map(t => t.id === tareaId ? data : t))
      if (tareaAbierta?.id === tareaId) setTareaAbierta(data)
      if (data.estado === 'completada') {
        toast.success('¡Área completada! 🎉')
        await cargarBadges()
      }
    } catch { toast.error('Error') }
  }

  const reportarSuministro = async (tareaId, areaId, areaNombre) => {
    const descripcion = prompt(`¿Qué falta en ${areaNombre}?`)
    if (!descripcion) return
    try {
      await axios.post('/api/alertas', { areaId, descripcion })
      toast.success('Alerta enviada a Jeidi y Erika ✓')
    } catch { toast.error('Error enviando alerta') }
  }

  const tareasPendientes = tareas.filter(t => t.estado !== 'completada')
  const tareasCompletadas = tareas.filter(t => t.estado === 'completada')
  const progreso = tareas.length > 0 ? Math.round((tareasCompletadas.length / tareas.length) * 100) : 0

  const BADGE_INFO = {
    dia_perfecto: { icon: '🌟', label: 'Día perfecto' },
    semana_completa: { icon: '🏆', label: 'Semana completa' },
    velocidad_record: { icon: '⚡', label: 'Velocidad récord' },
    equipo: { icon: '🤝', label: 'Trabajo en equipo' },
  }

  if (cargando) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Saludo */}
      <div className="card" style={{ borderLeft: `4px solid ${usuario.color}` }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-xl text-slate-800">¡Buenos días, {usuario.nombre.split(' ')[0]}! 👋</h2>
            <p className="text-slate-500 text-sm mt-0.5 capitalize">{format(hoy, "EEEE d 'de' MMMM", { locale: es })}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: usuario.color }}>{progreso}%</p>
            <p className="text-xs text-slate-400">completado</p>
          </div>
        </div>
        {/* Barra de progreso */}
        <div className="mt-3 bg-slate-100 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${progreso}%`, backgroundColor: usuario.color }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">{tareasCompletadas.length} de {tareas.length} tareas completadas</p>
      </div>

      {/* Grupos activos hoy */}
      {gruposHoy.length > 0 && (
        <div className="card border-2 border-blue-100 bg-blue-50">
          <h3 className="font-semibold text-blue-800 mb-2">🏨 Grupos hospedados hoy</h3>
          <div className="space-y-2">
            {gruposHoy.map(g => (
              <div key={g.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">
                  {g.genero === 'H' ? '👨' : g.genero === 'M' ? '👩' : '👥'}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{g.area.nombre}</p>
                  <p className="text-xs text-slate-500">
                    <span className="font-bold text-blue-700">{g.cantidad} personas</span>
                    {' · '}{g.genero === 'H' ? 'Hombres' : g.genero === 'M' ? 'Mujeres' : 'Mixto'}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    ✈️ Llegó {format(new Date(g.fechaLlegada), "d 'de' MMM", { locale: es })}
                    {' · '}
                    🏠 Sale {format(new Date(g.fechaSalida), "d 'de' MMM", { locale: es })}
                  </p>
                  {g.notas && <p className="text-xs text-amber-600 mt-0.5">📝 {g.notas}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Módulo especial: Lavandería (Yakira) */}
      {usuario.rolEspecial === 'lavanderia' && (
        <div className="card border-2 border-emerald-200 bg-emerald-50">
          <h3 className="font-semibold text-emerald-800 mb-3">🧺 Módulo de Lavandería</h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={async () => { await axios.post('/api/alertas', { areaId: 1, descripcion: 'Lavandería al día ✅' }); toast.success('Estado actualizado') }}
              className="bg-emerald-600 text-white rounded-xl py-2 text-sm font-medium"
            >
              ✅ Lavandería al día
            </button>
            <button
              onClick={async () => { await axios.post('/api/alertas', { areaId: 1, descripcion: '⚠️ Lavandería saturada' }); toast.success('Jeidi y Erika notificadas') }}
              className="bg-amber-500 text-white rounded-xl py-2 text-sm font-medium"
            >
              ⚠️ Lavandería saturada
            </button>
          </div>
          <button
            onClick={async () => { await axios.post('/api/alertas', { areaId: 1, descripcion: '🙋 Yakira disponible para apoyar al equipo' }); toast.success('¡Notificado! Jeidi asignará tareas') }}
            className="w-full bg-white border-2 border-emerald-300 text-emerald-700 rounded-xl py-2 text-sm font-semibold"
          >
            🙋 Disponible para apoyar
          </button>
        </div>
      )}

      {/* Badges recientes */}
      {badges.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 text-sm mb-2">🏅 Mis reconocimientos</h3>
          <div className="flex gap-2 flex-wrap">
            {badges.map(b => (
              <span key={b.id} className="badge bg-violet-100 text-violet-700 text-xs px-3 py-1">
                {BADGE_INFO[b.tipo]?.icon} {BADGE_INFO[b.tipo]?.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tareas pendientes */}
      {tareasPendientes.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-700 mb-3">📋 Mis tareas de hoy</h3>
          <div className="space-y-3">
            {tareasPendientes.map(tarea => (
              <TarjetaTarea
                key={tarea.id}
                tarea={tarea}
                abierta={tareaAbierta?.id === tarea.id}
                onAbrir={() => setTareaAbierta(tareaAbierta?.id === tarea.id ? null : tarea)}
                onIniciar={() => iniciarTarea(tarea.id)}
                onToggle={toggleChecklist}
                onReportar={reportarSuministro}
                colorUsuario={usuario.color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tareas completadas */}
      {tareasCompletadas.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-700 mb-3">✅ Completadas hoy</h3>
          <div className="space-y-2">
            {tareasCompletadas.map(tarea => (
              <div key={tarea.id} className="card flex items-center gap-3 opacity-70">
                <span className="text-green-500 text-xl">✅</span>
                <div className="flex-1">
                  <p className="font-medium text-slate-700 text-sm">{tarea.area.nombre}</p>
                  {tarea.minutosTotal && <p className="text-xs text-slate-400">Tiempo: {tarea.minutosTotal} min</p>}
                </div>
                {tarea.pasadoDeAyer && <span className="badge bg-amber-100 text-amber-700 text-xs">De ayer</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tareas.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🌟</p>
          <p className="font-medium">No tienes tareas asignadas hoy</p>
          <p className="text-sm mt-1">¡Que sea un buen día!</p>
        </div>
      )}
    </div>
  )
}

function TarjetaTarea({ tarea, abierta, onAbrir, onIniciar, onToggle, onReportar, colorUsuario }) {
  const completaciones = tarea.checklistCompletaciones || []
  const totalItems = tarea.area.checklistItems?.length || 0
  const progreso = totalItems > 0 ? Math.round((completaciones.length / totalItems) * 100) : 0

  return (
    <div className="card border border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={onAbrir}>
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-lg flex-shrink-0">
          {tarea.area.tipo === 'dormitorio' ? '🛏️'
            : tarea.area.tipo === 'oficina' ? '🏢'
            : tarea.area.tipo === 'bano' ? '🚿'
            : tarea.area.tipo === 'casa_staff_americano' ? '🏠'
            : tarea.area.tipo === 'orange_house' ? '🟠'
            : tarea.area.tipo === 'lavanderia' ? '🧺'
            : '📍'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{tarea.area.nombre}</p>
          {tarea.area.horaFija && <p className="text-xs text-violet-600">🕐 {tarea.area.horaFija}</p>}
          {tarea.pasadoDeAyer && <span className="badge bg-amber-100 text-amber-700 text-xs">📅 De ayer</span>}
          {/* Mini progreso */}
          {totalItems > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${progreso}%`, backgroundColor: colorUsuario }} />
              </div>
              <span className="text-xs text-slate-400">{completaciones.length}/{totalItems}</span>
            </div>
          )}
        </div>
        <span className="text-slate-400 text-sm">{abierta ? '▲' : '▼'}</span>
      </div>

      {/* Expandido: checklist */}
      {abierta && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          {tarea.estado === 'pendiente' && (
            <button onClick={onIniciar} className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm font-medium mb-3">
              ▶ Iniciar tarea
            </button>
          )}

          {tarea.area.notas && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs text-amber-800">
              📝 {tarea.area.notas}
            </div>
          )}

          {/* Checklist */}
          <div className="space-y-2">
            {tarea.area.checklistItems?.map(item => {
              const completado = completaciones.some(c => c.checklistItemId === item.id)
              return (
                <label key={item.id} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${completado ? 'bg-green-50' : 'bg-slate-50 hover:bg-slate-100'}`}>
                  <input
                    type="checkbox"
                    checked={completado}
                    onChange={e => onToggle(tarea.id, item.id, e.target.checked)}
                    className="w-5 h-5 rounded-md accent-violet-600"
                  />
                  <span className={`text-sm flex-1 ${completado ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {item.descripcion}
                  </span>
                  {completado && <span className="text-green-500 text-sm">✓</span>}
                </label>
              )
            })}
          </div>

          {/* Botón suministro faltante */}
          <button
            onClick={() => onReportar(tarea.id, tarea.areaId, tarea.area.nombre)}
            className="w-full mt-3 border border-red-200 text-red-600 bg-red-50 rounded-xl py-2 text-xs font-medium hover:bg-red-100"
          >
            ⚠️ Reportar suministro faltante
          </button>
        </div>
      )}
    </div>
  )
}
