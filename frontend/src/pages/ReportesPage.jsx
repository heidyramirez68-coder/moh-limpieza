import React, { useState } from 'react'
import axios from 'axios'
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReportesPage() {
  const [tipo, setTipo] = useState('semanal')
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [reporte, setReporte] = useState(null)
  const [cargando, setCargando] = useState(false)

  const semanaInicio = startOfWeek(new Date(fecha + 'T12:00:00'), { weekStartsOn: 1 })
  const semanaFin = endOfWeek(new Date(fecha + 'T12:00:00'), { weekStartsOn: 1 })

  const generarReporte = async () => {
    setCargando(true)
    try {
      let res
      if (tipo === 'diario') {
        res = await axios.get(`/api/reportes/diario/${fecha}`)
      } else {
        res = await axios.get(`/api/reportes/semanal/${format(semanaInicio, 'yyyy-MM-dd')}/${format(semanaFin, 'yyyy-MM-dd')}`)
      }
      setReporte(res.data)
    } catch { toast.error('Error generando reporte') }
    finally { setCargando(false) }
  }

  const descargarPDF = () => {
    if (!reporte) return
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(124, 58, 237)
    doc.text('Mission of Hope', 20, 20)
    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text(`Reporte ${tipo === 'diario' ? 'Diario' : 'Semanal'} — Equipo de Limpieza`, 20, 30)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(tipo === 'diario' ? `Fecha: ${reporte.fecha}` : `Semana: ${reporte.semana}`, 20, 40)
    doc.text(`Todo lo que hagáis, hacedlo de corazón, como para el Señor — Col. 3:23`, 20, 50)

    // Stats
    doc.setTextColor(0)
    doc.setFontSize(12)
    doc.text(`Total tareas: ${reporte.totalTareas}  |  Completadas: ${reporte.completadas}  |  Pendientes: ${reporte.totalTareas - reporte.completadas}`, 20, 65)

    if (tipo === 'diario' && reporte.resumen) {
      // Por empleada
      let y = 80
      for (const r of reporte.resumen) {
        doc.setFontSize(12)
        doc.setFont(undefined, 'bold')
        doc.text(`${r.usuario.nombre}`, 20, y)
        doc.setFont(undefined, 'normal')
        doc.setFontSize(10)
        doc.text(`Completadas: ${r.completadas}  Pendientes: ${r.pendientes}  Tiempo total: ${r.totalMinutos} min`, 20, y + 7)
        y += 20

        const rows = r.tareas.map(t => [
          t.area.nombre,
          t.estado === 'completada' ? '✓ Completada' : t.estado === 'en_progreso' ? '→ En progreso' : '○ Pendiente',
          t.horaInicio ? format(new Date(t.horaInicio), 'HH:mm') : '-',
          t.horaFin ? format(new Date(t.horaFin), 'HH:mm') : '-',
          t.minutosTotal ? `${t.minutosTotal} min` : '-'
        ])

        autoTable(doc, {
          startY: y,
          head: [['Área', 'Estado', 'Inicio', 'Fin', 'Tiempo']],
          body: rows,
          margin: { left: 20 },
          styles: { fontSize: 9 },
          headStyles: { fillColor: [124, 58, 237] }
        })
        y = doc.lastAutoTable.finalY + 15
        if (y > 250) { doc.addPage(); y = 20 }
      }
    } else if (tipo === 'semanal' && reporte.estadisticas) {
      // Resumen por empleada
      const rows = reporte.estadisticas.filter(e => e.totalTareas > 0).map(e => [
        e.usuario.nombre,
        e.totalTareas,
        e.completadas,
        e.pendientes,
        e.promedioMinPorTarea > 0 ? `${e.promedioMinPorTarea} min` : '—',
        `${e.eficiencia}%`
      ])
      autoTable(doc, {
        startY: 80,
        head: [['Empleada', 'Total', 'Completadas', 'Pendientes', 'Prom/tarea', 'Eficiencia']],
        body: rows,
        margin: { left: 20 },
        headStyles: { fillColor: [124, 58, 237] }
      })

      // Ranking de velocidad
      if (reporte.ranking?.length > 0) {
        let y = doc.lastAutoTable.finalY + 12
        doc.setFontSize(13); doc.setFont(undefined, 'bold')
        doc.text('⚡ Ranking de Velocidad', 20, y)
        doc.setFont(undefined, 'normal')
        const medals = ['🥇', '🥈', '🥉']
        const rankRows = reporte.ranking.map((e, i) => [
          `${medals[i] || (i+1)+'.'} ${e.usuario.nombre}`,
          `${e.promedioMinPorTarea} min/tarea`,
          `${e.completadas} tareas`,
          `${e.minutosTotal} min total`
        ])
        autoTable(doc, {
          startY: y + 5,
          head: [['Empleada', 'Promedio', 'Tareas', 'Tiempo total']],
          body: rankRows,
          margin: { left: 20 },
          headStyles: { fillColor: [5, 150, 105] }
        })
      }

      // Tareas pendientes
      if (reporte.pendientesList?.length > 0) {
        let y2 = doc.lastAutoTable.finalY + 12
        if (y2 > 250) { doc.addPage(); y2 = 20 }
        doc.setFontSize(13); doc.setFont(undefined, 'bold')
        doc.text('⚠️ Tareas Pendientes', 20, y2)
        doc.setFont(undefined, 'normal')
        const pendRows = reporte.pendientesList.map(p => [p.fecha, p.area, p.usuario.nombre, p.estado === 'en_progreso' ? 'En progreso' : 'Pendiente'])
        autoTable(doc, {
          startY: y2 + 5,
          head: [['Día', 'Área', 'Empleada', 'Estado']],
          body: pendRows,
          margin: { left: 20 },
          headStyles: { fillColor: [217, 119, 6] }
        })
      }
    }

    doc.save(`MOH_Reporte_${tipo}_${fecha}.pdf`)
    toast.success('PDF descargado ✓')
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-800">Reportes</h2>

      <div className="card space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setTipo('diario')} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tipo === 'diario' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            📅 Diario
          </button>
          <button onClick={() => setTipo('semanal')} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tipo === 'semanal' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            📊 Semanal
          </button>
        </div>

        <div>
          <label className="text-sm text-slate-600 block mb-1">{tipo === 'diario' ? 'Fecha' : 'Cualquier día de la semana'}</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          {tipo === 'semanal' && (
            <p className="text-xs text-slate-400 mt-1">
              Semana: {format(semanaInicio, "d MMM", { locale: es })} — {format(semanaFin, "d MMM yyyy", { locale: es })}
            </p>
          )}
        </div>

        <button onClick={generarReporte} disabled={cargando} className="w-full btn-primary">
          {cargando ? 'Generando...' : '📈 Generar reporte'}
        </button>
      </div>

      {reporte && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center">
              <p className="text-2xl font-bold text-violet-600">{reporte.totalTareas}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-green-600">{reporte.completadas}</p>
              <p className="text-xs text-slate-500">Completadas</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-amber-500">{reporte.totalTareas - reporte.completadas}</p>
              <p className="text-xs text-slate-500">Pendientes</p>
            </div>
          </div>

          {/* SEMANAL — Ranking de velocidad */}
          {tipo === 'semanal' && reporte.ranking?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3">⚡ Ranking de velocidad</h3>
              <div className="space-y-2">
                {reporte.ranking.map((e, i) => {
                  const medals = ['🥇', '🥈', '🥉']
                  const max = reporte.ranking[reporte.ranking.length - 1].promedioMinPorTarea
                  return (
                    <div key={e.usuario.id} className="flex items-center gap-3">
                      <span className="text-lg w-7 text-center">{medals[i] || `${i+1}.`}</span>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: e.usuario.color }}>
                        {e.usuario.nombre.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-sm font-medium text-slate-700">{e.usuario.nombre.split(' ')[0]}</span>
                          <span className="text-xs font-bold text-violet-700">{e.promedioMinPorTarea} min/tarea</span>
                        </div>
                        <div className="bg-slate-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: `${Math.round((e.promedioMinPorTarea/max)*100)}%`, backgroundColor: e.usuario.color }} />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{e.completadas} tareas · {e.minutosTotal} min total</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SEMANAL — Por empleada */}
          {tipo === 'semanal' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">👩 Por empleada</h3>
              {reporte.estadisticas?.filter(e => e.totalTareas > 0).map(e => (
                <div key={e.usuario.id} className="card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: e.usuario.color }}>
                      {e.usuario.nombre.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{e.usuario.nombre}</p>
                      <p className="text-xs text-slate-500">Eficiencia: <span className="font-bold text-violet-600">{e.eficiencia}%</span></p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-green-50 rounded-lg p-2"><p className="font-bold text-green-600">{e.completadas}</p><p className="text-slate-500">Completadas</p></div>
                    <div className="bg-amber-50 rounded-lg p-2"><p className="font-bold text-amber-600">{e.pendientes}</p><p className="text-slate-500">Pendientes</p></div>
                    <div className="bg-violet-50 rounded-lg p-2"><p className="font-bold text-violet-600">{e.promedioMinPorTarea > 0 ? `${e.promedioMinPorTarea}min` : '—'}</p><p className="text-slate-500">Prom/tarea</p></div>
                  </div>
                  {/* Tareas de esta empleada */}
                  {reporte.detalle?.filter(t => t.usuario.id === e.usuario.id).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {reporte.detalle.filter(t => t.usuario.id === e.usuario.id).map(t => (
                        <div key={t.id} className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{t.estado === 'completada' ? '✅' : t.estado === 'en_progreso' ? '🔄' : '⏳'}</span>
                          <span className="text-slate-400 w-12 flex-shrink-0">{t.fecha}</span>
                          <span className="flex-1 truncate">{t.area}</span>
                          {t.minutosTotal && <span className="text-slate-400">{t.minutosTotal}min</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* SEMANAL — Pendientes */}
          {tipo === 'semanal' && reporte.pendientesList?.length > 0 && (
            <div className="card border-2 border-amber-200 bg-amber-50">
              <h3 className="font-semibold text-amber-800 mb-2">⚠️ Tareas pendientes ({reporte.pendientesList.length})</h3>
              <div className="space-y-1.5">
                {reporte.pendientesList.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-white rounded-lg px-3 py-2">
                    <span>{p.estado === 'en_progreso' ? '🔄' : '⏳'}</span>
                    <span className="text-slate-400 text-xs w-12 flex-shrink-0">{p.fecha}</span>
                    <span className="flex-1 text-slate-700 truncate">{p.area}</span>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: p.usuario.color }}>
                      {p.usuario.nombre.charAt(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Por empleada (diario) */}
          {tipo === 'diario' && reporte.resumen?.map(r => (
            <div key={r.usuario.id} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: r.usuario.color }}>
                  {r.usuario.nombre.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{r.usuario.nombre}</p>
                  <p className="text-xs text-slate-500">{r.completadas} completadas · {r.totalMinutos} min total</p>
                </div>
              </div>
              <div className="space-y-1">
                {r.tareas.map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-xs text-slate-600">
                    <span>{t.estado === 'completada' ? '✅' : '⏳'}</span>
                    <span className="flex-1 truncate">{t.area.nombre}</span>
                    {t.minutosTotal && <span className="text-slate-400">{t.minutosTotal}min</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button onClick={descargarPDF} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-all">
            📥 Descargar PDF
          </button>
        </div>
      )}
    </div>
  )
}
