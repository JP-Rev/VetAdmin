import { Router } from 'express'
import { prisma } from '../prisma.js'
import { toHistorialMedico } from '../serializers.js'
import { crudRouter } from './crudRouter.js'
import { asyncRoute } from '../http.js'
import { assertOneOf, TIPOS_EVENTO_HISTORIAL, ValidationError } from '../validators.js'
import { uploadAttachment } from '../storage.js'

const includeAttachments = { include: { attachments: true } }

const toCreateData = (body) => {
  assertOneOf(body.tipo_evento, TIPOS_EVENTO_HISTORIAL, 'tipo_evento')
  return {
    mascotaId: body.mascota_id,
    fecha: body.fecha ? new Date(body.fecha) : new Date(),
    tipoEvento: body.tipo_evento,
    descripcion: body.descripcion,
    referenciaId: body.referencia_id ?? null,
  }
}

const toUpdateData = (body) => {
  const data = {}
  if (body.fecha !== undefined) data.fecha = new Date(body.fecha)
  if (body.descripcion !== undefined) data.descripcion = body.descripcion
  return data
}

const router = crudRouter({
  model: {
    create: (args) => prisma.historialMedico.create({ ...args, ...includeAttachments }),
    update: (args) => prisma.historialMedico.update({ ...args, ...includeAttachments }),
    delete: (args) => prisma.historialMedico.delete(args),
  },
  serialize: toHistorialMedico,
  toCreateData,
  toUpdateData,
})

const loadMascotaIdForHistorial = asyncRoute(async (req, _res, next) => {
  const historial = await prisma.historialMedico.findUniqueOrThrow({ where: { id: req.params.id } })
  req.mascotaId = historial.mascotaId
  next()
})

router.post(
  '/:id/attachments',
  loadMascotaIdForHistorial,
  uploadAttachment.single('file'),
  asyncRoute(async (req, res) => {
    if (!req.file) throw new ValidationError('Archivo requerido')
    const attachment = await prisma.attachment.create({
      data: {
        historialId: req.params.id,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        storedPath: req.file.path,
      },
    })
    res.status(201).json({
      id: attachment.id,
      name: attachment.originalName,
      type: attachment.mimeType,
      size: attachment.sizeBytes,
      url: `/api/attachments/${attachment.id}`,
    })
  })
)

export default router
