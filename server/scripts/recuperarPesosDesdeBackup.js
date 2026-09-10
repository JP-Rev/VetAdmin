/**
 * Recupera los pesos que vivian en la columna `Mascota.peso` leyendolos de una
 * copia vieja de la base, y los inserta como filas de `Pesaje` en la base viva.
 *
 * Es el plan B de `migrarPesoAPesajes.js`: si el `prisma db push` ya borro la
 * columna antes de exportarla, el dato solo existe en un backup.
 *
 *   node scripts/recuperarPesosDesdeBackup.js /ruta/a/copia-vetadmin.db
 *
 * La copia tiene que ser un archivo escribible (SQLite abre journal aunque solo
 * leas), asi que copiala primero en vez de apuntar al backup original.
 *
 * Es idempotente: si la mascota ya tiene algun pesaje cargado, la saltea. Corre
 * primero en seco para que veas que va a hacer:
 *
 *   node scripts/recuperarPesosDesdeBackup.js /ruta/copia.db --dry-run
 */
import { PrismaClient } from '@prisma/client'
import { existsSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const rutaBackup = args.find((a) => !a.startsWith('--'))

if (!rutaBackup) {
  console.error(
    'Uso: node scripts/recuperarPesosDesdeBackup.js <ruta-copia.db> [--dry-run]'
  )
  process.exit(1)
}

const absoluta = path.resolve(rutaBackup)
if (!existsSync(absoluta)) {
  console.error(`No existe el archivo ${absoluta}`)
  process.exit(1)
}

// La base vieja se abre con el mismo cliente Prisma pero apuntando a otro
// archivo. El schema no coincide (alla existe `peso`, aca no), por eso se lee
// con SQL crudo: Prisma no valida las columnas de un $queryRaw.
const vieja = new PrismaClient({ datasourceUrl: `file:${absoluta}` })
const viva = new PrismaClient()

async function main() {
  let filas
  try {
    filas = await vieja.$queryRawUnsafe(
      'SELECT id, nombre, peso FROM Mascota WHERE peso IS NOT NULL'
    )
  } catch (e) {
    console.error(
      `No se pudo leer Mascota.peso en ${absoluta}. ` +
        'Puede que esa copia sea posterior al db push y ya no tenga la columna.'
    )
    console.error(e.message)
    process.exitCode = 1
    return
  }

  if (filas.length === 0) {
    console.log('Esa copia no tiene ninguna mascota con peso cargado.')
    return
  }

  console.log(`${filas.length} peso(s) encontrados en la copia:`)
  let creados = 0
  let salteados = 0

  for (const f of filas) {
    const mascota = await viva.mascota.findUnique({ where: { id: f.id } })
    if (!mascota) {
      console.log(`  ${f.nombre}: ${f.peso} kg — SALTEADA (ya no existe)`)
      salteados++
      continue
    }

    const yaTiene = await viva.pesaje.findFirst({ where: { mascotaId: f.id } })
    if (yaTiene) {
      console.log(`  ${mascota.nombre}: ${f.peso} kg — SALTEADA (ya tiene pesajes)`)
      salteados++
      continue
    }

    if (dryRun) {
      console.log(`  ${mascota.nombre}: ${f.peso} kg — se crearia`)
    } else {
      await viva.pesaje.create({
        data: {
          mascotaId: f.id,
          peso: f.peso,
          fecha: new Date(),
          nota: 'Peso recuperado del backup previo a la migracion',
        },
      })
      console.log(`  ${mascota.nombre}: ${f.peso} kg — creado`)
    }
    creados++
  }

  console.log(
    dryRun
      ? `\n(simulacion) ${creados} pesaje(s) se crearian, ${salteados} salteado(s).`
      : `\n${creados} pesaje(s) creado(s), ${salteados} salteado(s).`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await vieja.$disconnect()
    await viva.$disconnect()
  })
