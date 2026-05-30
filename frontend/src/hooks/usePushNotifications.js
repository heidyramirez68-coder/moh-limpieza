import { useEffect } from 'react'
import axios from 'axios'

export function usePushNotifications() {
  useEffect(() => {
    suscribirPush()
  }, [])
}

async function suscribirPush() {
  try {
    // Verificar soporte
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    // Obtener clave pública
    const { data } = await axios.get('/api/push/vapid-public-key')
    if (!data.publicKey) return // Push no configurado en el servidor

    // Pedir permiso
    const permiso = await Notification.requestPermission()
    if (permiso !== 'granted') return

    // Registrar service worker y suscribirse
    const sw = await navigator.serviceWorker.ready
    const suscripcionExistente = await sw.pushManager.getSubscription()

    let suscripcion = suscripcionExistente
    if (!suscripcionExistente) {
      suscripcion = await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey)
      })
    }

    // Enviar suscripción al servidor
    await axios.post('/api/push/suscribir', {
      endpoint: suscripcion.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(suscripcion.getKey('p256dh')),
        auth: arrayBufferToBase64(suscripcion.getKey('auth'))
      }
    })
  } catch (e) {
    // Silencioso — push es opcional
    console.log('Push no disponible:', e.message)
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach(b => binary += String.fromCharCode(b))
  return window.btoa(binary)
}
