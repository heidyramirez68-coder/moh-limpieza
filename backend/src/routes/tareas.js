const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authMiddleware, soloCoordinadora, coordinadoraOSupervisora } = require('../middleware/auth')
const { addDays, format, startOfDay } = require('date-fns')

const router = express.Router()
const prisma = new PrismaClient()

// GET tareas del día para el usuario actual (o todas si es coordinadora/supervisora)
router.get('/dia/:fecha', authMiddleware, async (req, res) => {
  try {
    const fecha = new Date(req.params.fecha)
    const where = { fecha: startOfDay(fecha) }

    // Empleadas solo ven sus tareas
    if (req.usuario.rol === 'empleada') {
      where.usuarioId = req.usuario.id
    }

    const tareas = await prisma.tareaAsignada.findMany({
      where,
      include: {
        area: { include: { checklistItems: { where: { activo: true }, orderBy: { orden: 'asc' } } } },
        usuario: { select: { id: true, nombre: true, color: true } },
        checklistCompletaciones: true,
      },
      orderBy: [{ area: { orden: 'asc' } }]
    })

    res.json(tareas)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

// GET resumen del día (solo coordinadora/supervisora)
router.get('/resumen/:fecha', authMiddleware, coordinadoraOSupervisora, async (req, res) => {
  try {
    const fecha = new Date(req.params.fecha)
    const tareas = await prisma.tareaAsignada.findMany({
      where: { fecha: startOfDay(fecha) },
      include: {
        area: true,
        usuario: { select: { id: true, nombre: true, color: true } },
        checklistCompletaciones: true,
      }
    })

    const resumen = tareas.map(t => ({
      ...t,
      progreso: t.area.checklistItems
        ? Math.round((t.checklistCompletaciones.length / Math.max(1, t.area.checklistItems?.length || 1)) * 100)
        : 0
    }))

    res.json(resumen)
  } catch (e) {
    res.status(500).json({ error: 'Error del servidor' })
  }
})

// POST crear tarea (solo coordinadora)
router.post('/', authMiddleware, soloCoordinadora, async (req, res) => {
  try {
    const { fecha, areaId, usuarioId } = req.body
    const tarea = await prisma.tareaAsignada.create({
      data: { fecha: new Date(fecha), areaId, usuarioId },
      include: { area: true, usuario: { select: { id: true, nombre: true, color: true } } }
    })

    // Notificar en tiempo real
    const io = req.app.get('io')
    io.to(`usuario_${usuarioId}`).emit('nueva_tarea', tarea)
    io.to('coordinadora').emit('tarea_creada', tarea)

    res.json(tarea)
  } catch (e) {
    res.status(500).json({ error: 'Error del servidor' })
  }
})

// POST asignación masiva semanal (solo coordinadora)
router.post('/asignar-semana', authMiddleware, soloCoordinadora, async (req, res) => {
  try {
    const { asignaciones } = req.body
    // asignaciones: [{ fecha, areaId, usuarioIds: [id1, id2] }]
    const creadas = []
    for (const a of asignaciones) {
      for (const uid of a.usuarioIds) {
        const tarea = await prisma.tareaAsignada.create({
          data: { fecha: new Date(a.fecha), areaId: a.areaId, usuarioId: uid },
          include: { area: true, usuario: { select: { id: true, nombre: true, color: true } } }
        })
        creadas.push(tarea)
        const io = req.app.get('io')
        io.to(`usuario_${uid}`).emit('nueva_tarea', tarea)
      }
    }
    res.json({ ok: true, creadas: creadas.length })
  } catch (e) {
    res.status(500).json({ error: 'Error del servidor' })
  }
})

// PATCH iniciar tarea
router.patch('/:id/iniciar', authMiddleware, async (req, res) => {
  try {
    const tarea = await prisma.tareaAsignada.findUnique({ where: { id: Number(req.params.id) } })
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' })
    if (req.usuario.rol === 'empleada' && tarea.usuarioId !== req.usuario.id) {
      return res.status(403).json({ error: 'No puedes modificar tareas de otras' })
    }

    const actualizada = await prisma.tareaAsignada.update({
      where: { id: Number(req.params.id) },
      data: { estado: 'en_progreso', horaInicio: new Date() },
      include: { area: true, usuario: { select: { id: true, nombre: true, color: true } } }
    })

    const io = req.app.get('io')
    io.to('coordinadora').emit('tarea_actualizada', actualizada)
    io.to('supervisora').emit('tarea_actualizada', actualizada)

    res.json(actualizada)
  } catch (e) {
    res.status(500).json({ error: 'Error del servidor' })
  }
})

// PATCH marcar ítem de checklist
router.patch('/:id/checklist/:itemId', authMiddleware, async (req, res) => {
  try {
    const tareaId = Number(req.params.id)
    const checklistItemId = Number(req.params.itemId)
    const { completado } = req.body

    const tarea = await prisma.tareaAsignada.findUnique({
      where: { id: tareaId },
      include: { area: { include: { checklistItems: { where: { activo: true } } } }, checklistCompletaciones: true }
    })

    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' })
    if (req.usuario.rol === 'empleada' && tarea.usuarioId !== req.usuario.id) {
      return res.status(403).json({ error: 'No puedes modificar tareas de otras' })
    }

    if (completado) {
      await prisma.checklistCompletacion.upsert({
        where: { tareaId_checklistItemId: { tareaId, checklistItemId } },
        update: { completadoEn: new Date(), completadoPor: req.usuario.id },
        create: { tareaId, checklistItemId, completadoPor: req.usuario.id }
      })
    } else {
      await prisma.checklistCompletacion.deleteMany({ where: { tareaId, checklistItemId } })
    }

    // Actualizar estado de la tarea
    const completaciones = await prisma.checklistCompletacion.count({ where: { tareaId } })
    const totalItems = tarea.area.checklistItems.length

    let estado = 'en_progreso'
    let horaFin = null
    let minutosTotal = null

    if (completaciones === 0) estado = 'pendiente'
    else if (completaciones >= totalItems) {
      estado = 'completada'
      horaFin = new Date()
      if (tarea.horaInicio) {
        minutosTotal = Math.round((horaFin - new Date(tarea.horaInicio)) / 60000)
      }
    }

    const tareaActualizada = await prisma.tareaAsignada.update({
      where: { id: tareaId },
      data: { estado, horaFin, minutosTotal },
      include: {
        area: { include: { checklistItems: { where: { activo: true } } } },
        usuario: { select: { id: true, nombre: true, color: true } },
        checklistCompletaciones: true
      }
    })

    const io = req.app.get('io')

    // Si se completó, notificar a coordinadora
    if (estado === 'completada') {
      io.to('coordinadora').emit('area_completada', {
        tarea: tareaActualizada,
        mensaje: `✅ ${tareaActualizada.usuario.nombre} completó: ${tareaActualizada.area.nombre}`
      })
      io.to('supervisora').emit('area_completada', tareaActualizada)

      // Verificar badges
      await verificarBadges(req.usuario.id, tareaActualizada.fecha, io)
    } else {
      io.to('coordinadora').emit('tarea_actualizada', tareaActualizada)
      io.to('supervisora').emit('tarea_actualizada', tareaActualizada)
    }

    res.json(tareaActualizada)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

// DELETE tarea (solo coordinadora)
router.delete('/:id', authMiddleware, soloCoordinadora, async (req, res) => {
  try {
    await prisma.checklistCompletacion.deleteMany({ where: { tareaId: Number(req.params.id) } })
    await prisma.tareaAsignada.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Error del servidor' })
  }
})

// POST pasar pendientes al día siguiente (cron/manual)
router.post('/pasar-pendientes', authMiddleware, soloCoordinadora, async (req, res) => {
  try {
    const { fecha } = req.body
    const fechaHoy = new Date(fecha)
    const fechaMañana = addDays(fechaHoy, 1)

    const pendientes = await prisma.tareaAsignada.findMany({
      where: { fecha: startOfDay(fechaHoy), estado: { in: ['pendiente', 'en_progreso'] } }
    })

    let pasadas = 0
    for (const t of pendientes) {
      await prisma.tareaAsignada.create({
        data: {
          fecha: startOfDay(fechaMañana),
          areaId: t.areaId,
          usuarioId: t.usuarioId,
          pasadoDeAyer: true,
          fechaOriginal: t.fecha,
          notas: `Pendiente del ${format(t.fecha, 'dd/MM/yyyy')}`
        }
      })
      pasadas++
    }

    res.json({ ok: true, pasadas })
  } catch (e) {
    res.status(500).json({ error: 'Error del servidor' })
  }
})

// Función para verificar y otorgar badges
async function verificarBadges(usuarioId, fecha, io) {
  try {
    const fechaDia = startOfDay(new Date(fecha))
    const tareasDia = await prisma.tareaAsignada.findMany({
      where: { usuarioId, fecha: fechaDia }
    })

    const todasCompletadas = tareasDia.length > 0 && tareasDia.every(t => t.estado === 'completada')

    if (todasCompletadas) {
      const yaExiste = await prisma.badge.findFirst({
        where: { usuarioId, tipo: 'dia_perfecto', fecha: fechaDia }
      })
      if (!yaExiste) {
        const badge = await prisma.badge.create({
          data: { usuarioId, tipo: 'dia_perfecto', fecha: fechaDia }
        })
        io.to(`usuario_${usuarioId}`).emit('nuevo_badge', {
          badge,
          mensaje: '🌟 ¡Día perfecto! Completaste todas tus tareas de hoy.'
        })
        io.to('coordinadora').emit('badge_otorgado', { usuarioId, badge })
      }
    }
  } catch (e) {
    console.error('Error verificando badges:', e)
  }
}

module.exports = router
