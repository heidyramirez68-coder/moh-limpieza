import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ─── CONFIG PAGE ─────────────────────────────────────────────────────────────
export function ConfigPage() {
  const [usuarios, setUsuarios] = useState([])
  const [areas, setAreas] = useState([])
  const [tabActiva, setTabActiva] = useState('usuarios')
  const [formUsuario, setFormUsuario] = useState({ nombre: '', rol: 'empleada', color: '#7C3AED', rolEspecial: '' })
  const [mostrarFormUsuario, setMostrarFormUsuario] = useState(false)
  const [editandoArea, setEditandoArea] = useState(null)
  const [editandoUsuario, setEditandoUsuario] = useState(null)
  const [formEditUsuario, setFormEditUsuario] = useState({})
  const [areaChecklist, setAreaChecklist] = useState(null)
  const [checklistItems, setChecklistItems] = useState([])
  const [nuevoItem, setNuevoItem] = useState('')
  const [editandoItem, setEditandoItem] = useState(null)
  const [textoEditItem, setTextoEditItem] = useState('')

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    const [u, a] = await Promise.all([axios.get('/api/usuarios'), axios.get('/api/areas')])
    setUsuarios(u.data)
    setAreas(a.data)
  }

  const guardarUsuario = async () => {
    try {
      await axios.post('/api/usuarios', formUsuario)
      toast.success('Empleada agregada ✓')
      setMostrarFormUsuario(false)
      setFormUsuario({ nombre: '', rol: 'empleada', color: '#7C3AED', rolEspecial: '' })
      cargarDatos()
    } catch { toast.error('Error') }
  }

  const resetPassword = async (id, nombre) => {
    if (!confirm(`¿Resetear contraseña de ${nombre} a MOH2024?`)) return
    await axios.post(`/api/usuarios/${id}/reset-password`)
    toast.success('Contraseña reseteada a MOH2024 ✓')
  }

  const editarUsuario = (u) => {
    setEditandoUsuario(u.id)
    setFormEditUsuario({ nombre: u.nombre, color: u.color, rol: u.rol, rolEspecial: u.rolEspecial || '' })
  }

  const guardarUsuarioEdit = async (id) => {
    try {
      await axios.patch(`/api/usuarios/${id}`, formEditUsuario)
      toast.success('Usuario actualizado ✓')
      setEditandoUsuario(null)
      cargarDatos()
    } catch { toast.error('Error actualizando') }
  }

  const abrirChecklist = async (area) => {
    setAreaChecklist(area)
    const { data } = await axios.get(`/api/areas/${area.id}`)
    setChecklistItems(data.checklistItems || [])
  }

  const agregarItem = async () => {
    if (!nuevoItem.trim()) return
    try {
      const { data } = await axios.post(`/api/areas/${areaChecklist.id}/checklist`, {
        descripcion: nuevoItem.trim(), orden: checklistItems.length + 1
      })
      setChecklistItems(prev => [...prev, data])
      setNuevoItem('')
      toast.success('Ítem agregado ✓')
    } catch { toast.error('Error') }
  }

  const guardarItem = async (itemId) => {
    try {
      await axios.patch(`/api/areas/checklist/${itemId}`, { descripcion: textoEditItem })
      setChecklistItems(prev => prev.map(i => i.id === itemId ? { ...i, descripcion: textoEditItem } : i))
      setEditandoItem(null)
      toast.success('Actualizado ✓')
    } catch { toast.error('Error') }
  }

  const eliminarItem = async (itemId) => {
    try {
      await axios.delete(`/api/areas/checklist/${itemId}`)
      setChecklistItems(prev => prev.filter(i => i.id !== itemId))
      toast.success('Ítem eliminado')
    } catch { toast.error('Error') }
  }

  const [mostrarFormArea, setMostrarFormArea] = useState(false)
  const [formArea, setFormArea] = useState({ nombre: '', tipo: 'dormitorio', horaFija: '', notas: '', activaPorEvento: false })

  const guardarArea = async (id, datos) => {
    await axios.patch(`/api/areas/${id}`, datos)
    toast.success('Área actualizada ✓')
    setEditandoArea(null)
    cargarDatos()
  }

  const crearArea = async () => {
    if (!formArea.nombre.trim()) return toast.error('Escribe un nombre')
    try {
      await axios.post('/api/areas', formArea)
      toast.success('Área creada ✓')
      setMostrarFormArea(false)
      setFormArea({ nombre: '', tipo: 'dormitorio', horaFija: '', notas: '', activaPorEvento: false })
      cargarDatos()
    } catch { toast.error('Error creando área') }
  }

  const eliminarArea = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"? Se borrarán también sus tareas y checklist.`)) return
    try {
      await axios.delete(`/api/areas/${id}`)
      toast.success('Área eliminada')
      cargarDatos()
    } catch { toast.error('Error eliminando') }
  }

  const toggleAreaEvento = async (area) => {
    await axios.patch(`/api/areas/${area.id}/activar-evento`, { activa: !area.activa })
    cargarDatos()
  }

  const TABS = [
    { id: 'usuarios', label: '👥 Empleadas' },
    { id: 'areas', label: '🏠 Áreas' },
    { id: 'checklists', label: '✅ Checklists' },
  ]

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-800">Configuración</h2>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTabActiva(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${tabActiva === t.id ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Usuarios */}
      {tabActiva === 'usuarios' && (
        <div className="space-y-3">
          {usuarios.map(u => (
            <div key={u.id} className="card">
              {editandoUsuario === u.id ? (
                <div className="space-y-2">
                  <input
                    value={formEditUsuario.nombre}
                    onChange={e => setFormEditUsuario(p => ({ ...p, nombre: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium"
                    placeholder="Nombre"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={formEditUsuario.rol} onChange={e => setFormEditUsuario(p => ({ ...p, rol: e.target.value }))}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
                      <option value="empleada">Empleada</option>
                      <option value="supervisora">Supervisora</option>
                      <option value="coordinadora">Coordinadora</option>
                    </select>
                    <select value={formEditUsuario.rolEspecial} onChange={e => setFormEditUsuario(p => ({ ...p, rolEspecial: e.target.value }))}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
                      <option value="">Sin rol especial</option>
                      <option value="lavanderia">Lavandería</option>
                      <option value="casas_staff">Casas Staff</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">Color:</label>
                    <input type="color" value={formEditUsuario.color}
                      onChange={e => setFormEditUsuario(p => ({ ...p, color: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: formEditUsuario.color }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => guardarUsuarioEdit(u.id)} className="btn-primary flex-1 text-sm py-1.5">Guardar</button>
                    <button onClick={() => setEditandoUsuario(null)} className="btn-secondary flex-1 text-sm py-1.5">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: u.color }}>
                    {u.nombre.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{u.nombre}</p>
                    <p className="text-xs text-slate-400 capitalize">{u.rol}{u.rolEspecial ? ` — ${u.rolEspecial}` : ''}</p>
                  </div>
                  <button onClick={() => editarUsuario(u)} className="text-xs text-violet-600 border border-violet-200 px-2 py-1 rounded-lg hover:bg-violet-50">
                    Editar
                  </button>
                  <button onClick={() => resetPassword(u.id, u.nombre)} className="text-xs text-amber-600 border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-50">
                    Reset pwd
                  </button>
                </div>
              )}
            </div>
          ))}
          {!mostrarFormUsuario ? (
            <button onClick={() => setMostrarFormUsuario(true)} className="w-full btn-secondary border-dashed">+ Agregar empleada</button>
          ) : (
            <div className="card border-2 border-violet-200 space-y-3">
              <h3 className="font-semibold text-violet-700">Nueva empleada</h3>
              <input placeholder="Nombre" value={formUsuario.nombre} onChange={e => setFormUsuario(p => ({ ...p, nombre: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={formUsuario.rol} onChange={e => setFormUsuario(p => ({ ...p, rol: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
                  <option value="empleada">Empleada</option>
                  <option value="supervisora">Supervisora</option>
                </select>
                <select value={formUsuario.rolEspecial} onChange={e => setFormUsuario(p => ({ ...p, rolEspecial: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
                  <option value="">Sin rol especial</option>
                  <option value="lavanderia">Lavandería</option>
                  <option value="casas_staff">Casas Staff</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Color:</label>
                <input type="color" value={formUsuario.color} onChange={e => setFormUsuario(p => ({ ...p, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
              </div>
              <div className="flex gap-2">
                <button onClick={guardarUsuario} className="btn-primary flex-1">Guardar</button>
                <button onClick={() => setMostrarFormUsuario(false)} className="btn-secondary flex-1">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Áreas */}
      {tabActiva === 'areas' && (
        <div className="space-y-2">
          {areas.map(a => (
            <div key={a.id} className="card">
              {editandoArea === a.id ? (
                <EditAreaForm area={a} onSave={(datos) => guardarArea(a.id, datos)} onCancel={() => setEditandoArea(null)} />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{a.nombre}</p>
                    <p className="text-xs text-slate-400 capitalize">{a.tipo}{a.activaPorEvento ? ' · Por evento' : ''}</p>
                    {a.horaFija && <p className="text-xs text-violet-600">🕐 {a.horaFija}</p>}
                    {a.notas && <p className="text-xs text-amber-600 truncate">📝 {a.notas}</p>}
                  </div>
                  {a.activaPorEvento && (
                    <button onClick={() => toggleAreaEvento(a)}
                      className={`text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0 ${a.activa ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {a.activa ? 'Activa' : 'Inactiva'}
                    </button>
                  )}
                  <button onClick={() => setEditandoArea(a.id)}
                    className="text-violet-600 text-xs border border-violet-200 px-2 py-1 rounded-lg hover:bg-violet-50 flex-shrink-0">
                    ✏️
                  </button>
                  <button onClick={() => eliminarArea(a.id, a.nombre)}
                    className="text-red-400 text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 flex-shrink-0">
                    🗑
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Formulario nueva área */}
          {!mostrarFormArea ? (
            <button onClick={() => setMostrarFormArea(true)} className="w-full btn-secondary border-dashed mt-2">
              + Agregar área
            </button>
          ) : (
            <div className="card border-2 border-violet-200 space-y-3 mt-2">
              <h3 className="font-semibold text-violet-700">Nueva área</h3>
              <input placeholder="Nombre del área" value={formArea.nombre}
                onChange={e => setFormArea(p => ({ ...p, nombre: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={formArea.tipo} onChange={e => setFormArea(p => ({ ...p, tipo: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
                  <option value="dormitorio">Dormitorio</option>
                  <option value="casa_staff_americano">Casa Staff Americano</option>
                  <option value="casa_evento">Casa Evento</option>
                  <option value="orange_house">Orange House</option>
                  <option value="oficina">Oficina</option>
                  <option value="bano">Baño</option>
                  <option value="lavanderia">Lavandería</option>
                  <option value="comun">Área Común</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="casa_internos">Casa de Internos</option>
                </select>
                <input placeholder="Hora fija (ej: 09:00)" value={formArea.horaFija}
                  onChange={e => setFormArea(p => ({ ...p, horaFija: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </div>
              <input placeholder="Notas (opcional)" value={formArea.notas}
                onChange={e => setFormArea(p => ({ ...p, notas: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={formArea.activaPorEvento}
                  onChange={e => setFormArea(p => ({ ...p, activaPorEvento: e.target.checked }))}
                  className="w-4 h-4 rounded" />
                Solo activa por evento (Vision House, Staff House, etc.)
              </label>
              <div className="flex gap-2">
                <button onClick={crearArea} className="btn-primary flex-1">Guardar</button>
                <button onClick={() => setMostrarFormArea(false)} className="btn-secondary flex-1">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checklists */}
      {tabActiva === 'checklists' && (
        <div className="space-y-3">
          {!areaChecklist ? (
            <>
              <p className="text-sm text-slate-500">Selecciona un área para ver y editar su checklist:</p>
              <div className="space-y-2">
                {areas.map(a => (
                  <button key={a.id} onClick={() => abrirChecklist(a)}
                    className="w-full text-left p-3 bg-white hover:bg-violet-50 rounded-xl text-sm text-slate-700 border border-slate-200 flex items-center justify-between transition-all">
                    <div>
                      <p className="font-medium">{a.nombre}</p>
                      <p className="text-xs text-slate-400 capitalize">{a.tipo}</p>
                    </div>
                    <span className="text-xs text-violet-500 font-medium">
                      {a.checklistItems?.length || 0} ítems →
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-3">
                <button onClick={() => setAreaChecklist(null)} className="text-slate-400 hover:text-slate-600 text-lg">←</button>
                <div>
                  <h3 className="font-bold text-slate-800">{areaChecklist.nombre}</h3>
                  <p className="text-xs text-slate-400">{checklistItems.length} ítems en el checklist</p>
                </div>
              </div>

              {/* Lista de ítems */}
              <div className="space-y-2">
                {checklistItems.map((item, idx) => (
                  <div key={item.id} className="card flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-5 text-center font-medium">{idx + 1}</span>
                    {editandoItem === item.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          value={textoEditItem}
                          onChange={e => setTextoEditItem(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && guardarItem(item.id)}
                          className="flex-1 border border-violet-300 rounded-lg px-2 py-1 text-sm"
                          autoFocus
                        />
                        <button onClick={() => guardarItem(item.id)} className="text-xs bg-violet-600 text-white px-2 py-1 rounded-lg">✓</button>
                        <button onClick={() => setEditandoItem(null)} className="text-xs text-slate-400 px-1">✕</button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-slate-700">☐ {item.descripcion}</span>
                        <button onClick={() => { setEditandoItem(item.id); setTextoEditItem(item.descripcion) }}
                          className="text-xs text-violet-500 hover:text-violet-700 px-1">✏️</button>
                        <button onClick={() => eliminarItem(item.id)}
                          className="text-xs text-red-400 hover:text-red-600 px-1">🗑</button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Agregar nuevo ítem */}
              <div className="flex gap-2">
                <input
                  value={nuevoItem}
                  onChange={e => setNuevoItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && agregarItem()}
                  placeholder="+ Agregar ítem al checklist..."
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                />
                <button onClick={agregarItem} className="btn-primary px-4 text-sm">Agregar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EditAreaForm({ area, onSave, onCancel }) {
  const [form, setForm] = useState({
    nombre: area.nombre,
    tipo: area.tipo,
    horaFija: area.horaFija || '',
    notas: area.notas || '',
    activaPorEvento: area.activaPorEvento || false,
  })
  return (
    <div className="space-y-2">
      <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
        placeholder="Nombre" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium" />
      <div className="grid grid-cols-2 gap-2">
        <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
          <option value="dormitorio">Dormitorio</option>
          <option value="casa_staff_americano">Casa Staff Americano</option>
          <option value="casa_evento">Casa Evento</option>
          <option value="orange_house">Orange House</option>
          <option value="oficina">Oficina</option>
          <option value="bano">Baño</option>
          <option value="lavanderia">Lavandería</option>
          <option value="comun">Área Común</option>
          <option value="warehouse">Warehouse</option>
          <option value="casa_internos">Casa de Internos</option>
        </select>
        <input placeholder="Hora fija (ej: 09:00)" value={form.horaFija}
          onChange={e => setForm(p => ({ ...p, horaFija: e.target.value }))}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm" />
      </div>
      <input placeholder="Notas" value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
        <input type="checkbox" checked={form.activaPorEvento}
          onChange={e => setForm(p => ({ ...p, activaPorEvento: e.target.checked }))}
          className="w-4 h-4 rounded" />
        Solo activa por evento
      </label>
      <div className="flex gap-2">
        <button onClick={() => onSave(form)} className="btn-primary flex-1 text-sm py-1.5">Guardar</button>
        <button onClick={onCancel} className="btn-secondary flex-1 text-sm py-1.5">Cancelar</button>
      </div>
    </div>
  )
}

export default ConfigPage

// ─── CAMBIAR PASSWORD ────────────────────────────────────────────────────────
export function CambiarPassword() {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [cargando, setCargando] = useState(false)
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (nueva !== confirmar) return toast.error('Las contraseñas no coinciden')
    if (nueva.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres')
    setCargando(true)
    try {
      await axios.post('/api/auth/cambiar-password', { passwordActual: actual, passwordNueva: nueva })
      toast.success('¡Contraseña actualizada! 🙏')
      if (usuario.rol === 'empleada') navigate('/mis-tareas')
      else navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error')
    } finally { setCargando(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-4xl">🔐</span>
          <h2 className="text-xl font-bold text-slate-800 mt-2">Cambiar contraseña</h2>
          {usuario?.primerLogin && (
            <p className="text-sm text-amber-600 mt-1 bg-amber-50 rounded-xl p-2">
              Por favor crea tu contraseña personal para continuar
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" placeholder="Contraseña actual" value={actual} onChange={e => setActual(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
          <input type="password" placeholder="Nueva contraseña" value={nueva} onChange={e => setNueva(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
          <input type="password" placeholder="Confirmar nueva contraseña" value={confirmar} onChange={e => setConfirmar(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
          <button type="submit" disabled={cargando} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-all">
            {cargando ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
