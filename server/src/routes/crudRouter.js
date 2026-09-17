import { Router } from 'express'
import { asyncRoute } from '../http.js'

export function crudRouter({ model, serialize, toCreateData, toUpdateData, loadCurrent = false }) {
  const router = Router()

  router.post(
    '/',
    asyncRoute(async (req, res) => {
      const row = await model.create({ data: toCreateData(req.body) })
      res.status(201).json(serialize(row))
    })
  )

  router.put(
    '/:id',
    asyncRoute(async (req, res) => {
      // Algunos recursos necesitan comparar contra lo guardado para decidir el
      // update (turnos: si cambia fecha u hora hay que rehabilitar los
      // recordatorios). Se lee sólo cuando el recurso lo pide, para no sumarle
      // un SELECT a todos los demás.
      //
      // `findUnique` y no `findUniqueOrThrow` a propósito: si el id no existe,
      // el que tira P2025 (y con él el 404) sigue siendo el `update`, igual que
      // antes de que esto existiera.
      const actual = loadCurrent ? await model.findUnique({ where: { id: req.params.id } }) : null
      const row = await model.update({
        where: { id: req.params.id },
        data: toUpdateData(req.body, actual),
      })
      res.json(serialize(row))
    })
  )

  router.delete(
    '/:id',
    asyncRoute(async (req, res) => {
      await model.delete({ where: { id: req.params.id } })
      res.status(204).end()
    })
  )

  return router
}
