import { prisma } from '../prisma.js'
import { toCategoriaProducto } from '../serializers.js'
import { crudRouter } from './crudRouter.js'

const toCreateData = (body) => ({
  nombre: body.nombre,
  descripcion: body.descripcion ?? '',
  activa: body.activa ?? true,
})

const toUpdateData = (body) => {
  const data = {}
  if (body.nombre !== undefined) data.nombre = body.nombre
  if (body.descripcion !== undefined) data.descripcion = body.descripcion
  if (body.activa !== undefined) data.activa = body.activa
  return data
}

export default crudRouter({
  model: prisma.categoriaProducto,
  serialize: toCategoriaProducto,
  toCreateData,
  toUpdateData,
})
