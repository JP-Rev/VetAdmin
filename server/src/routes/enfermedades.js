import { prisma } from '../prisma.js'
import { toEnfermedad } from '../serializers.js'
import { crudRouter } from './crudRouter.js'
import { assertOneOf, ESPECIES } from '../validators.js'

const toCreateData = (body) => {
  assertOneOf(body.especie_afectada, ESPECIES, 'especie_afectada')
  return {
    nombre: body.nombre,
    descripcion: body.descripcion,
    especieAfectada: body.especie_afectada ?? null,
  }
}

const toUpdateData = (body) => {
  assertOneOf(body.especie_afectada, ESPECIES, 'especie_afectada')
  const data = {}
  if (body.nombre !== undefined) data.nombre = body.nombre
  if (body.descripcion !== undefined) data.descripcion = body.descripcion
  if (body.especie_afectada !== undefined) data.especieAfectada = body.especie_afectada
  return data
}

export default crudRouter({ model: prisma.enfermedad, serialize: toEnfermedad, toCreateData, toUpdateData })
