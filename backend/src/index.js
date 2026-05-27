require('dotenv').config()
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const usuariosRoutes = require('./routes/usuarios')
const areasRoutes = require('./routes/areas')
const tareasRoutes = require('./routes/tareas')
const playbookRoutes = require('./routes/playbook')
const reportesRoutes = require('./routes/reportes')
const configRoutes = require('./routes/config')
const alertasRoutes = require('./routes/alertas')

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// Guardar io para usarlo en rutas
app.set('io', io)

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

// Rutas
app.use('/api/auth', authRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/areas', areasRoutes)
app.use('/api/tareas', tareasRoutes)
app.use('/api/playbook', playbookRoutes)
app.use('/api/reportes', reportesRoutes)
app.use('/api/config', configRoutes)
app.use('/api/alertas', alertasRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'MOH Limpieza', timestamp: new Date() })
})

// Socket.io — tiempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id)

  socket.on('join_room', (room) => {
    socket.join(room)
    console.log(`Socket ${socket.id} se unió a: ${room}`)
  })

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id)
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`\n🚀 MOH Limpieza Backend corriendo en puerto ${PORT}`)
  console.log(`📡 Socket.io activo`)
  console.log(`🌐 Frontend esperado en: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`)
})
