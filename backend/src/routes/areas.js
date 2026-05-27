// ─── AREAS ───────────────────────────────────────────────────────────────────
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authMiddleware, soloCoordinadora } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// GET todas las áreas
router.get('/', authMiddleware, async (req, res) => {
  const areas = await prisma.area.findMany({
    where: { activa: true },
    include: { checklistItems: { where: { activo: true }, orderBy: { orden: 'asc' } } },
    orderBy: { orden: 'asc' }
  })
  res.json(areas)
})

// GET área específica
router.get('/:id', authMiddleware, async (req, res) => {
  const area = await prisma.area.findUnique({
    where: { id: Number(req.params.id) },
    include: { checklistItems: { orderBy: { orden: 'asc' } } }
  })
  res.json(area)
})

// POST crear área
router.post('/', authMiddleware, soloCoordinadora, async (req, res) => {
  try {
    const area = await prisma.area.create({ data: req.body, include: { checklistItems: true } })
    res.json(area)
  } catch (e) {
    res.status(500).json({ error: 'Error creando área' })
  }
})

// PATCH editar área
router.patch('/:id', authMiddleware, soloCoordinadora, async (req, res) => {
  try {
    const area = await prisma.area.update({
      where: { id: Number(req.params.id) },
      data: req.body,
      include: { checklistItems: { where: { activo: true }, orderBy: { orden: 'asc' } } }
    })
    res.json(area)
  } catch (e) {
    res.status(500).json({ error: 'Error actualizando área' })
  }
})

// PATCH activar/desactivar área por evento
router.patch('/:id/activar-evento', authMiddleware, soloCoordinadora, async (req, res) => {
  const { activa } = req.body
  const area = await prisma.area.update({
    where: { id: Number(req.params.id) },
    data: { activa }
  })
  const io = req.app.get('io')
  io.to('coordinadora').emit('area_evento_actualizada', area)
  res.json(area)
})

// DELETE área
router.delete('/:id', authMiddleware, soloCoordinadora, async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.checklistCompletacion.deleteMany({ where: { checklistItem: { areaId: id } } })
    await prisma.checklistItem.deleteMany({ where: { areaId: id } })
    await prisma.tareaAsignada.deleteMany({ where: { areaId: id } })
    await prisma.alertaSuministro.deleteMany({ where: { areaId: id } })
    await prisma.playbookGrupo.deleteMany({ where: { areaId: id } })
    await prisma.area.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Error eliminando área' })
  }
})

// POST agregar checklist item
router.post('/:id/checklist', authMiddleware, soloCoordinadora, async (req, res) => {
  const item = await prisma.checklistItem.create({
    data: { areaId: Number(req.params.id), ...req.body }
  })
  res.json(item)
})

// PATCH editar checklist item
router.patch('/checklist/:itemId', authMiddleware, soloCoordinadora, async (req, res) => {
  const item = await prisma.checklistItem.update({
    where: { id: Number(req.params.itemId) },
    data: req.body
  })
  res.json(item)
})

// DELETE checklist item (soft delete)
router.delete('/checklist/:itemId', authMiddleware, soloCoordinadora, async (req, res) => {
  await prisma.checklistItem.update({ where: { id: Number(req.params.itemId) }, data: { activo: false } })
  res.json({ ok: true })
})

module.exports = router
