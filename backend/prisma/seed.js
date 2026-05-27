const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de MOH Limpieza...')

  // ─── LIMPIAR DATOS EXISTENTES ────────────────────────────────
  await prisma.checklistCompletacion.deleteMany()
  await prisma.checklistItem.deleteMany()
  await prisma.alertaSuministro.deleteMany()
  await prisma.badge.deleteMany()
  await prisma.tareaAsignada.deleteMany()
  await prisma.playbookGrupo.deleteMany()
  await prisma.area.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.configApp.deleteMany()

  // ─── USUARIOS ───────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('MOH2024', 10)

  const usuarios = [
    { nombre: 'Jeidi Ramirez', rol: 'coordinadora', color: '#7C3AED', rolEspecial: null },
    { nombre: 'Erika', rol: 'supervisora', color: '#0891B2', rolEspecial: null },
    { nombre: 'Yakira', rol: 'empleada', color: '#059669', rolEspecial: 'lavanderia' },
    { nombre: 'Yinelda', rol: 'empleada', color: '#DC2626', rolEspecial: 'casas_staff' },
    { nombre: 'Ederlin', rol: 'empleada', color: '#D97706', rolEspecial: null },
    { nombre: 'Senaida', rol: 'empleada', color: '#BE185D', rolEspecial: null },
    { nombre: 'Katherine', rol: 'empleada', color: '#7C3AED', rolEspecial: null },
    { nombre: 'Ana Iris', rol: 'empleada', color: '#65A30D', rolEspecial: null },
  ]

  for (const u of usuarios) {
    await prisma.usuario.create({ data: { ...u, passwordHash } })
  }
  console.log('✅ Usuarios creados')

  // ─── ÁREAS ──────────────────────────────────────────────────

  const areas = [
    // DORMITORIOS
    { nombre: 'Dormitorio 1 — Habitación A', tipo: 'dormitorio', subtipo: 'habitacion', orden: 1 },
    { nombre: 'Dormitorio 1 — Habitación B', tipo: 'dormitorio', subtipo: 'habitacion', orden: 2 },
    { nombre: 'Dormitorio 1 — Habitación C', tipo: 'dormitorio', subtipo: 'habitacion', orden: 3 },
    { nombre: 'Dormitorio 2 — Habitación A', tipo: 'dormitorio', subtipo: 'habitacion', orden: 4 },
    { nombre: 'Dormitorio 2 — Habitación B', tipo: 'dormitorio', subtipo: 'habitacion', orden: 5 },
    { nombre: 'Dormitorio 2 — Habitación C', tipo: 'dormitorio', subtipo: 'habitacion', orden: 6 },
    { nombre: 'Dormitorio 3 — Habitación A', tipo: 'dormitorio', subtipo: 'habitacion', orden: 7 },
    { nombre: 'Dormitorio 3 — Habitación B', tipo: 'dormitorio', subtipo: 'habitacion', orden: 8 },
    { nombre: 'Dormitorio 1 — Área Común', tipo: 'comun', subtipo: 'area_comun_dorm', orden: 9 },
    { nombre: 'Dormitorio 2 — Área Común', tipo: 'comun', subtipo: 'area_comun_dorm', orden: 10 },
    { nombre: 'Dormitorio 3 — Área Común', tipo: 'comun', subtipo: 'area_comun_dorm', orden: 11 },

    // GOSHEN HOUSE
    { nombre: 'Goshen House — Upper A', tipo: 'dormitorio', subtipo: 'goshen', orden: 12 },
    { nombre: 'Goshen House — Upper B', tipo: 'dormitorio', subtipo: 'goshen', orden: 13 },
    { nombre: 'Goshen House — Lower A', tipo: 'dormitorio', subtipo: 'goshen', orden: 14 },
    { nombre: 'Goshen House — Lower B', tipo: 'dormitorio', subtipo: 'goshen', orden: 15 },

    // WAREHOUSE
    { nombre: 'Warehouse (Almacén)', tipo: 'warehouse', orden: 16 },

    // VISION HOUSE (por evento)
    { nombre: 'Vision House — Habitación 1', tipo: 'casa_evento', activaPorEvento: true, orden: 17 },
    { nombre: 'Vision House — Habitación 2', tipo: 'casa_evento', activaPorEvento: true, orden: 18 },
    { nombre: 'Vision House — Habitación 3', tipo: 'casa_evento', activaPorEvento: true, orden: 19 },
    { nombre: 'Vision House — Habitación 4', tipo: 'casa_evento', activaPorEvento: true, orden: 20 },
    { nombre: 'Vision House — Habitación 5', tipo: 'casa_evento', activaPorEvento: true, orden: 21 },
    { nombre: 'Vision House — Habitación 6', tipo: 'casa_evento', activaPorEvento: true, orden: 22 },
    { nombre: 'Vision House — Habitación 7', tipo: 'casa_evento', activaPorEvento: true, orden: 23 },
    { nombre: 'Vision House — Habitación 8', tipo: 'casa_evento', activaPorEvento: true, orden: 24 },

    // STAFF HOUSE (por evento)
    { nombre: 'Staff House — Habitación 1', tipo: 'casa_evento', activaPorEvento: true, orden: 25 },
    { nombre: 'Staff House — Habitación 2', tipo: 'casa_evento', activaPorEvento: true, orden: 26 },
    { nombre: 'Staff House — Habitación 3', tipo: 'casa_evento', activaPorEvento: true, orden: 27 },
    { nombre: 'Staff House — Habitación 4', tipo: 'casa_evento', activaPorEvento: true, orden: 28 },
    { nombre: 'Staff House — Habitación 5', tipo: 'casa_evento', activaPorEvento: true, orden: 29 },
    { nombre: 'Staff House — Habitación 6', tipo: 'casa_evento', activaPorEvento: true, orden: 30 },

    // CASA DE INTERNOS (interdiaria)
    { nombre: 'Casa de Internos — Habitación 1', tipo: 'casa_internos', orden: 31, notas: 'Limpieza interdiaria' },
    { nombre: 'Casa de Internos — Habitación 2', tipo: 'casa_internos', orden: 32, notas: 'Limpieza interdiaria' },

    // ORANGE HOUSE (antes casa naranja, ahora azul)
    { nombre: 'Orange House — Unidad A (Matt y familia)', tipo: 'orange_house', orden: 33, notas: 'Revisар agua, nevera, café, snacks, papel, servilletas' },
    { nombre: 'Orange House — Unidad B (David)', tipo: 'orange_house', orden: 34 },
    { nombre: 'Orange House — Unidad C (Andrew, residente fijo)', tipo: 'orange_house', orden: 35, notas: 'Residente permanente. Limpieza jueves.' },
    { nombre: 'Orange House — Unidad D (Internos)', tipo: 'orange_house', orden: 36, notas: 'Limpieza interdiaria' },

    // CASAS DEL STAFF AMERICANO (Yinelda, horario fijo)
    { nombre: 'Casa Sra. Vanessa', tipo: 'casa_staff_americano', horaFija: '09:00', diaSemana: 1, orden: 37, notas: 'Lunes 9:00 AM' },
    { nombre: 'Casa Beau y Megan', tipo: 'casa_staff_americano', horaFija: '13:30', diaSemana: 2, orden: 38, notas: 'Martes 1:30 PM' },
    { nombre: 'Casa Austin y Paige', tipo: 'casa_staff_americano', horaFija: '09:00', diaSemana: 3, orden: 39, notas: 'Miércoles 9:00 AM' },
    { nombre: 'Casa Andrew (Orange House C)', tipo: 'casa_staff_americano', horaFija: '09:00', diaSemana: 4, orden: 40, notas: 'Jueves 9:00 AM' },
    { nombre: 'Casa Sra. Vanessa (2da visita)', tipo: 'casa_staff_americano', horaFija: '13:30', diaSemana: 4, orden: 41, notas: 'Jueves 1:30 PM' },
    { nombre: 'Casa Grant y Elizabeth', tipo: 'casa_staff_americano', horaFija: '09:00', diaSemana: 5, orden: 42, notas: 'Viernes 9:00 AM' },

    // OFICINAS
    { nombre: 'Oficina Campus Manager (Josué Núñez)', tipo: 'oficina', horaFija: '08:30', diaSemana: 1, orden: 43 },
    { nombre: 'Sala de Conferencia', tipo: 'oficina', horaFija: '09:00', diaSemana: 1, orden: 44 },
    { nombre: 'Market', tipo: 'oficina', horaFija: '09:00', diaSemana: 1, orden: 45 },
    { nombre: 'Coffee Shop', tipo: 'oficina', horaFija: '09:00', diaSemana: 1, orden: 46 },
    { nombre: 'Oficina CA', tipo: 'oficina', horaFija: '09:00', diaSemana: 2, orden: 47 },
    { nombre: 'Oficina Mission Trip', tipo: 'oficina', horaFija: '09:00', diaSemana: 2, orden: 48 },
    { nombre: 'Oficina Hospitalidad', tipo: 'oficina', horaFija: '09:00', diaSemana: 2, orden: 49 },
    { nombre: 'Oficinas Administrativas', tipo: 'oficina', horaFija: '09:00', diaSemana: 2, orden: 50 },
    { nombre: 'Oficina CA (barrer)', tipo: 'oficina', horaFija: '08:30', diaSemana: 3, orden: 51 },
    { nombre: 'Oficina Dr. Rovi', tipo: 'oficina', horaFija: '08:30', diaSemana: 3, orden: 52 },
    { nombre: 'Oficina Atención al Donante', tipo: 'oficina', horaFija: '08:30', diaSemana: 3, orden: 53 },
    { nombre: 'Oficina Bou', tipo: 'oficina', horaFija: '09:00', diaSemana: 4, orden: 54 },
    { nombre: 'Oficina Elizabeth y Grant', tipo: 'oficina', horaFija: '09:00', diaSemana: 4, orden: 55 },
    { nombre: 'Market (viernes)', tipo: 'oficina', horaFija: '09:00', diaSemana: 5, orden: 56 },
    { nombre: 'Coffee Shop (viernes)', tipo: 'oficina', horaFija: '09:00', diaSemana: 5, orden: 57 },
    { nombre: 'Iglesia', tipo: 'bano', horaFija: '09:00', diaSemana: 6, orden: 58 },
    { nombre: 'Oficina Austin Oberlag', tipo: 'oficina', horaFija: '09:00', diaSemana: 6, orden: 59 },
    { nombre: 'Oficina Sra. Vanessa', tipo: 'oficina', horaFija: '09:00', diaSemana: 6, orden: 60 },
    { nombre: 'Oficina Sr. Brad Johnson', tipo: 'oficina', horaFija: '09:00', diaSemana: 6, orden: 61 },

    // BAÑOS PÚBLICOS
    { nombre: 'Baños Públicos', tipo: 'bano', orden: 62 },
  ]

  const areasCreadas = []
  for (const a of areas) {
    const area = await prisma.area.create({ data: a })
    areasCreadas.push(area)
  }
  console.log(`✅ ${areasCreadas.length} áreas creadas`)

  // ─── CHECKLISTS ─────────────────────────────────────────────

  const checklistDormitorio = [
    'Camas arregladas',
    'Barrer',
    'Trapear',
    'Despolvar',
    'Abanicos apagados',
    'Luces apagadas',
    'Baño con papel higiénico',
    'Baño limpio y desinfectado',
    'Ventanas cerradas',
    'Basura sacada',
  ]

  const checklistCasaStaff = [
    'Barrer y trapear',
    'Despolvar',
    'Baño limpio',
    'Papel higiénico repuesto',
    'Camas arregladas (si aplica)',
  ]

  const checklistCasaMatt = [
    'Barrer y trapear',
    'Despolvar',
    'Baño limpio',
    'Papel higiénico repuesto',
    'Revisar agua',
    'Revisar nevera',
    'Café disponible',
    'Snacks disponibles',
    'Servilletas repuestas',
  ]

  const checklistOficina = [
    'Barrer',
    'Trapear',
    'Despolvar escritorios',
    'Papeleras vaciadas',
  ]

  const checklistBano = [
    'Limpiar inodoros',
    'Limpiar lavamanos',
    'Papel higiénico repuesto',
    'Jabón repuesto',
    'Barrer y trapear',
    'Basura sacada',
  ]

  const checklistWarehouse = [
    'Barrer pasillos',
    'Trapear área de entrada',
    'Organizar suministros',
    'Basura sacada',
    'Luces apagadas',
  ]

  const checklistIglesia = [
    'Barrer',
    'Trapear pasillos',
    'Despolvar bancas',
    'Basura sacada',
    'Baños limpios',
  ]

  for (const area of areasCreadas) {
    let items = []
    if (['dormitorio', 'casa_evento', 'casa_internos', 'goshen'].includes(area.tipo) || area.subtipo === 'goshen') {
      items = checklistDormitorio
    } else if (area.tipo === 'orange_house') {
      if (area.nombre.includes('Unidad A')) items = checklistCasaMatt
      else items = checklistCasaStaff
    } else if (area.tipo === 'casa_staff_americano') {
      items = checklistCasaStaff
    } else if (area.tipo === 'oficina') {
      items = checklistOficina
    } else if (area.tipo === 'bano') {
      if (area.nombre.includes('Iglesia')) items = checklistIglesia
      else items = checklistBano
    } else if (area.tipo === 'warehouse') {
      items = checklistWarehouse
    } else if (area.tipo === 'comun') {
      items = ['Barrer', 'Trapear', 'Despolvar', 'Apagar luces y abanicos', 'Basura sacada']
    }

    for (let i = 0; i < items.length; i++) {
      await prisma.checklistItem.create({
        data: { areaId: area.id, descripcion: items[i], orden: i + 1 }
      })
    }
  }
  console.log('✅ Checklists creados')

  // ─── CONFIG APP ─────────────────────────────────────────────
  const configItems = [
    { clave: 'pasaje_biblico', valor: '"Todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres." — Colosenses 3:23' },
    { clave: 'nombre_app', valor: 'MOH Limpieza' },
    { clave: 'nombre_organizacion', valor: 'Mission of Hope' },
    { clave: 'horario_inicio_semana', valor: '08:00' },
    { clave: 'horario_fin_semana', valor: '16:00' },
    { clave: 'horario_fin_sabado', valor: '12:00' },
  ]
  for (const item of configItems) {
    await prisma.configApp.upsert({
      where: { clave: item.clave },
      update: {},
      create: item,
    })
  }
  console.log('✅ Configuración creada')

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Usuarios creados:')
  console.log('  👑 Jeidi Ramírez (coordinadora) — password: MOH2024')
  console.log('  👷 Erika (supervisora) — password: MOH2024')
  console.log('  👩 Yakira, Yinelda, Ederlin, Senaida, Katherine, Ana Iris — password: MOH2024')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
