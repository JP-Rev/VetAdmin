import { Router } from 'express'
import bcrypt from 'bcryptjs'
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

/**
 * Borrar un adjunto exige reingresar la contraseña del usuario logueado: es
 * destructivo e irreversible (borra tambien el archivo del disco), asi que no
 * alcanza con tener la sesion abierta.
 */
router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const password = req.body?.password
    if (typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'Ingresá tu contraseña para confirmar' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(403).json({ error: 'Contraseña incorrecta' })
    }

    const attachment = await prisma.attachment.delete({ where: { id: req.params.id } })
    removeAttachmentFile(attachment.storedPath)
    res.status(204).end()
  })
)

export default router
