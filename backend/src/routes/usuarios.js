// ─── USUARIOS ───────────────────────────────────────────────────────────────
// backend/src/routes/usuarios.js
const express = require('express')
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const { authMiddleware, soloCoordinadora } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

router.get('/', authMiddleware, async (req, res) => {
  const usuarios = await prisma.usuario.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, rol: true, color: true, rolEspecial: true, primerLogin: true },
    orderBy: { id: 'asc' }
  })
  res.json(usuarios)
})

router.post('/', authMiddleware, soloCoordinadora, async (req, res) => {
  try {
    const { nombre, rol, color, rolEspecial } = req.body
    const hash = await bcrypt.hash('MOH2024', 10)
    const usuario = await prisma.usuario.create({
      data: { nombre, rol, color, rolEspecial, passwordHash: hash },
      select: { id: true, nombre: true, rol: true, color: true, rolEspecial: true }
    })
    res.json(usuario)
  } catch (e) {
    res.status(500).json({ error: 'Error creando usuario' })
  }
})

router.patch('/:id', authMiddleware, soloCoordinadora, async (req, res) => {
  try {
    const { nombre, rol, color, rolEspecial, activo } = req.body
    const usuario = await prisma.usuario.update({
      where: { id: Number(req.params.id) },
      data: { nombre, rol, color, rolEspecial, activo },
      select: { id: true, nombre: true, rol: true, color: true, rolEspecial: true, activo: true }
    })
    res.json(usuario)
  } catch (e) {
    res.status(500).json({ error: 'Error actualizando usuario' })
  }
})

router.post('/:id/reset-password', authMiddleware, soloCoordinadora, async (req, res) => {
  const hash = await bcrypt.hash('MOH2024', 10)
  await prisma.usuario.update({ where: { id: Number(req.params.id) }, data: { passwordHash: hash, primerLogin: true } })
  res.json({ ok: true })
})

router.get('/:id/badges', authMiddleware, async (req, res) => {
  const badges = await prisma.badge.findMany({
    where: { usuarioId: Number(req.params.id) },
    orderBy: { otorgadoEn: 'desc' }
  })
  res.json(badges)
})

module.exports = router
