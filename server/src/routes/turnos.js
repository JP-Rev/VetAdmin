import { prisma } from '../prisma.js'
import { toTurno } from '../serializers.js'
import { crudRouter } from './crudRouter.js'
import { assertOneOf, ESTADOS_TURNO } from '../validators.js'

const toCreateData = (body) => ({
  fecha: new Date(body.fecha),
  hora: body.hora,
  clienteId: body.cliente_id || null,
  mascotaId: body.mascota_id || null,
  motivo: body.motivo,
  estado: 'Pendiente',
})

const toUpdateData = (body) => {
  assertOneOf(body.estado, ESTADOS_TURNO, 'estado')
  const data = {}
  if (body.fecha !== undefined) data.fecha = new Date(body.fecha)
  if (body.hora !== undefined) data.hora = body.hora
  if (body.cliente_id !== undefined) data.clienteId = body.cliente_id || null
  if (body.mascota_id !== undefined) data.mascotaId = body.mascota_id || null
  if (body.motivo !== undefined) data.motivo = body.motivo
  if (body.estado !== undefined) data.estado = body.estado
  return data
}

export default crudRouter({ model: prisma.turno, serialize: toTurno, toCreateData, toUpdateData })
