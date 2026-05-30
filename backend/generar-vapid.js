// Genera las claves VAPID para notificaciones push
// Ejecutar UNA SOLA VEZ: node generar-vapid.js
// Luego copiar las claves al .env

const webpush = require('web-push')
const keys = webpush.generateVAPIDKeys()

console.log('\n✅ Claves VAPID generadas. Agrega estas líneas a tu .env:\n')
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log('\n⚠️  Guarda estas claves. Si las cambias, todos los usuarios deben suscribirse de nuevo.\n')
