import { prisma } from '../prisma.js'
import { toCliente } from '../serializers.js'
import { crudRouter } from './crudRouter.js'

const toCreateData = (body) => ({
  nombre: body.nombre,
  telefono: body.telefono,
  email: body.email ?? '',
  domicilio: body.domicilio ?? '',
})

const toUpdateData = (body) => {
  const data = {}
  if (body.nombre !== undefined) data.nombre = body.nombre
  if (body.telefono !== undefined) data.telefono = body.telefono
  if (body.email !== undefined) data.email = body.email
  if (body.domicilio !== undefined) data.domicilio = body.domicilio
  return data
}

export default crudRouter({ model: prisma.cliente, serialize: toCliente, toCreateData, toUpdateData })
