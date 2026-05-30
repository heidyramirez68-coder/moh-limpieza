// Script para actualizar los checklists con las tareas reales de MOH Rep. Dom.
// Ejecutar: node prisma/update-checklists.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ─── CHECKLISTS REALES ─────────────────────────────────────────────────────

const CHECKLISTS = {

  dormitorio: [
    'Lavar los baños',
    'Chequear papel de baño, toalla, jabón de manos y manita de limpias',
    'Recoger los zafacones',
    'Despolvar ventanas y quitar telas de araña',
    'Sacudir',
    'Arreglar camas',
    'Barrer',
    'Limpiar el piso',
    'Apagar abanicos y luces (si la gente se fue)',
  ],

  area_comun: [
    'Barrer',
    'Verificar que haya agua',
    'Organizar',
    'Despolvar',
    'Limpiar',
  ],

  // Casas del staff americano (Yinelda)
  casa_staff: [
    'Lavar sábanas',
    'Lavar baños',
    'Fregar',
    'Limpiar',
    'Arreglar camas',
    'Echar agua',
    'Limpiar neveras',
    'Despolvar',
    'Limpiar gabinetes',
  ],

  // Casa de Matt (Orange House A) — más completo
  casa_matt: [
    'Lavar sábanas',
    'Lavar baños',
    'Fregar',
    'Limpiar',
    'Arreglar camas',
    'Echar agua',
    'Limpiar neveras',
    'Despolvar',
    'Limpiar gabinetes',
    'Revisar café disponible',
    'Revisar snacks disponibles',
    'Servilletas repuestas',
  ],

  // Baños comunes (L-J limpiar bien, V echar agua)
  bano_comun: [
    'Recoger los papeles',
    'Limpiar bien los baños (Lun-Jue)',
    'Limpiar inodoros',
    'Limpiar lavamanos',
    'Jabón de manos repuesto',
    'Papel higiénico repuesto',
    'Sacar basura',
    'Echar agua (Viernes)',
  ],

  // Iglesia (Lun limpiar bien, Mar barrer tarde, Sáb echar agua)
  iglesia: [
    'Limpiar bien toda la iglesia (Lunes)',
    'Despolvar bancas',
    'Quitar telas de araña',
    'Barrer en la tarde antes de irse (Martes — 15 min)',
    'Echar agua (Sábado)',
    'Baños limpios',
    'Sacar basura',
  ],

  oficina: [
    'Limpiar las ventanas',
    'Despolvar',
    'Limpiar el piso',
    'Quitar telas de araña',
    'Sacar basura',
  ],

  warehouse: [
    'Barrer pasillos',
    'Limpiar área de entrada',
    'Organizar suministros',
    'Sacar basura',
    'Apagar luces',
  ],
}

async function actualizarChecklist(areaId, items) {
  // Borrar los existentes e insertar los nuevos
  await prisma.checklistItem.deleteMany({ where: { areaId } })
  for (let i = 0; i < items.length; i++) {
    await prisma.checklistItem.create({
      data: { areaId, descripcion: items[i], orden: i + 1 }
    })
  }
}

async function main() {
  console.log('🔄 Actualizando checklists...')

  const areas = await prisma.area.findMany()

  for (const area of areas) {
    let items = null

    if (area.tipo === 'dormitorio' || area.tipo === 'casa_evento' || area.tipo === 'casa_internos' || area.subtipo === 'goshen') {
      items = CHECKLISTS.dormitorio
    } else if (area.tipo === 'comun') {
      items = CHECKLISTS.area_comun
    } else if (area.tipo === 'casa_staff_americano') {
      items = CHECKLISTS.casa_staff
    } else if (area.tipo === 'orange_house') {
      items = area.nombre.includes('Unidad A') ? CHECKLISTS.casa_matt : CHECKLISTS.casa_staff
    } else if (area.tipo === 'bano') {
      items = area.nombre.toLowerCase().includes('iglesia') ? CHECKLISTS.iglesia : CHECKLISTS.bano_comun
    } else if (area.tipo === 'oficina') {
      items = CHECKLISTS.oficina
    } else if (area.tipo === 'warehouse') {
      items = CHECKLISTS.warehouse
    }

    if (items) {
      await actualizarChecklist(area.id, items)
      console.log(`  ✓ ${area.nombre}`)
    }
  }

  console.log('\n✅ Checklists actualizados correctamente')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Tipos de checklist aplicados:')
  console.log('  🛏️  Dormitorios / Vision House / Staff House / Goshen')
  console.log('  🏛️  Áreas comunes')
  console.log('  🏠  Casas Staff (Yinelda) + Orange House')
  console.log('  🚿  Baños comunes')
  console.log('  ⛪  Iglesia')
  console.log('  🏢  Oficinas')
  console.log('  📦  Warehouse')
}

main().catch(console.error).finally(() => prisma.$disconnect())
