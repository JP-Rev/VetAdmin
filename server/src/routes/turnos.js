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

/**
 * ¿Se movió el turno de día u hora?
 *
 * Se compara contra lo guardado y no alcanza con mirar si `fecha`/`hora` vienen
 * en el body: el formulario de edición los manda siempre, incluso cuando se
 * cambió sólo el motivo. Limpiar las marcas a ciegas mandaría un recordatorio
 * repetido en cada edición.
 */
export const seReprogramo = (data, actual) => {
  if (!actual) return false
  const cambioFecha =
    data.fecha !== undefined && data.fecha.getTime() !== new Date(actual.fecha).getTime()
  const cambioHora = data.hora !== undefined && data.hora !== actual.hora
  return cambioFecha || cambioHora
}

const toUpdateData = (body, actual) => {
  assertOneOf(body.estado, ESTADOS_TURNO, 'estado')
  const data = {}
  if (body.fecha !== undefined) data.fecha = new Date(body.fecha)
  if (body.hora !== undefined) data.hora = body.hora
  if (body.cliente_id !== undefined) data.clienteId = body.cliente_id || null
  if (body.mascota_id !== undefined) data.mascotaId = body.mascota_id || null
  if (body.motivo !== undefined) data.motivo = body.motivo
  if (body.estado !== undefined) data.estado = body.estado

  // Turno reprogramado: los avisos ya mandados eran del horario viejo, así que
  // se borran las marcas y el cliente recibe el recordatorio del nuevo. Sin
  // esto, quien reprograma no recibe ningún aviso -- justo el caso donde más
  // falta hace.
  if (seReprogramo(data, actual)) {
    data.recordatorioEnviadoAt = null
    data.recordatorioDiaAnteriorEnviadoAt = null
  }

  return data
}

export default crudRouter({
  model: prisma.turno,
  serialize: toTurno,
  toCreateData,
  toUpdateData,
  loadCurrent: true,
})
