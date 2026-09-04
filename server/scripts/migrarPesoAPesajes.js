/**
 * Traslada el peso que vivia como columna en Mascota a la tabla Pesaje.
 *
 * Va en dos pasos porque `prisma db push` crea la tabla nueva y borra la
 * columna vieja en la misma operacion: si se corriera despues, el dato ya no
 * estaria.
 *
 *   node scripts/migrarPesoAPesajes.js exportar   # ANTES de db push
 *   npx prisma db push
 *   node scripts/migrarPesoAPesajes.js importar   # DESPUES de db push
 *
 * Ambos pasos son idempotentes y no fallan si no hay nada que migrar (por
 * ejemplo en una instalacion que nunca tuvo la columna).
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import path from 'node:path'

const prisma = new PrismaClient()
const ARCHIVO = path.resolve('.peso-a-migrar.json')

async function exportar() {
  let filas
  try {
    filas = await prisma.$queryRawUnsafe(
      'SELECT id, nombre, peso FROM Mascota WHERE peso IS NOT NULL'
    )
  } catch {
    // La columna ya no existe: no hay nada que exportar.
    console.log('La columna Mascota.peso ya no existe. Nada para exportar.')
    return
  }

  if (filas.length === 0) {
    console.log('Ninguna mascota tenia peso cargado.')
    return
  }

  writeFileSync(ARCHIVO, JSON.stringify(filas, null, 2))
  console.log(`${filas.length} peso(s) guardados en ${ARCHIVO}:`)
  filas.forEach((f) => console.log(`  ${f.nombre}: ${f.peso} kg`))
  console.log('\nAhora corré: npx prisma db push')
}

async function importar() {
  if (!existsSync(ARCHIVO)) {
    console.log('No hay pesos exportados para importar.')
    return
  }

  const filas = JSON.parse(readFileSync(ARCHIVO, 'utf8'))
  let creados = 0

  for (const f of filas) {
    // La mascota pudo haberse borrado entre los dos pasos.
    const mascota = await prisma.mascota.findUnique({ where: { id: f.id } })
    if (!mascota) continue

    // Idempotente: no duplica si ya se importo.
    const yaTiene = await prisma.pesaje.findFirst({ where: { mascotaId: f.id } })
    if (yaTiene) continue

    await prisma.pesaje.create({
      data: {
        mascotaId: f.id,
        peso: f.peso,
        fecha: new Date(),
        nota: 'Peso migrado del registro anterior',
      },
    })
    console.log(`  ${f.nombre}: ${f.peso} kg`)
    creados++
  }

  console.log(`\n${creados} pesaje(s) creado(s).`)
  unlinkSync(ARCHIVO)
  console.log(`Archivo temporal ${ARCHIVO} eliminado.`)
}

const modo = process.argv[2]
const acciones = { exportar, importar }

if (!acciones[modo]) {
  console.error('Uso: node scripts/migrarPesoAPesajes.js exportar|importar')
  process.exitCode = 1
} else {
  acciones[modo]()
    .catch((e) => {
      console.error(e)
      process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
}
