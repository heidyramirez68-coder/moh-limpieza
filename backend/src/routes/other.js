// ─── PLAYBOOK ────────────────────────────────────────────────────────────────
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authMiddleware, soloCoordinadora, coordinadoraOSupervisora } = require('../middleware/auth')
const { startOfDay, format, eachDayOfInterval } = require('date-fns')

const playbookRouter = express.Router()
const prisma = new PrismaClient()

playbookRouter.get('/semana/:inicio', authMiddleware, async (req, res) => {
  const inicio = new Date(req.params.inicio)
  const grupos = await prisma.playbookGrupo.findMany({
    where: { semanaInicio: { gte: inicio } },
    include: { area: true },
    orderBy: { fechaLlegada: 'asc' }
  })
  res.json(grupos)
})

// GET grupos activos hoy (para empleadas — saber cuántas personas tienen)
playbookRouter.get('/activos-hoy', authMiddleware, async (req, res) => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const grupos = await prisma.playbookGrupo.findMany({
    where: {
      fechaLlegada: { lte: new Date() },
      fechaSalida:  { gte: hoy }
    },
    include: { area: true },
    orderBy: { fechaLlegada: 'asc' }
  })
  res.json(grupos)
})

const parseFechas = (body) => {
  const { semanaInicio, semanaFin, fechaLlegada, fechaSalida, ...rest } = body
  return {
    ...rest,
    semanaInicio:  new Date(semanaInicio),
    semanaFin:     new Date(semanaFin),
    fechaLlegada:  new Date(fechaLlegada),
    fechaSalida:   new Date(fechaSalida),
    notas:         rest.notas || null,
  }
}

playbookRouter.post('/', authMiddleware, soloCoordinadora, async (req, res) => {
  try {
    const grupo = await prisma.playbookGrupo.create({ data: parseFechas(req.body), include: { area: true } })
    res.json(grupo)
  } catch (e) {
    console.error('Playbook error:', e.message)
    res.status(500).json({ error: 'Error guardando playbook' })
  }
})

playbookRouter.patch('/:id', authMiddleware, soloCoordinadora, async (req, res) => {
  try {
    const grupo = await prisma.playbookGrupo.update({ where: { id: Number(req.params.id) }, data: parseFechas(req.body), include: { area: true } })
    res.json(grupo)
  } catch (e) {
    console.error('Playbook patch error:', e.message)
    res.status(500).json({ error: 'Error actualizando' })
  }
})

playbookRouter.delete('/:id', authMiddleware, soloCoordinadora, async (req, res) => {
  await prisma.playbookGrupo.delete({ where: { id: Number(req.params.id) } })
  res.json({ ok: true })
})

// ─── REPORTES ────────────────────────────────────────────────────────────────
const reportesRouter = express.Router()

// Reporte diario
reportesRouter.get('/diario/:fecha', authMiddleware, soloCoordinadora, async (req, res) => {
  try {
    const [y, m, d] = req.params.fecha.split('-').map(Number)
    const fechaRango = {
      gte: new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)),
      lte: new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999))
    }
    const tareas = await prisma.tareaAsignada.findMany({
      where: { fecha: fechaRango },
      include: {
        area: true,
        usuario: { select: { id: true, nombre: true, color: true } },
        checklistCompletaciones: { include: { checklistItem: true } }
      },
      orderBy: [{ usuario: { nombre: 'asc' } }, { area: { orden: 'asc' } }]
    })

    const porUsuario = {}
    for (const t of tareas) {
      const uid = t.usuario.id
      if (!porUsuario[uid]) {
        porUsuario[uid] = { usuario: t.usuario, tareas: [], totalMinutos: 0, completadas: 0, pendientes: 0 }
      }
      porUsuario[uid].tareas.push(t)
      if (t.estado === 'completada') {
        porUsuario[uid].completadas++
        porUsuario[uid].totalMinutos += t.minutosTotal || 0
      } else {
        porUsuario[uid].pendientes++
      }
    }

    res.json({
      fecha: `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`,
      resumen: Object.values(porUsuario),
      totalTareas: tareas.length,
      completadas: tareas.filter(t => t.estado === 'completada').length,
      pendientes: tareas.filter(t => t.estado !== 'completada').length,
    })
  } catch (e) {
    res.status(500).json({ error: 'Error generando reporte' })
  }
})

// Reporte semanal
reportesRouter.get('/semanal/:inicio/:fin', authMiddleware, soloCoordinadora, async (req, res) => {
  try {
    const [yi, mi, di] = req.params.inicio.split('-').map(Number)
    const [yf, mf, df] = req.params.fin.split('-').map(Number)
    const inicio = new Date(Date.UTC(yi, mi - 1, di, 0, 0, 0, 0))
    const fin = new Date(Date.UTC(yf, mf - 1, df, 23, 59, 59, 999))

    const tareas = await prisma.tareaAsignada.findMany({
      where: { fecha: { gte: inicio, lte: fin } },
      include: {
        area: true,
        usuario: { select: { id: true, nombre: true, color: true } },
        checklistCompletaciones: true
      }
    })

    const usuarios = await prisma.usuario.findMany({
      where: { activo: true, rol: 'empleada' },
      select: { id: true, nombre: true, color: true }
    })

    const estadisticas = usuarios.map(u => {
      const tareasUsuario = tareas.filter(t => t.usuarioId === u.id)
      const completadas = tareasUsuario.filter(t => t.estado === 'completada')
      const minutos = completadas.reduce((acc, t) => acc + (t.minutosTotal || 0), 0)
      return {
        usuario: u,
        totalTareas: tareasUsuario.length,
        completadas: completadas.length,
        pendientes: tareasUsuario.filter(t => t.estado !== 'completada').length,
        minutosTotal: minutos,
        promedioMinPorTarea: completadas.length > 0 ? Math.round(minutos / completadas.length) : 0,
        eficiencia: tareasUsuario.length > 0 ? Math.round((completadas.length / tareasUsuario.length) * 100) : 0
      }
    })

    res.json({
      semana: `${format(inicio, 'dd/MM/yyyy')} — ${format(fin, 'dd/MM/yyyy')}`,
      estadisticas,
      totalTareas: tareas.length,
      completadas: tareas.filter(t => t.estado === 'completada').length,
    })
  } catch (e) {
    res.status(500).json({ error: 'Error generando reporte semanal' })
  }
})

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const configRouter = express.Router()

configRouter.get('/', authMiddleware, async (req, res) => {
  const configs = await prisma.configApp.findMany()
  const obj = {}
  configs.forEach(c => { obj[c.clave] = c.valor })
  res.json(obj)
})

configRouter.patch('/', authMiddleware, soloCoordinadora, async (req, res) => {
  const updates = req.body
  for (const [clave, valor] of Object.entries(updates)) {
    await prisma.configApp.upsert({ where: { clave }, update: { valor }, create: { clave, valor } })
  }
  res.json({ ok: true })
})

// ─── ALERTAS ─────────────────────────────────────────────────────────────────
const alertasRouter = express.Router()

alertasRouter.get('/', authMiddleware, coordinadoraOSupervisora, async (req, res) => {
  const alertas = await prisma.alertaSuministro.findMany({
    where: { resuelta: false },
    include: { area: true, reportador: { select: { nombre: true, color: true } } },
    orderBy: { creadoEn: 'desc' }
  })
  res.json(alertas)
})

alertasRouter.post('/', authMiddleware, async (req, res) => {
  try {
    const { areaId, descripcion } = req.body
    const alerta = await prisma.alertaSuministro.create({
      data: { areaId, descripcion, reportadoPor: req.usuario.id },
      include: { area: true, reportador: { select: { nombre: true, color: true } } }
    })

    const io = req.app.get('io')
    io.to('coordinadora').emit('nueva_alerta', {
      alerta,
      mensaje: `⚠️ ${req.usuario.nombre}: Falta suministro en ${alerta.area.nombre} — ${descripcion}`
    })
    io.to('supervisora').emit('nueva_alerta', alerta)

    res.json(alerta)
  } catch (e) {
    res.status(500).json({ error: 'Error creando alerta' })
  }
})

alertasRouter.patch('/:id/resolver', authMiddleware, coordinadoraOSupervisora, async (req, res) => {
  const alerta = await prisma.alertaSuministro.update({
    where: { id: Number(req.params.id) },
    data: { resuelta: true, resueltaEn: new Date() }
  })
  res.json(alerta)
})

module.exports = { playbookRouter, reportesRouter, configRouter, alertasRouter }
