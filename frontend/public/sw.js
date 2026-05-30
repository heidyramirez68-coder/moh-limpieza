// Service Worker para MOH Limpieza — maneja notificaciones push
self.addEventListener('push', (event) => {
  if (!event.data) return
  try {
    const { titulo, cuerpo, url } = event.data.json()
    event.waitUntil(
      self.registration.showNotification(titulo, {
        body: cuerpo,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        data: { url: url || '/' },
        actions: [{ action: 'abrir', title: 'Ver' }]
      })
    )
  } catch (e) {
    console.error('Error mostrando notificación:', e)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
