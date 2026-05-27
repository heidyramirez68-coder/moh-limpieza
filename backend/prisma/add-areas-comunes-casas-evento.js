const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const checklistSala = [
  '🛋️ Vaciar la basura',
  '🛋️ Lavar tazas, platos y cubiertos usados',
  '🛋️ Limpiar las cafeteras',
  '🛋️ Barrer y trapear los pisos',
  '🛋️ Limpiar las mesas',
  '🛋️ Todos los abanicos de techo encendidos',
  '🛋️ TV puesta en el slideshow de MOH',
  '🛋️ Revisar bombillas funcionando',
  '🛋️ Revisar abanicos funcionando',
  '🛋️ Revisar puertas funcionando',
  '🛋️ Verificar que no haya insectos/bichos',
]

const checklistCocina = [
  '🍽️ Limpiar encimeras y superficie de trabajo',
  '🍽️ Lavar platos, vasos y utensilios',
  '🍽️ Limpiar la nevera por fuera',
  '🍽️ Revisar agua caliente de la llave',
  '🥤 Un garrafón azul de agua en la máquina',
  '🥤 2 garrafones extra en el almacén de la casa',
  '🥤 Keurig con agua filtrada fresca y filtro limpio',
  '🥤 Un caso de agua en botella (24 botellas) en la nevera',
  '🥤 Coca-Cola regular / Zero / Sprite / Agua con gas en la nevera',
  '🥤 Hielo listo en el congelador / bolsa de hielo',
  '🥤 Revisar stock de pods Keurig/Nespresso — avisar cuando estén bajos',
  '🍽️ Barrer y trapear el piso',
  '🍽️ Basura vaciada',
]

const checklistTerraza = [
  '🌿 Barrer el porche y la pérgola',
  '🌿 Limpiar las sillas y mesas de afuera',
  '🌿 Limpiar las ventanas por fuera',
  '🌿 Confirmar que la basura haya sido vaciada',
  '🌿 Revisar que no haya insectos/bichos',
]

const casas = ['Vision House', 'Staff House']

// Orden base para no chocar con las existentes
const ORDEN_BASE = 200

async function main() {
  let orden = ORDEN_BASE

  for (const casa of casas) {
    const areasNuevas = [
      { nombre: `${casa} — Sala`,    tipo: 'casa_evento', activaPorEvento: true, orden: orden++, checklist: checklistSala },
      { nombre: `${casa} — Cocina`,  tipo: 'casa_evento', activaPorEvento: true, orden: orden++, checklist: checklistCocina },
      { nombre: `${casa} — Terraza`, tipo: 'casa_evento', activaPorEvento: true, orden: orden++, checklist: checklistTerraza },
    ]

    for (const a of areasNuevas) {
      // Verificar si ya existe
      const existe = await prisma.area.findFirst({ where: { nombre: a.nombre } })
      if (existe) {
        console.log(`  ⚠️  Ya existe: ${a.nombre} — actualizando checklist`)
        await prisma.checklistItem.deleteMany({ where: { areaId: existe.id } })
        for (let i = 0; i < a.checklist.length; i++) {
          await prisma.checklistItem.create({ data: { areaId: existe.id, descripcion: a.checklist[i], orden: i + 1 } })
        }
        continue
      }

      const { checklist, ...datos } = a
      const area = await prisma.area.create({ data: { ...datos, activa: false } })
      for (let i = 0; i < checklist.length; i++) {
        await prisma.checklistItem.create({ data: { areaId: area.id, descripcion: checklist[i], orden: i + 1 } })
      }
      console.log(`  ✅ ${area.nombre} (${checklist.length} ítems)`)
    }
  }

  console.log('\n🎉 Listo — Sala, Cocina y Terraza agregadas para Vision House y Staff House')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
