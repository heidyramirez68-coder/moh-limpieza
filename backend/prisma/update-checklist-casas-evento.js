const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const checklist = [
  // ─── PARTE 1: TAREAS DIARIAS ───────────────────────────────
  '— PARTE 1: TAREAS DIARIAS (mientras haya huéspedes) —',
  // Cuartos
  '🛏️ [Cuarto] Tender la cama de cada huésped (mientras estén fuera)',
  '🛏️ [Cuarto] Abanico encendido',
  '🛏️ [Cuarto] Luces encendidas antes de que lleguen',
  '🛏️ [Cuarto] Agua caliente funcionando',
  '🛏️ [Cuarto] Perillas de puerta funcionando',
  '🛏️ [Cuarto] Bombillas funcionando',
  '🛏️ [Cuarto] Verificar que no haya insectos/bichos',
  // Baños
  '🚿 [Baño] Confirmar que cada ducha tiene agua caliente',
  '🚿 [Baño] Baño limpio',
  '🚿 [Baño] Ducha limpia',
  '🚿 [Baño] Basura vaciada',
  '🚿 [Baño] Shampoo disponible',
  '🚿 [Baño] Acondicionador disponible',
  '🚿 [Baño] Gel de baño disponible',
  '🚿 [Baño] Jabón para el lavamanos disponible',
  '🚿 [Baño] Papel higiénico (mínimo 4 rollos)',
  // Áreas comunes
  '🛋️ [Sala] Vaciar la basura',
  '🛋️ [Sala] Lavar tazas, platos y cubiertos usados',
  '🛋️ [Sala] Limpiar las cafeteras',
  '🛋️ [Sala] Barrer y trapear los pisos',
  '🛋️ [Sala] Limpiar las mesas',
  '🛋️ [Sala] Todos los abanicos de techo encendidos',
  '🛋️ [Sala] TV puesta en el slideshow de MOH',
  '🛋️ [Sala] Revisar mantenimiento: bombillas / abanicos / puertas / insectos',
  // Exterior
  '🌿 [Exterior] Barrer el porche y la pérgola',
  '🌿 [Exterior] Limpiar las sillas de afuera',
  '🌿 [Exterior] Limpiar las ventanas por fuera',
  '🌿 [Exterior] Confirmar que la basura haya sido vaciada',
  // Snacks y bebidas
  '🥤 [Snacks] Un garrafón azul de agua en la máquina',
  '🥤 [Snacks] 2 garrafones extra en el almacén de la casa',
  '🥤 [Snacks] Keurig con agua filtrada fresca y filtro limpio',
  '🥤 [Snacks] Un caso de agua en botella (24 botellas) en la nevera',
  '🥤 [Snacks] Coca-Cola regular / Zero / Sprite / Agua con gas en la nevera',
  '🥤 [Snacks] Hielo listo en el congelador / bolsa de hielo',
  '🥤 [Snacks] Revisar stock de pods Keurig/Nespresso — avisar cuando estén bajos',
  // Cumpleaños
  '🎂 [Cumpleaños] Tarjeta de cumpleaños escrita a mano',
  '🎂 [Cumpleaños] Pequeño bizcocho / galleta / dulce especial',

  // ─── PARTE 2: PREPARACIÓN PARA LLEGADA ────────────────────
  '— PARTE 2: PREPARACIÓN PARA LLEGADA (día antes / día de llegada) —',
  // Aeropuerto
  '✈️ [Aeropuerto] Enviar snacks/bebidas con el chofer y el recibidor',
  '✈️ [Aeropuerto] Notificar al recibidor el horario estimado de llegada (WhatsApp)',
  // Cuartos llegada
  '🛏️ [Llegada] Regalo: 1 barra de chocolate (Solo Vision Trips)',
  '🛏️ [Llegada] Regalo: 1 artículo MOH — botella de agua y diario (Solo Vision Trips)',
  '🛏️ [Llegada] Nota de bienvenida escrita a mano (Solo Vision Trips)',
  '🛏️ [Llegada] Materiales — Carta de Shawn',
  '🛏️ [Llegada] Materiales — Folleto de MOH',
  '🛏️ [Llegada] Materiales — Tarjetas: Internships, Medical Missions, Gen Missions, WE, Team Hope',
  '🛏️ [Llegada] Materiales — Food Security, Education, Community Engagement (One Pages)',
  '🛏️ [Llegada] Materiales — 1 sticker de One Mission, 1 pulsera',
  '🛏️ [Llegada] AC: modo DRY sin huéspedes / COOLING 22°C mañana del día de llegada',
  '🛏️ [Llegada] Sábanas y manta en buenas condiciones',
  '🛏️ [Llegada] Toalla / toalla de mano / paño de baño (1 por persona)',
  '🛏️ [Llegada] Toalla negra para el rostro para mujeres',
  '🛏️ [Llegada] 5 ganchos y perchero en el cuarto',
  '🛏️ [Llegada] Cómoda limpia y ordenada',
  '🛏️ [Llegada] Nombre del/los huésped(es) en la puerta (impreso)',
  // Baños llegada
  '🚿 [Llegada-Baño] Shampoo (lleno)',
  '🚿 [Llegada-Baño] Acondicionador (lleno)',
  '🚿 [Llegada-Baño] Gel de baño (lleno)',
  '🚿 [Llegada-Baño] Jabón para el lavamanos',
  '🚿 [Llegada-Baño] 4 rollos de papel higiénico',
  '🚿 [Llegada-Baño] Alfombra de ducha colocada',
  // Closet
  '🗄️ [Closet] Sábanas extra disponibles',
  '🗄️ [Closet] Fundas de almohada extra disponibles',
  '🗄️ [Closet] Toallas extra disponibles',
  '🗄️ [Closet] Mantas extra disponibles',
]

async function main() {
  // Buscar todas las áreas de Vision House y Staff House
  const areas = await prisma.area.findMany({
    where: {
      tipo: 'casa_evento'
    }
  })

  console.log(`📋 Actualizando checklist de ${areas.length} cuartos (Vision House + Staff House)...`)

  for (const area of areas) {
    // Borrar checklist existente
    await prisma.checklistItem.deleteMany({ where: { areaId: area.id } })

    // Crear los nuevos items
    for (let i = 0; i < checklist.length; i++) {
      await prisma.checklistItem.create({
        data: { areaId: area.id, descripcion: checklist[i], orden: i + 1 }
      })
    }
    console.log(`  ✓ ${area.nombre}`)
  }

  console.log(`\n✅ Checklist actualizado: ${checklist.length} ítems por cuarto`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
