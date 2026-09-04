import { Router } from 'express'
import { prisma } from '../prisma.js'
import { asyncRoute } from '../http.js'

const router = Router()

router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    await prisma.pesaje.delete({ where: { id: req.params.id } })
    res.status(204).end()
  })
)

export default router
