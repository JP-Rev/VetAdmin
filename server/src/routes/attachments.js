import { Router } from 'express'
import { prisma } from '../prisma.js'
import { asyncRoute } from '../http.js'
import { removeAttachmentFile } from '../storage.js'

const router = Router()

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const attachment = await prisma.attachment.findUniqueOrThrow({ where: { id: req.params.id } })
    res.setHeader('Content-Type', attachment.mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.originalName)}"`)
    res.sendFile(attachment.storedPath, (err) => {
      if (err && !res.headersSent) res.status(404).json({ error: 'Archivo no encontrado' })
    })
  })
)

router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const attachment = await prisma.attachment.delete({ where: { id: req.params.id } })
    removeAttachmentFile(attachment.storedPath)
    res.status(204).end()
  })
)

export default router
