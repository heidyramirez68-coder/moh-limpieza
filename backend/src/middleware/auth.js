const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token requerido' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'moh-secret-2024')
    req.usuario = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

const soloCoordinadora = (req, res, next) => {
  if (req.usuario.rol !== 'coordinadora') {
    return res.status(403).json({ error: 'Solo la coordinadora puede hacer esto' })
  }
  next()
}

const coordinadoraOSupervisora = (req, res, next) => {
  if (!['coordinadora', 'supervisora'].includes(req.usuario.rol)) {
    return res.status(403).json({ error: 'Acceso no autorizado' })
  }
  next()
}

module.exports = { authMiddleware, soloCoordinadora, coordinadoraOSupervisora }
