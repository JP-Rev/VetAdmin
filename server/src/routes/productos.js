import { prisma } from '../prisma.js'
import { toProducto } from '../serializers.js'
import { crudRouter } from './crudRouter.js'

const toCreateData = (body) => ({
  nombre: body.nombre,
  stock: body.stock,
  precio: body.precio,
  categoria: body.categoria,
  categoriaId: body.categoria_id ?? null,
})

const toUpdateData = (body) => {
  const data = {}
  if (body.nombre !== undefined) data.nombre = body.nombre
  if (body.stock !== undefined) data.stock = body.stock
  if (body.precio !== undefined) data.precio = body.precio
  if (body.categoria !== undefined) data.categoria = body.categoria
  if (body.categoria_id !== undefined) data.categoriaId = body.categoria_id
  return data
}

export default crudRouter({ model: prisma.producto, serialize: toProducto, toCreateData, toUpdateData })
