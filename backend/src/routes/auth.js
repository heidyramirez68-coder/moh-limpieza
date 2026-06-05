const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
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

// USUARIOS PÚBLICOS (para lista en login)
router.get('/usuarios-publicos', async (req, res) => {
  const usuarios = await prisma.usuario.findMany({
    where: { activo: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' }
  })
  res.json(usuarios)
})

// RECUPERAR CONTRASEÑA
router.post('/recuperar-password', async (req, res) => {
  try {
    const { nombre, email } = req.body
    if (!nombre || !email) return res.status(400).json({ error: 'Nombre y email requeridos' })

    const usuario = await prisma.usuario.findFirst({ where: { nombre: { equals: nombre }, activo: true } })
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })

    // Generar contraseña temporal
    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase()
    const hash = await bcrypt.hash(tempPassword, 10)
    await prisma.usuario.update({ where: { id: usuario.id }, data: { passwordHash: hash, primerLogin: true } })

    // Enviar email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: 'heidy.ramirez68@gmail.com', pass: process.env.GMAIL_APP_PASSWORD }
    })

    await transporter.sendMail({
      from: '"MOH Limpieza" <heidy.ramirez68@gmail.com>',
      to: email,
      subject: '🔑 Tu contraseña temporal — MOH Limpieza',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">MOH Limpieza</h2>
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Tu contraseña temporal es:</p>
          <div style="background: #f3f0ff; padding: 20px; border-radius: 10px; text-align: center;">
            <span style="font-size: 24px; font-weight: bold; color: #7C3AED; letter-spacing: 4px;">${tempPassword}</span>
          </div>
          <p>Cuando entres, la app te pedirá que la cambies por una nueva.</p>
          <p style="color: #888; font-size: 12px;">— Equipo MOH Limpieza</p>
        </div>
      `
    })

    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'No se pudo enviar el email' })
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
