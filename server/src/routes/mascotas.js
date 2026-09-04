import { prisma } from '../prisma.js'
import { toMascota, toMascotaEnfermedad, toMascotaCirugia, toPesaje } from '../serializers.js'
import { crudRouter } from './crudRouter.js'
import { assertOneOf, ESPECIES, SEXOS, ValidationError } from '../validators.js'
import { asyncRoute } from '../http.js'

/** El peso llega como texto; vacio significa "no se peso en esta visita". */
export const parsePeso = (v) => {
  if (v === undefined || v === null || String(v).trim() === '') return null
  const n = Number(String(v).replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) throw new ValidationError('El peso debe ser un número mayor a cero')
  return n
}

const toCreateData = (body) => {
  assertOneOf(body.especie, ESPECIES, 'especie')
  assertOneOf(body.sexo, SEXOS, 'sexo')
  return {
    nombre: body.nombre,
    especie: body.especie,
    razaId: body.raza_id || null,
    clienteId: body.id_cliente || null,
    fechaNacimiento: new Date(body.fecha_nacimiento),
    sexo: body.sexo,
  }
}

const toUpdateData = (body) => {
  assertOneOf(body.especie, ESPECIES, 'especie')
  assertOneOf(body.sexo, SEXOS, 'sexo')
  const data = {}
  if (body.nombre !== undefined) data.nombre = body.nombre
  if (body.especie !== undefined) data.especie = body.especie
  if (body.raza_id !== undefined) data.razaId = body.raza_id || null
  if (body.id_cliente !== undefined) data.clienteId = body.id_cliente || null
  if (body.fecha_nacimiento !== undefined) data.fechaNacimiento = new Date(body.fecha_nacimiento)
  if (body.sexo !== undefined) data.sexo = body.sexo
  return data
}

const router = crudRouter({ model: prisma.mascota, serialize: toMascota, toCreateData, toUpdateData })

router.post(
  '/:mascotaId/enfermedades',
  asyncRoute(async (req, res) => {
    const row = await prisma.mascotaEnfermedad.create({
      data: {
        mascotaId: req.params.mascotaId,
        enfermedadId: req.body.enfermedad_id,
        fechaDiagnostico: new Date(req.body.fecha_diagnostico),
        observaciones: req.body.observaciones ?? '',
      },
    })
    res.status(201).json(toMascotaEnfermedad(row))
  })
)

router.post(
  '/:mascotaId/cirugias',
  asyncRoute(async (req, res) => {
    const row = await prisma.mascotaCirugia.create({
      data: {
        mascotaId: req.params.mascotaId,
        cirugiaId: req.body.cirugia_id,
        fecha: new Date(req.body.fecha),
        observaciones: req.body.observaciones ?? '',
        costoFinal: req.body.costo_final ?? null,
      },
    })
    res.status(201).json(toMascotaCirugia(row))
  })
)

/** Registrar un pesaje. La fecha por defecto es hoy. */
router.post(
  '/:mascotaId/pesajes',
  asyncRoute(async (req, res) => {
    const peso = parsePeso(req.body.peso)
    if (peso === null) throw new ValidationError('El peso es obligatorio')
    const row = await prisma.pesaje.create({
      data: {
        mascotaId: req.params.mascotaId,
        peso,
        fecha: req.body.fecha ? new Date(req.body.fecha) : new Date(),
        nota: req.body.nota ?? null,
      },
    })
    res.status(201).json(toPesaje(row))
  })
)

export default router
