// Módulo de notificaciones push (Web Push API)
const webpush = require('web-push')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Configurar VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:moh@missionofhope.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

// Enviar push a un usuario específico
async function enviarPush(usuarioId, titulo, cuerpo, url = '/') {
  if (!process.env.VAPID_PUBLIC_KEY) return // Push no configurado

  try {
    const subs = await prisma.pushSubscription.findMany({ where: { usuarioId } })
    const payload = JSON.stringify({ titulo, cuerpo, url })

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      } catch (err) {
        // Si la suscripción expiró, eliminarla
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } })
        }
      }
    }
  } catch (e) {
    console.error('Error enviando push:', e.message)
  }
}

// Enviar push a todos los de un rol
async function enviarPushRol(rol, titulo, cuerpo, url = '/') {
  if (!process.env.VAPID_PUBLIC_KEY) return

  try {
    const usuarios = await prisma.usuario.findMany({ where: { rol, activo: true } })
    for (const u of usuarios) {
      await enviarPush(u.id, titulo, cuerpo, url)
    }
  } catch (e) {
    console.error('Error enviando push a rol:', e.message)
  }
}

module.exports = { enviarPush, enviarPushRol }
