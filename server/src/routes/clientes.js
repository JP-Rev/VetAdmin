import { prisma } from '../prisma.js'
import { toCliente } from '../serializers.js'
import { crudRouter } from './crudRouter.js'

const limpio = (v) => (typeof v === 'string' ? v.trim() : '')

const toCreateData = (body) => ({
  nombre: limpio(body.nombre),
  telefono: limpio(body.telefono),
  telefonoAlt: limpio(body.telefono_alt) || null,
  email: limpio(body.email),
  calle: limpio(body.calle) || null,
  numero: limpio(body.numero) || null,
  localidad: limpio(body.localidad) || null,
})

const toUpdateData = (body) => {
  const data = {}
  if (body.nombre !== undefined) data.nombre = limpio(body.nombre)
  if (body.telefono !== undefined) data.telefono = limpio(body.telefono)
  if (body.telefono_alt !== undefined) data.telefonoAlt = limpio(body.telefono_alt) || null
  if (body.email !== undefined) data.email = limpio(body.email)
  if (body.calle !== undefined) data.calle = limpio(body.calle) || null
  if (body.numero !== undefined) data.numero = limpio(body.numero) || null
  if (body.localidad !== undefined) data.localidad = limpio(body.localidad) || null
  return data
}

export default crudRouter({ model: prisma.cliente, serialize: toCliente, toCreateData, toUpdateData })
