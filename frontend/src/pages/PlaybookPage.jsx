// ─── PLAYBOOK PAGE ───────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format, startOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { useSemana } from '../context/SemanaContext'

export function PlaybookPage() {
  const { setSemanaVista } = useSemana()
  const [grupos, setGrupos] = useState([])
  const [areas, setAreas] = useState([])
  const [semanaInicio, setSemanaInicio] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const semanaActual = startOfWeek(new Date(), { weekStartsOn: 1 })
  const esEstaSemana = semanaInicio.getTime() === semanaActual.getTime()
  const [form, setForm] = useState({ areaId: '', cantidad: '', genero: 'Mixto', fechaLlegada: '', fechaSalida: '', notas: '' })
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [formEdit, setFormEdit] = useState({})

  useEffect(() => {
    setSemanaVista(semanaInicio)
    cargarDatos()
  }, [semanaInicio])

  const cargarDatos = async () => {
    const [gruposRes, areasRes] = await Promise.all([
      axios.get(`/api/playbook/semana/${format(semanaInicio, 'yyyy-MM-dd')}`),
      axios.get('/api/areas')
    ])
    setGrupos(gruposRes.data)
    setAreas(areasRes.data.filter(a => ['dormitorio', 'casa_evento', 'warehouse'].includes(a.tipo)))
  }

  const guardarGrupo = async () => {
    try {
      if (!form.areaId || !form.cantidad || !form.fechaLlegada || !form.fechaSalida)
        return toast.error('Completa todos los campos obligatorios')
      await axios.post('/api/playbook', {
        ...form,
        areaId: Number(form.areaId),
        cantidad: Number(form.cantidad),
        semanaInicio: format(semanaInicio, 'yyyy-MM-dd'),
        semanaFin: format(addDays(semanaInicio, 6), 'yyyy-MM-dd'),
        tipoSemana: 'sab_sab',
        fechaLlegada: form.fechaLlegada,
        fechaSalida: form.fechaSalida,
      })
      toast.success('Grupo guardado ✓')
      setMostrarForm(false)
      setForm({ areaId: '', cantidad: '', genero: 'Mixto', fechaLlegada: '', fechaSalida: '', notas: '' })
      cargarDatos()
    } catch { toast.error('Error guardando') }
  }

  const eliminarGrupo = async (id) => {
    if (!confirm('¿Eliminar este grupo?')) return
    await axios.delete(`/api/playbook/${id}`)
    setGrupos(prev => prev.filter(g => g.id !== id))
    toast.success('Eliminado')
  }

  const abrirEdicion = (g) => {
    setEditandoId(g.id)
    setFormEdit({
      areaId: g.areaId,
      cantidad: g.cantidad,
      genero: g.genero,
      fechaLlegada: format(new Date(g.fechaLlegada), 'yyyy-MM-dd'),
      fechaSalida: format(new Date(g.fechaSalida), 'yyyy-MM-dd'),
      notas: g.notas || '',
      semanaInicio: format(semanaInicio, 'yyyy-MM-dd'),
      semanaFin: format(addDays(semanaInicio, 6), 'yyyy-MM-dd'),
      tipoSemana: g.tipoSemana,
    })
  }

  const guardarEdicion = async () => {
    try {
      const { data } = await axios.patch(`/api/playbook/${editandoId}`, {
        ...formEdit,
        areaId: Number(formEdit.areaId),
        cantidad: Number(formEdit.cantidad),
      })
      setGrupos(prev => prev.map(g => g.id === editandoId ? data : g))
      setEditandoId(null)
      toast.success('Grupo actualizado ✓')
    } catch { toast.error('Error actualizando') }
  }

  return (
    <div className="space-y-5">
      {/* Header con navegación de semanas */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Playbook Semanal</h2>
          <p className="text-slate-500 text-sm">
            {format(semanaInicio, "d MMM", { locale: es })} — {format(addDays(semanaInicio, 6), "d MMM yyyy", { locale: es })}
            {esEstaSemana && <span className="ml-2 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Esta semana</span>}
          </p>
        </div>
        <button onClick={() => setMostrarForm(true)} className="btn-primary flex-shrink-0">+ Agregar grupo</button>
      </div>

      {/* Navegación de semanas */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSemanaInicio(prev => addDays(prev, -7))}
          className="flex-shrink-0 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100"
        >◀ Anterior</button>
        {!esEstaSemana && (
          <button
            onClick={() => setSemanaInicio(semanaActual)}
            className="flex-1 border border-violet-200 rounded-xl px-3 py-2 text-sm font-medium text-violet-600 bg-violet-50"
          >Semana actual</button>
        )}
        <button
          onClick={() => setSemanaInicio(prev => addDays(prev, 7))}
          className="flex-shrink-0 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100"
        >Siguiente ▶</button>
      </div>

      {/* Form */}
      {mostrarForm && (
        <div className="card border-2 border-violet-200 space-y-3">
          <h3 className="font-semibold text-violet-700">Nuevo grupo</h3>
          <select value={form.areaId} onChange={e => setForm(p => ({ ...p, areaId: e.target.value }))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
            <option value="">Seleccionar área</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Cantidad de personas" value={form.cantidad}
              onChange={e => setForm(p => ({ ...p, cantidad: e.target.value }))}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            <select value={form.genero} onChange={e => setForm(p => ({ ...p, genero: e.target.value }))}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
              <option value="H">Hombres</option>
              <option value="M">Mujeres</option>
              <option value="Mixto">Mixto</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500">Fecha llegada</label>
              <input type="date" value={form.fechaLlegada} onChange={e => setForm(p => ({ ...p, fechaLlegada: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Fecha salida</label>
              <input type="date" value={form.fechaSalida} onChange={e => setForm(p => ({ ...p, fechaSalida: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
          <input type="text" placeholder="Notas (opcional)" value={form.notas}
            onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={guardarGrupo} className="btn-primary flex-1">Guardar</button>
            <button onClick={() => setMostrarForm(false)} className="btn-secondary flex-1">Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista de grupos */}
      {grupos.length === 0 ? (
        <div className="card text-center py-10 text-slate-400">
          <p className="text-3xl mb-2">📅</p>
          <p>No hay grupos registrados esta semana</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map(g => (
            <div key={g.id} className="card">
              {editandoId === g.id ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-violet-700">Editar grupo</h3>
                  <select value={formEdit.areaId} onChange={e => setFormEdit(p => ({ ...p, areaId: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Personas" value={formEdit.cantidad}
                      onChange={e => setFormEdit(p => ({ ...p, cantidad: e.target.value }))}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                    <select value={formEdit.genero} onChange={e => setFormEdit(p => ({ ...p, genero: e.target.value }))}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
                      <option value="H">Hombres</option>
                      <option value="M">Mujeres</option>
                      <option value="Mixto">Mixto</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-500">Fecha llegada</label>
                      <input type="date" value={formEdit.fechaLlegada}
                        onChange={e => setFormEdit(p => ({ ...p, fechaLlegada: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Fecha salida</label>
                      <input type="date" value={formEdit.fechaSalida}
                        onChange={e => setFormEdit(p => ({ ...p, fechaSalida: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <input type="text" placeholder="Notas (opcional)" value={formEdit.notas}
                    onChange={e => setFormEdit(p => ({ ...p, notas: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <button onClick={guardarEdicion} className="btn-primary flex-1">Guardar</button>
                    <button onClick={() => setEditandoId(null)} className="btn-secondary flex-1">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                    g.genero === 'H' ? 'bg-blue-100' : g.genero === 'M' ? 'bg-pink-100' : 'bg-violet-100'
                  }`}>
                    {g.genero === 'H' ? '👨' : g.genero === 'M' ? '👩' : '👥'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{g.area.nombre}</p>
                    <p className="text-sm text-slate-500">
                      <span className="font-bold text-violet-700">{g.cantidad} personas</span>
                      {' — '}{g.genero === 'H' ? 'Hombres' : g.genero === 'M' ? 'Mujeres' : 'Mixto'}
                    </p>
                    <p className="text-xs text-violet-600 mt-0.5">
                      ✈️ {format(new Date(g.fechaLlegada), "d MMM", { locale: es })} → 🏠 {format(new Date(g.fechaSalida), "d MMM", { locale: es })}
                    </p>
                    {g.notas && <p className="text-xs text-slate-400 mt-0.5">📝 {g.notas}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => abrirEdicion(g)}
                      className="text-xs text-violet-600 border border-violet-200 px-2 py-1 rounded-lg hover:bg-violet-50">
                      ✏️
                    </button>
                    <button onClick={() => eliminarGrupo(g.id)}
                      className="text-xs text-red-400 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50">
                      🗑
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PlaybookPage

// Export for use in pages directory
