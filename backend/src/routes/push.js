const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// GET clave pública VAPID (necesaria para suscribirse)
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null })
})

// POST guardar suscripción del navegador
router.post('/suscribir', authMiddleware, async (req, res) => {
  try {
    const { endpoint, keys } = req.body
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Datos de suscripción incompletos' })
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { usuarioId: req.usuario.id, p256dh: keys.p256dh, auth: keys.auth },
      create: { usuarioId: req.usuario.id, endpoint, p256dh: keys.p256dh, auth: keys.auth }
    })

    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error guardando suscripción' })
  }
})

// DELETE cancelar suscripción
router.post('/desuscribir', authMiddleware, async (req, res) => {
  try {
    const { endpoint } = req.body
    await prisma.pushSubscription.deleteMany({ where: { endpoint, usuarioId: req.usuario.id } })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Error' })
  }
})

module.exports = router
