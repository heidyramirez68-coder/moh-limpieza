#!/bin/bash
# ════════════════════════════════════════════════════════════
#  MOH Limpieza — Script de instalación completa
#  Ejecutar desde la carpeta moh-limpieza/
# ════════════════════════════════════════════════════════════

echo "🚀 Instalando MOH Limpieza..."

# ─── BACKEND ──────────────────────────────────────────────
echo "📦 Instalando dependencias del backend..."
cd backend
npm install

# Crear .env si no existe
if [ ! -f .env ]; then
  echo "⚙️  Creando archivo .env..."
  cp .env.example .env
  echo ""
  echo "⚠️  IMPORTANTE: Edita backend/.env con tu conexión de PostgreSQL"
  echo "   DATABASE_URL=\"postgresql://USUARIO:PASSWORD@localhost:5432/moh_limpieza\""
  echo ""
fi

echo "🗃️  Configurando base de datos..."
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js

# ─── FRONTEND ─────────────────────────────────────────────
echo "📦 Instalando dependencias del frontend..."
cd ../frontend
npm install

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ ¡Instalación completada!"
echo ""
echo "Para iniciar la app:"
echo ""
echo "  Terminal 1 (backend):"
echo "    cd backend && npm run dev"
echo ""
echo "  Terminal 2 (frontend):"
echo "    cd frontend && npm run dev"
echo ""
echo "Luego abre: http://localhost:5173"
echo ""
echo "Usuarios de prueba (contraseña: MOH2024):"
echo "  - Jeidi Ramírez (coordinadora)"
echo "  - Erika (supervisora)"
echo "  - Yakira, Yinelda, Ederlin, Senaida, Katherine, Ana Iris"
echo "════════════════════════════════════════════════════════"
