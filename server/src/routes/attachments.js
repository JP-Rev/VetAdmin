import { Router } from 'express'
import { prisma } from '../prisma.js'
import { asyncRoute } from '../http.js'
import { removeAttachmentFile } from '../storage.js'
import { requirePasswordConfirmation } from '../auth.js'

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

/**
 * Borrar un adjunto exige reingresar la contraseña del usuario logueado: es
 * destructivo e irreversible (borra tambien el archivo del disco), asi que no
 * alcanza con tener la sesion abierta.
 */
router.delete(
  '/:id',
  asyncRoute(requirePasswordConfirmation),
  asyncRoute(async (req, res) => {
    const attachment = await prisma.attachment.delete({ where: { id: req.params.id } })
    removeAttachmentFile(attachment.storedPath)
    res.status(204).end()
  })
)

export default router
