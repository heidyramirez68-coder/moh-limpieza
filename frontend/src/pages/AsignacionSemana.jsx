import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format, startOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function AsignacionSemana() {
  const [areas, setAreas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [tareasSemana, setTareasSemana] = useState({})
  const [semanaInicio, setSemanaInicio] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [filtroDia, setFiltroDia] = useState(0) // 0 = Lunes
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [guardando, setGuardando] = useState(false)
  const [mostrarEventos, setMostrarEventos] = useState(false)

  useEffect(() => { cargarDatos() }, [semanaInicio])

  const cargarDatos = async () => {
    try {
      const fechaStr = format(semanaInicio, 'yyyy-MM-dd')
      const [areasRes, usuariosRes, tareasRes] = await Promise.all([
        axios.get('/api/areas'),
        axios.get('/api/usuarios'),
        axios.get(`/api/tareas/dia/${fechaStr}`)
      ])
      setAreas(areasRes.data)
      setUsuarios(usuariosRes.data.filter(u => u.rol === 'empleada'))

      // Cargar tareas de toda la semana
      const semanaObj = {}
      for (let i = 0; i < 7; i++) {
        const fecha = format(addDays(semanaInicio, i), 'yyyy-MM-dd')
        const { data } = await axios.get(`/api/tareas/dia/${fecha}`)
        semanaObj[i] = data
      }
      setTareasSemana(semanaObj)
    } catch { toast.error('Error cargando datos') }
  }

  const fechaDia = (diaIndex) => format(addDays(semanaInicio, diaIndex), 'yyyy-MM-dd')

  const asignarTarea = async (areaId, usuarioId, diaIndex) => {
    const fecha = fechaDia(diaIndex)
    try {
      const { data } = await axios.post('/api/tareas', { fecha, areaId, usuarioId })
      setTareasSemana(prev => ({
        ...prev,
        [diaIndex]: [...(prev[diaIndex] || []), data]
      }))
      toast.success('Tarea asignada ✓')
    } catch { toast.error('Error asignando tarea') }
  }

  const eliminarTarea = async (tareaId, diaIndex, nombreArea, nombreEmpleada) => {
    if (!confirm(`¿Quitar a ${nombreEmpleada} de "${nombreArea}"?`)) return
    try {
      await axios.delete(`/api/tareas/${tareaId}`)
      setTareasSemana(prev => ({
        ...prev,
        [diaIndex]: prev[diaIndex].filter(t => t.id !== tareaId)
      }))
      toast.success('Tarea eliminada ✓')
    } catch { toast.error('Error') }
  }

  const activarEvento = async (nombreCasa, activa) => {
    // Activar/desactivar TODOS los cuartos de esa casa
    const cuartosDeCasa = areas.filter(a => a.nombre.startsWith(nombreCasa))
    await Promise.all(cuartosDeCasa.map(a =>
      axios.patch(`/api/areas/${a.id}/activar-evento`, { activa })
    ))
    const { data } = await axios.get('/api/areas')
    setAreas(data)
    toast.success(activa ? `${nombreCasa} activada ✓ (${cuartosDeCasa.length} cuartos)` : `${nombreCasa} desactivada`)
  }

  const tareasDelDia = tareasSemana[filtroDia] || []
  // Mostrar todas las áreas activas (incluyendo eventos si están activos en DB)
  const areasActivas = areas.filter(a => a.activa)
  const areasFiltradas = filtroTipo === 'todos' ? areasActivas : areasActivas.filter(a => a.tipo === filtroTipo)

  const TIPOS = [
    { value: 'todos', label: 'Todas' },
    { value: 'dormitorio', label: '🛏️ Dormitorios' },
    { value: 'casa_staff_americano', label: '🏠 Casas Staff' },
    { value: 'oficina', label: '🏢 Oficinas' },
    { value: 'orange_house', label: '🟠 Orange House' },
    { value: 'casa_evento', label: '🏨 Vision/Staff House' },
    { value: 'bano', label: '🚿 Baños/Iglesia' },
    { value: 'warehouse', label: '📦 Warehouse' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-slate-800">Asignación Semanal</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setSemanaInicio(prev => addDays(prev, -7))} className="btn-secondary px-3">←</button>
          <span className="text-sm font-medium text-slate-600">
            {format(semanaInicio, "d MMM", { locale: es })} — {format(addDays(semanaInicio, 6), "d MMM yyyy", { locale: es })}
          </span>
          <button onClick={() => setSemanaInicio(prev => addDays(prev, 7))} className="btn-secondary px-3">→</button>
        </div>
      </div>

      {/* Activar eventos especiales */}
      <div className="card">
        <h3 className="font-semibold text-slate-700 mb-3">🏨 Activar áreas por evento</h3>
        <div className="grid grid-cols-2 gap-2">
          {areas.filter(a => a.activaPorEvento).reduce((acc, area) => {
            const casa = area.nombre.split(' — ')[0]
            if (!acc.find(c => c.nombre === casa)) {
              const cuartos = areas.filter(a => a.nombre.startsWith(casa))
              const todosActivos = cuartos.every(a => a.activa)
              acc.push({ nombre: casa, activa: todosActivos, total: cuartos.length })
            }
            return acc
          }, []).map(casa => (
            <div key={casa.nombre} className={`flex items-center justify-between p-3 rounded-xl border ${casa.activa ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
              <div>
                <span className="text-sm font-medium">{casa.nombre}</span>
                <p className="text-xs text-slate-400">{casa.total} cuartos</p>
              </div>
              <button
                onClick={() => activarEvento(casa.nombre, !casa.activa)}
                className={`text-xs px-2 py-1 rounded-lg font-medium ${casa.activa ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}
              >
                {casa.activa ? 'Activa' : 'Activar'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Selector de día */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {DIAS.map((dia, i) => {
          const fecha = addDays(semanaInicio, i)
          const tareasCount = (tareasSemana[i] || []).length
          return (
            <button
              key={i}
              onClick={() => setFiltroDia(i)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-sm transition-all ${
                filtroDia === i ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="font-medium">{dia.slice(0, 3)}</span>
              <span className="text-xs opacity-75">{format(fecha, 'd')}</span>
              {tareasCount > 0 && (
                <span className={`text-xs font-bold mt-0.5 ${filtroDia === i ? 'text-violet-200' : 'text-violet-600'}`}>{tareasCount}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Filtro por tipo */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TIPOS.map(t => (
          <button
            key={t.value}
            onClick={() => setFiltroTipo(t.value)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
              filtroTipo === t.value ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Día seleccionado */}
      <div>
        <h3 className="font-semibold text-slate-700 mb-3">
          {DIAS[filtroDia]}, {format(addDays(semanaInicio, filtroDia), "d 'de' MMMM", { locale: es })}
        </h3>

        {/* Tareas asignadas */}
        {tareasDelDia.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Asignadas ({tareasDelDia.length})</p>
            {tareasDelDia.map(tarea => (
              <div key={tarea.id} className="card flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: tarea.usuario.color }}>
                  {tarea.usuario.nombre.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{tarea.area.nombre}</p>
                  <p className="text-xs text-slate-400">{tarea.usuario.nombre}</p>
                </div>
                <button
                  onClick={() => eliminarTarea(tarea.id, filtroDia, tarea.area.nombre, tarea.usuario.nombre)}
                  className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 flex-shrink-0 font-medium"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Áreas disponibles para asignar */}
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Asignar área</p>
        <div className="space-y-2">
          {areasFiltradas.map(area => {
            const tareasArea = tareasDelDia.filter(t => t.areaId === area.id)
            return (
              <div key={area.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{area.nombre}</p>
                    {area.horaFija && <p className="text-xs text-violet-600">🕐 {area.horaFija}</p>}
                    {area.notas && <p className="text-xs text-amber-600">📝 {area.notas}</p>}
                  </div>
                  {tareasArea.length > 0 && (
                    <div className="flex -space-x-1">
                      {tareasArea.map(t => (
                        <div key={t.id} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: t.usuario.color }}>
                          {t.usuario.nombre.charAt(0)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Asignar empleadas */}
                <div className="flex gap-1.5 flex-wrap">
                  {usuarios.map(u => {
                    const yaAsignada = tareasArea.some(t => t.usuarioId === u.id)
                    const maxAlcanzado = tareasArea.length >= 3
                    return (
                      <button
                        key={u.id}
                        onClick={() => !yaAsignada && !maxAlcanzado && asignarTarea(area.id, u.id, filtroDia)}
                        disabled={yaAsignada || (maxAlcanzado && !yaAsignada)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                          yaAsignada ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40'
                        }`}
                        style={yaAsignada ? { backgroundColor: u.color, color: 'white' } : {}}
                      >
                        {yaAsignada ? '✓ ' : ''}{u.nombre.split(' ')[0]}
                      </button>
                    )
                  })}
                </div>
                {tareasArea.length >= 3 && (
                  <p className="text-xs text-amber-600 mt-1">Máximo 3 personas por área alcanzado</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
