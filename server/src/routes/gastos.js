import { prisma } from '../prisma.js'
import { toGasto } from '../serializers.js'
import { crudRouter } from './crudRouter.js'
import { assertOneOf, CATEGORIAS_GASTO } from '../validators.js'

const toCreateData = (body) => {
  assertOneOf(body.categoria, CATEGORIAS_GASTO, 'categoria')
  return {
    fecha: new Date(body.fecha),
    descripcion: body.descripcion,
    monto: body.monto,
    categoria: body.categoria,
  }
}

const toUpdateData = (body) => {
  assertOneOf(body.categoria, CATEGORIAS_GASTO, 'categoria')
  const data = {}
  if (body.fecha !== undefined) data.fecha = new Date(body.fecha)
  if (body.descripcion !== undefined) data.descripcion = body.descripcion
  if (body.monto !== undefined) data.monto = body.monto
  if (body.categoria !== undefined) data.categoria = body.categoria
  return data
}

export default crudRouter({ model: prisma.gasto, serialize: toGasto, toCreateData, toUpdateData })
