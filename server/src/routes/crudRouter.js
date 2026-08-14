import { Router } from 'express'
import { asyncRoute } from '../http.js'

export function crudRouter({ model, serialize, toCreateData, toUpdateData }) {
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
      const row = await model.update({
        where: { id: req.params.id },
        data: toUpdateData(req.body),
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
