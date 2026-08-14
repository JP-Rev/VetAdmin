import { prisma } from '../prisma.js'
import { toRaza } from '../serializers.js'
import { crudRouter } from './crudRouter.js'
import { assertOneOf, ESPECIES } from '../validators.js'

const toCreateData = (body) => {
  assertOneOf(body.especie, ESPECIES, 'especie')
  return { nombre: body.nombre, especie: body.especie }
}

const toUpdateData = (body) => {
  assertOneOf(body.especie, ESPECIES, 'especie')
  const data = {}
  if (body.nombre !== undefined) data.nombre = body.nombre
  if (body.especie !== undefined) data.especie = body.especie
  return data
}

export default crudRouter({ model: prisma.raza, serialize: toRaza, toCreateData, toUpdateData })
