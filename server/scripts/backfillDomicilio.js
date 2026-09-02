/**
 * Pasa el domicilio libre ("Dorrego 220") a los campos separados calle/numero.
 *
 * Es idempotente: solo toca clientes que tengan `domicilio` cargado y los tres
 * campos nuevos vacios, asi que se puede correr las veces que haga falta sin
 * pisar nada editado a mano despues.
 *
 * La columna `domicilio` no se borra: queda como respaldo hasta verificar la
 * migracion en el VPS.
 *
 *   node scripts/backfillDomicilio.js
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Separa "Dorrego 220" en { calle: 'Dorrego', numero: '220' } y
 * "Calle Falsa 123, Springfield" agregando localidad.
 *
 * Si no encuentra un numero al final deja todo en calle: es preferible a
 * inventar un corte donde no lo hay ("Barrio San Jose s/n"). Nada se descarta.
 */
export function parseDomicilio(texto) {
  const limpio = (texto ?? '').trim().replace(/\s+/g, ' ')
  if (!limpio) return { calle: null, numero: null, localidad: null }

  // Con coma, lo de la derecha suele ser la localidad.
  const coma = limpio.indexOf(',')
  let base = limpio
  let localidad = null
  if (coma > 0) {
    const derecha = limpio.slice(coma + 1).trim()
    if (derecha) {
      base = limpio.slice(0, coma).trim()
      localidad = derecha
    }
  }

  // Numero al final, con posible sufijo: 220, 220 bis, 1500 B, 45-A
  const m = base.match(/^(.*?)\s+(\d+[\s-]?[A-Za-z]{0,4})$/)
  if (m && m[1].trim()) {
    return { calle: m[1].trim(), numero: m[2].trim(), localidad }
  }
  return { calle: base, numero: null, localidad }
}

async function main() {
  const pendientes = await prisma.cliente.findMany({
    where: {
      NOT: [{ domicilio: null }, { domicilio: '' }],
      calle: null,
      numero: null,
      localidad: null,
    },
  })

  if (pendientes.length === 0) {
    console.log('No hay domicilios para migrar.')
    return
  }

  let migrados = 0
  for (const cliente of pendientes) {
    const { calle, numero, localidad } = parseDomicilio(cliente.domicilio)
    if (!calle) continue
    await prisma.cliente.update({ where: { id: cliente.id }, data: { calle, numero, localidad } })
    console.log(
      `  ${cliente.nombre}: "${cliente.domicilio}" -> calle="${calle}" numero="${numero ?? ''}" localidad="${localidad ?? ''}"`
    )
    migrados++
  }
  console.log(`\n${migrados} domicilio(s) migrado(s). La columna "domicilio" se conserva como respaldo.`)
}

// Solo corre cuando se lo invoca directamente, no al importarlo.
if (process.argv[1] && process.argv[1].endsWith('backfillDomicilio.js')) {
  main()
    .catch((e) => {
      console.error(e)
      process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
}
