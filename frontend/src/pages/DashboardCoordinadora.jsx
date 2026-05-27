import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function DashboardCoordinadora() {
  const [resumen, setResumen] = useState([])
  const [alertas, setAlertas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [fechaVista, setFechaVista] = useState(format(new Date(), 'yyyy-MM-dd'))
  const hoy = new Date()

  useEffect(() => { cargarDatos() }, [fechaVista])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [resumenRes, alertasRes] = await Promise.all([
        axios.get(`/api/tareas/resumen/${fechaVista}`),
        axios.get('/api/alertas')
      ])
      setResumen(resumenRes.data)
      setAlertas(alertasRes.data)
    } catch { toast.error('Error cargando datos') }
    finally { setCargando(false) }
  }

  const resolverAlerta = async (id) => {
    await axios.patch(`/api/alertas/${id}/resolver`)
    setAlertas(prev => prev.filter(a => a.id !== id))
    toast.success('Alerta resuelta')
  }

  // Agrupar por usuario
  const porUsuario = {}
  resumen.forEach(t => {
    const uid = t.usuario.id
    if (!porUsuario[uid]) porUsuario[uid] = { usuario: t.usuario, tareas: [], completadas: 0, pendientes: 0, enProgreso: 0, minutosTotal: 0 }
    porUsuario[uid].tareas.push(t)
    if (t.estado === 'completada') {
      porUsuario[uid].completadas++
      if (t.minutosTotal) porUsuario[uid].minutosTotal += t.minutosTotal
    }
    else if (t.estado === 'en_progreso') porUsuario[uid].enProgreso++
    else porUsuario[uid].pendientes++
  })

  // Ranking de velocidad (solo las que tienen tiempo grabado)
  const ranking = Object.values(porUsuario)
    .filter(u => u.completadas > 0 && u.minutosTotal > 0)
    .map(u => ({ ...u, promedio: Math.round(u.minutosTotal / u.completadas) }))
    .sort((a, b) => a.promedio - b.promedio)

  const totalTareas = resumen.length
  const totalCompletadas = resumen.filter(t => t.estado === 'completada').length
  const progresoGeneral = totalTareas > 0 ? Math.round((totalCompletadas / totalTareas) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Panel de Control</h2>
          <p className="text-slate-500 text-sm capitalize">{format(new Date(fechaVista + 'T12:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })}</p>
        </div>
        <input
          type="date"
          value={fechaVista}
          onChange={e => setFechaVista(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
        />
      </div>

      {/* Alertas de suministros */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map(a => (
            <div key={a.id} className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-red-700 text-sm">⚠️ Suministro faltante</p>
                <p className="text-red-600 text-sm mt-0.5">{a.area?.nombre}: {a.descripcion}</p>
                <p className="text-red-400 text-xs mt-0.5">Reportado por {a.reportador?.nombre}</p>
              </div>
              <button onClick={() => resolverAlerta(a.id)} className="bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex-shrink-0">
                Resolver
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats generales */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-3xl font-bold text-violet-600">{progresoGeneral}%</p>
          <p className="text-xs text-slate-500 mt-1">Progreso general</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{totalCompletadas}</p>
          <p className="text-xs text-slate-500 mt-1">Completadas</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-500">{totalTareas - totalCompletadas}</p>
          <p className="text-xs text-slate-500 mt-1">Pendientes</p>
        </div>
      </div>

      {/* ⏱ Ranking de velocidad */}
      {ranking.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-3">⚡ Velocidad de hoy</h3>
          <div className="space-y-2">
            {ranking.map((u, i) => {
              const medallas = ['🥇', '🥈', '🥉']
              const maxPromedio = ranking[ranking.length - 1].promedio
              const barWidth = Math.round((u.promedio / maxPromedio) * 100)
              return (
                <div key={u.usuario.id} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{medallas[i] || `${i + 1}.`}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: u.usuario.color }}>
                    {u.usuario.nombre.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-slate-700">{u.usuario.nombre.split(' ')[0]}</span>
                      <span className="text-xs font-bold text-violet-700">{u.promedio} min/tarea</span>
                    </div>
                    <div className="bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${barWidth}%`, backgroundColor: u.usuario.color }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{u.completadas} tareas · {u.minutosTotal} min total</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">* Solo incluye tareas donde se presionó "Iniciar"</p>
        </div>
      )}

      {/* Por empleada */}
      {cargando ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-700">Progreso por empleada</h3>
          {Object.values(porUsuario).length === 0 ? (
            <div className="card text-center py-10 text-slate-400">
              <p>No hay tareas asignadas para esta fecha</p>
            </div>
          ) : (
            Object.values(porUsuario).map(({ usuario, tareas, completadas, pendientes, enProgreso }) => {
              const progreso = tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0
              return (
                <div key={usuario.id} className="card">
                  {/* Header empleada */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: usuario.color }}>
                      {usuario.nombre.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-800">{usuario.nombre}</p>
                        <span className="text-sm font-bold" style={{ color: usuario.color }}>{progreso}%</span>
                      </div>
                      <div className="mt-1 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${progreso}%`, backgroundColor: usuario.color }} />
                      </div>
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div className="flex gap-2 mb-3">
                    <span className="badge bg-green-100 text-green-700">{completadas} completadas</span>
                    {enProgreso > 0 && <span className="badge bg-blue-100 text-blue-700">{enProgreso} en progreso</span>}
                    {pendientes > 0 && <span className="badge bg-amber-100 text-amber-700">{pendientes} pendientes</span>}
                  </div>

                  {/* Lista de tareas */}
                  <div className="space-y-1.5">
                    {tareas.map(tarea => {
                      const totalItems = tarea.area?.checklistItems?.length || 0
                      const completacionesTarea = tarea.checklistCompletaciones?.length || 0
                      return (
                        <div key={tarea.id} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                          tarea.estado === 'completada' ? 'bg-green-50' : tarea.estado === 'en_progreso' ? 'bg-blue-50' : 'bg-slate-50'
                        }`}>
                          <span>{tarea.estado === 'completada' ? '✅' : tarea.estado === 'en_progreso' ? '🔄' : '⏳'}</span>
                          <span className="flex-1 text-slate-700 truncate">{tarea.area.nombre}</span>
                          {tarea.pasadoDeAyer && <span className="text-xs text-amber-500">📅</span>}
                          {totalItems > 0 && (
                            <span className="text-xs text-slate-400">{completacionesTarea}/{totalItems}</span>
                          )}
                          {tarea.minutosTotal && <span className="text-xs text-slate-400">{tarea.minutosTotal}min</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Botón actualizar */}
      <button onClick={cargarDatos} className="w-full btn-secondary">
        🔄 Actualizar
      </button>
    </div>
  )
}
