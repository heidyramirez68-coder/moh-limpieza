# MOH Limpieza — Mission of Hope
## App de Gestión del Equipo de Limpieza

### Descripción
Aplicación web completa para gestionar el equipo de limpieza de Mission of Hope.
Coordinadora: Jeidi Ramírez | Supervisora: Erika

---

## Stack Tecnológico
- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL (con Prisma ORM)
- **Autenticación:** JWT + bcrypt
- **Tiempo real:** Socket.io (para notificaciones en vivo)
- **PDF:** Puppeteer o jsPDF (reportes semanales)

---

## Instrucciones para Claude Code

### 1. Inicializar el proyecto
```bash
# Backend
mkdir backend && cd backend
npm init -y
npm install express prisma @prisma/client bcryptjs jsonwebtoken socket.io cors dotenv
npm install -D nodemon

# Frontend
cd ..
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-router-dom socket.io-client @heroicons/react react-hot-toast date-fns jspdf
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Estructura del proyecto
```
moh-limpieza/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── index.js
│   └── .env
└── frontend/
    └── src/
        ├── pages/
        ├── components/
        └── App.jsx
```

---

## Funcionalidades Completas

### Roles
1. **Jeidi (Coordinadora)** — Acceso total
   - Ver y editar TODO (personas, áreas, horarios, checklists)
   - Asignar tareas semanales
   - Ver progreso en tiempo real
   - Recibir notificaciones cuando un área se completa
   - Ingresar el Playbook semanal (grupos, dormitorios, género)
   - Descargar reporte PDF diario y semanal
   - Ver tiempo que tarda cada empleada por tarea

2. **Erika (Supervisora)**
   - Ver progreso de todas las chicas
   - Marcar tareas como completadas
   - Recibir alertas de suministros faltantes

3. **Empleadas (Yakira, Yinelda, Ederlin, Senaida, Katherine, Ana Iris)**
   - Solo ven sus propias tareas del día
   - Marcan checklist (inicio y fin — para medir tiempo)
   - Botón de "Falta suministro" por área
   - Yakira: módulo especial de lavandería + botón "Disponible para apoyar"
   - No pueden ver ni editar tareas de otras compañeras

---

## Horarios
- Lunes a Viernes: 8:00 AM – 4:00 PM
- Sábados: 8:00 AM – 12:00 PM
- Domingos: Rotativo (Jeidi asigna)

---

## Áreas del Campus

### Dormitorios (activación por grupo)
- Dormitorio 1: Habitación A, B, C
- Dormitorio 2: Habitación A, B, C
- Dormitorio 3: Habitación A, B
- Goshen House: Upper A, Upper B, Lower A, Lower B
- Warehouse: hasta 50 personas

### Casas (activación por evento)
- Vision House: 8 habitaciones (se activa cuando llega grupo)
- Staff House: 6 habitaciones (se activa por evento)

### Casa de Internos
- 2 habitaciones — limpieza interdiaria

### Orange House (antes Casa Naranja, ahora Azul)
- Unidad A: Matt y familia — limpieza martes
- Unidad B: David — limpieza martes
- Unidad C: Andrew (fijo, residente permanente) — limpieza jueves
- Unidad D: Internos — limpieza interdiaria

### Casas del Staff Americano (Yinelda, horario fijo)
- Lunes 9:00 AM — Casa Sra. Vanessa
- Martes 1:30 PM — Casa Beau y Megan
- Miércoles 9:00 AM — Casa Austin y Paige
- Jueves 9:00 AM — Casa Andrew (Orange House C)
- Jueves 1:30 PM — Casa Sra. Vanessa (segunda visita)
- Viernes 9:00 AM — Casa Grant y Elizabeth

### Oficinas (esquema fijo semanal)
- Lunes 8:30 AM — Oficina Campus Manager (Josué Núñez)
- Lunes 9:00 AM — Sala de conferencia, Market, Coffee Shop + pasar por iglesia
- Martes 9:00 AM — Oficina CA, Mission Trip, Hospitalidad, Administrativas
- Miércoles 8:30 AM — Barrer Oficina CA, Dr. Rovi, Atención al donante
- Jueves 9:00 AM — Oficina Bou, Oficina Elizabeth y Grant
- Viernes 9:00 AM — Market, Coffee Shop y baños públicos
- Sábado 9:00 AM — Iglesia, baños públicos, Oficina Austin Oberlag, Oficina Sra. Vanessa, Sr. Brad Johnson

### Áreas Comunes
- Áreas comunes de dormitorios (revisar siempre)
- Baños públicos
- Iglesia

---

## Checklists por Tipo de Área

### Dormitorios / Habitaciones
- [ ] Camas arregladas
- [ ] Barrer
- [ ] Trapear
- [ ] Despolvar
- [ ] Abanicos apagados
- [ ] Luces apagadas
- [ ] Baño con papel higiénico
- [ ] Baño limpio y desinfectado
- [ ] Ventanas cerradas
- [ ] Basura sacada

### Casas del Staff
- [ ] Barrer y trapear
- [ ] Despolvar
- [ ] Baño limpio
- [ ] Papel higiénico repuesto
- [ ] Camas arregladas (si aplica)
- [ ] [Solo Casa Matt] Agua, nevera, café, snacks, papel, servilletas

### Oficinas
- [ ] Barrer
- [ ] Trapear
- [ ] Despolvar escritorios
- [ ] Papeleras vaciadas
- [ ] Baño de oficina (si aplica)

### Baños Públicos
- [ ] Limpiar inodoros
- [ ] Limpiar lavamanos
- [ ] Papel higiénico
- [ ] Jabón repuesto
- [ ] Barrer y trapear
- [ ] Basura sacada

---

## Roles Especiales

### Yakira — Lavandería
- Pantalla principal: flujo de ropa (no habitaciones)
- Puede marcar: "Lavandería al día" / "Lavandería saturada"
- Botón "Disponible para apoyar" → notifica a Jeidi y Erika → se le asignan habitaciones prioritarias pendientes

### Yinelda — Casas del Staff
- Ruta fija con horario por día
- Cuando termina antes, puede apoyar en otras áreas

---

## Playbook Semanal (Panel de Jeidi)
- Ingresar grupos por semana: fechas llegada/salida, dormitorio, cantidad, género (H/M)
- La app muestra qué habitaciones hay que preparar
- Semanas: Sábado a Sábado y Miércoles a Miércoles

---

## Sistema de Notificaciones
- ✅ Área 100% completada → notifica a Jeidi en tiempo real
- ⚠️ Suministro faltante → notifica a Jeidi y Erika
- 🕐 Tarea pendiente al final del día → pasa automáticamente al día siguiente
- 🙋 Yakira disponible para apoyar → notifica a Jeidi y Erika

---

## Reportes (Solo Jeidi)
- Reporte diario: áreas completadas, pendientes, tiempo por empleada
- Reporte semanal: resumen completo, tiempo promedio por persona, eficiencia
- Descarga en PDF
- Incluye: hora de inicio y fin de cada tarea

---

## UI/UX
- Cada empleada tiene un color único de perfil
- Encabezado con rango de fechas de la semana (ej: "Del 25 al 31 de mayo")
- Cambia automáticamente cada semana (Lunes a Domingo)
- Pasaje bíblico en pantalla de inicio (ej: "Todo lo que hagáis, hacedlo de corazón, como para el Señor" — Col. 3:23)
- Sistema de reconocimientos/badges:
  - 🌟 "Día perfecto" — completó todas sus tareas del día
  - 🏆 "Semana completa" — completó todo en la semana
  - ⚡ "Velocidad récord" — completó antes de lo esperado
  - 🤝 "Equipo" — ayudó a una compañera
- Login con contraseña que cada una escoge

---

## Base de Datos — Modelos Prisma

```prisma
model Usuario {
  id          Int      @id @default(autoincrement())
  nombre      String
  rol         String   // "coordinadora" | "supervisora" | "empleada"
  color       String   // color único de perfil
  passwordHash String
  activo      Boolean  @default(true)
  creadoEn    DateTime @default(now())
  tareas      TareaAsignada[]
  badges      Badge[]
}

model Area {
  id          Int      @id @default(autoincrement())
  nombre      String
  tipo        String   // "dormitorio" | "casa_staff" | "oficina" | "baño" | "lavanderia" | "comun"
  subtipo     String?  // "habitacion" | "casa_americana" | etc
  activaPorEvento Boolean @default(false)
  activa      Boolean  @default(true)
  checklistItems ChecklistItem[]
  tareas      TareaAsignada[]
}

model ChecklistItem {
  id          Int      @id @default(autoincrement())
  areaId      Int
  area        Area     @relation(fields: [areaId], references: [id])
  descripcion String
  orden       Int
  completaciones ChecklistCompletacion[]
}

model TareaAsignada {
  id          Int      @id @default(autoincrement())
  fecha       DateTime
  areaId      Int
  area        Area     @relation(fields: [areaId], references: [id])
  usuarioId   Int
  usuario     Usuario  @relation(fields: [usuarioId], references: [id])
  estado      String   @default("pendiente") // "pendiente" | "en_progreso" | "completada"
  horaInicio  DateTime?
  horaFin     DateTime?
  notasPendiente String? // por si se pasa al otro día
  checklistCompletaciones ChecklistCompletacion[]
  creadoEn    DateTime @default(now())
}

model ChecklistCompletacion {
  id            Int      @id @default(autoincrement())
  tareaId       Int
  tarea         TareaAsignada @relation(fields: [tareaId], references: [id])
  checklistItemId Int
  checklistItem ChecklistItem @relation(fields: [checklistItemId], references: [id])
  completadoEn  DateTime @default(now())
  completadoPor Int      // usuarioId
}

model PlaybookGrupo {
  id           Int      @id @default(autoincrement())
  fechaLlegada DateTime
  fechaSalida  DateTime
  areaId       Int
  cantidad     Int
  genero       String   // "H" | "M" | "Mixto"
  notas        String?
  creadoEn     DateTime @default(now())
}

model AlertaSuministro {
  id          Int      @id @default(autoincrement())
  areaId      Int
  descripcion String
  reportadoPor Int
  resuelta    Boolean  @default(false)
  creadoEn    DateTime @default(now())
}

model Badge {
  id          Int      @id @default(autoincrement())
  usuarioId   Int
  usuario     Usuario  @relation(fields: [usuarioId], references: [id])
  tipo        String   // "dia_perfecto" | "semana_completa" | "velocidad_record" | "equipo"
  otorgadoEn  DateTime @default(now())
}
```

---

## Comandos para iniciar

```bash
# Instalar todo
cd backend && npm install
cd ../frontend && npm install

# Configurar base de datos
cd backend
npx prisma migrate dev --name init
npx prisma db seed

# Iniciar en desarrollo
# Terminal 1 (backend):
cd backend && npm run dev

# Terminal 2 (frontend):
cd frontend && npm run dev
```

---

## Seed Data (datos iniciales)
El seed debe crear:
1. Usuario Jeidi (coordinadora, color #7C3AED)
2. Usuario Erika (supervisora, color #0891B2)
3. Yakira (empleada, color #059669) — rol lavandería
4. Yinelda (empleada, color #DC2626) — casas staff
5. Ederlin (empleada, color #D97706)
6. Senaida (empleada, color #7C3AED... usar otro)
7. Katherine (empleada, color #DB2777)
8. Ana Iris (empleada, color #65A30D)
9. Todas las áreas del campus con sus checklists
10. Horario fijo de casas del staff y oficinas

Contraseñas iniciales (cada una las cambia al primer login):
- Todas: "MOH2024" (temporal)
