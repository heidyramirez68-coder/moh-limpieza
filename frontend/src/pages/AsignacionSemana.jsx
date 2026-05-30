import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format, startOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { useSemana } from '../context/SemanaContext'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function AsignacionSemana() {
  const { setSemanaVista } = useSemana()
  const [areas, setAreas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [tareasSemana, setTareasSemana] = useState({})
  const [semanaInicio, setSemanaInicio] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [filtroDia, setFiltroDia] = useState(0) // 0 = Lunes
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [guardando, setGuardando] = useState(false)
  const [mostrarEventos, setMostrarEventos] = useState(false)
  const [modalDividir, setModalDividir] = useState(null) // { area, tareas, checklistItems }
  const [divisionItems, setDivisionItems] = useState({}) // { tareaId: [itemId, ...] }

  useEffect(() => {
    setSemanaVista(semanaInicio)
    cargarDatos()
  }, [semanaInicio])

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

  const abrirDividir = async (area, tareas) => {
    const { data } = await axios.get(`/api/areas/${area.id}`)
    const items = data.checklistItems || []
    // Cargar división existente
    const division = {}
    for (const t of tareas) {
      division[t.id] = t.checklistFiltro ? JSON.parse(t.checklistFiltro) : []
    }
    setDivisionItems(division)
    setModalDividir({ area, tareas, checklistItems: items })
  }

  const toggleItemPersona = (tareaId, itemId) => {
    setDivisionItems(prev => {
      const actual = prev[tareaId] || []
      const yaAsignado = actual.includes(itemId)
      // Si está asignado a esta persona, quitar
      if (yaAsignado) return { ...prev, [tareaId]: actual.filter(id => id !== itemId) }
      // Si está asignado a otra persona, mover a esta
      const nuevaDivision = { ...prev }
      for (const tid of Object.keys(nuevaDivision)) {
        nuevaDivision[tid] = (nuevaDivision[tid] || []).filter(id => id !== itemId)
      }
      nuevaDivision[tareaId] = [...(nuevaDivision[tareaId] || []), itemId]
      return nuevaDivision
    })
  }

  const guardarDivision = async () => {
    try {
      await Promise.all(
        Object.entries(divisionItems).map(([tareaId, itemIds]) =>
          axios.patch(`/api/tareas/${tareaId}/checklist-filtro`, { itemIds: itemIds.length > 0 ? itemIds : null })
        )
      )
      // Actualizar estado local
      setTareasSemana(prev => ({
        ...prev,
        [filtroDia]: (prev[filtroDia] || []).map(t => {
          if (divisionItems[t.id] !== undefined) {
            return { ...t, checklistFiltro: divisionItems[t.id].length > 0 ? JSON.stringify(divisionItems[t.id]) : null }
          }
          return t
        })
      }))
      toast.success('División guardada ✓')
      setModalDividir(null)
    } catch { toast.error('Error guardando') }
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
  // Mostrar áreas normales siempre + áreas de evento solo si están activas
  const areasActivas = areas.filter(a => a.activaPorEvento ? a.activa : true)
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
          {[
            { nombre: 'Vision House', key: 'Vision House' },
            { nombre: 'Staff House', key: 'Staff House' },
          ].map(casa => {
            const cuartos = areas.filter(a => a.nombre.startsWith(casa.key))
            const activa = cuartos.length > 0 && cuartos.some(a => a.activa)
            return (
              <div key={casa.key} className={`flex items-center justify-between p-3 rounded-xl border ${activa ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                <div>
                  <span className="text-sm font-medium">{casa.nombre}</span>
                  <p className="text-xs text-slate-400">{cuartos.length > 0 ? `${cuartos.length} cuartos` : 'Sin cuartos'}</p>
                </div>
                <button
                  onClick={() => activarEvento(casa.key, !activa)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium ${activa ? 'bg-green-600 text-white' : 'bg-violet-600 text-white'}`}
                >
                  {activa ? '✓ Activa' : 'Activar'}
                </button>
              </div>
            )
          })}
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

        {/* Contador + instrucción */}
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          {tareasDelDia.length > 0
            ? `${tareasDelDia.length} asignadas · toca nombre coloreado para quitar`
            : 'Asignar área'}
        </p>
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
                    const tareaDeUsuario = tareasArea.find(t => t.usuarioId === u.id)
                    const yaAsignada = !!tareaDeUsuario
                    const maxAlcanzado = tareasArea.length >= 3
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          if (yaAsignada) {
                            eliminarTarea(tareaDeUsuario.id, filtroDia, area.nombre, u.nombre)
                          } else if (!maxAlcanzado) {
                            asignarTarea(area.id, u.id, filtroDia)
                          }
                        }}
                        disabled={!yaAsignada && maxAlcanzado}
                        title={yaAsignada ? 'Clic para quitar' : 'Clic para asignar'}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                          yaAsignada
                            ? 'text-white hover:opacity-75 active:opacity-60'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40'
                        }`}
                        style={yaAsignada ? { backgroundColor: u.color } : {}}
                      >
                        {yaAsignada ? `✓ ${u.nombre.split(' ')[0]}` : u.nombre.split(' ')[0]}
                      </button>
                    )
                  })}
                </div>
                {tareasArea.length >= 3 && (
                  <p className="text-xs text-amber-600 mt-1">Máximo 3 personas por área alcanzado</p>
                )}
                {/* Botón dividir checklist cuando hay 2+ personas */}
                {tareasArea.length >= 2 && (
                  <button
                    onClick={() => abrirDividir(area, tareasArea)}
                    className="mt-2 w-full text-xs border border-violet-200 text-violet-700 bg-violet-50 rounded-lg py-1.5 font-medium hover:bg-violet-100"
                  >
                    ✂️ Dividir checklist entre {tareasArea.length} personas
                    {tareasArea.some(t => t.checklistFiltro) && ' ✓'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal dividir checklist */}
      {modalDividir && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">✂️ Dividir checklist</h3>
              <p className="text-sm text-slate-500 mt-0.5">{modalDividir.area.nombre}</p>
              <p className="text-xs text-slate-400 mt-1">Toca un ítem para asignarlo a una persona. Cada ítem va a una sola persona.</p>
            </div>

            {/* Personas asignadas */}
            <div className="flex gap-2 px-5 pt-4">
              {modalDividir.tareas.map(t => (
                <div key={t.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold" style={{ backgroundColor: t.usuario.color }}>
                  <span>{t.usuario.nombre.split(' ')[0]}</span>
                  <span className="opacity-75">({(divisionItems[t.id] || []).length} ítems)</span>
                </div>
              ))}
              {modalDividir.tareas.some(t => (divisionItems[t.id] || []).length === 0) && (
                <span className="text-xs text-amber-600 self-center">⚠️ Sin asignar: {modalDividir.checklistItems.filter(item => !Object.values(divisionItems).flat().includes(item.id)).length}</span>
              )}
            </div>

            {/* Lista de ítems */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {modalDividir.checklistItems.map(item => {
                const asignadoA = modalDividir.tareas.find(t => (divisionItems[t.id] || []).includes(item.id))
                return (
                  <div key={item.id} className="border border-slate-200 rounded-xl p-3">
                    <p className="text-sm text-slate-700 mb-2">{item.descripcion}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {modalDividir.tareas.map(t => (
                        <button
                          key={t.id}
                          onClick={() => toggleItemPersona(t.id, item.id)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                            asignadoA?.id === t.id ? 'text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                          style={asignadoA?.id === t.id ? { backgroundColor: t.usuario.color } : {}}
                        >
                          {asignadoA?.id === t.id ? `✓ ${t.usuario.nombre.split(' ')[0]}` : t.usuario.nombre.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-5 border-t border-slate-100 flex gap-2">
              <button onClick={guardarDivision} className="flex-1 bg-violet-600 text-white rounded-xl py-2.5 text-sm font-semibold">
                💾 Guardar división
              </button>
              <button onClick={() => setModalDividir(null)} className="flex-1 btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
