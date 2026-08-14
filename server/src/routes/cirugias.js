import { prisma } from '../prisma.js'
import { toCirugia } from '../serializers.js'
import { crudRouter } from './crudRouter.js'

const toCreateData = (body) => ({
  tipo: body.tipo,
  descripcion: body.descripcion,
  duracionEstimadaMin: body.duracion_estimada_min,
  costoEstimado: body.costo_estimado,
})

const toUpdateData = (body) => {
  const data = {}
  if (body.tipo !== undefined) data.tipo = body.tipo
  if (body.descripcion !== undefined) data.descripcion = body.descripcion
  if (body.duracion_estimada_min !== undefined) data.duracionEstimadaMin = body.duracion_estimada_min
  if (body.costo_estimado !== undefined) data.costoEstimado = body.costo_estimado
  return data
}

export default crudRouter({ model: prisma.cirugia, serialize: toCirugia, toCreateData, toUpdateData })
