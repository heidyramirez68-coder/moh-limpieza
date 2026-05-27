const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { nombre, password } = req.body
    if (!nombre || !password) {
      return res.status(400).json({ error: 'Nombre y contraseña requeridos' })
    }

    const usuario = await prisma.usuario.findFirst({
      where: { nombre: { equals: nombre }, activo: true }
    })

    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' })

    const valid = await bcrypt.compare(password, usuario.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' })

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, color: usuario.color, rolEspecial: usuario.rolEspecial },
      process.env.JWT_SECRET || 'moh-secret-2024',
      { expiresIn: '7d' }
    )

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        color: usuario.color,
        rolEspecial: usuario.rolEspecial,
        primerLogin: usuario.primerLogin,
      }
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

// CAMBIAR CONTRASEÑA
router.post('/cambiar-password', authMiddleware, async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } })

    const valid = await bcrypt.compare(passwordActual, usuario.passwordHash)
    if (!valid) return res.status(400).json({ error: 'Contraseña actual incorrecta' })

    const hash = await bcrypt.hash(passwordNueva, 10)
    await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { passwordHash: hash, primerLogin: false }
    })

    res.json({ ok: true, mensaje: '¡Contraseña actualizada!' })
  } catch (e) {
    res.status(500).json({ error: 'Error del servidor' })
  }
})

// PERFIL ACTUAL
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: { id: true, nombre: true, rol: true, color: true, rolEspecial: true, primerLogin: true }
    })
    res.json(usuario)
  } catch (e) {
    res.status(500).json({ error: 'Error del servidor' })
  }
})

module.exports = router
