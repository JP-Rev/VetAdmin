import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import multer from 'multer'

const DEFAULT_STORAGE_ROOT = '/srv/storage/vetadmin'

export const getStorageRoot = () => path.resolve(process.env.STORAGE_ROOT || DEFAULT_STORAGE_ROOT)

const sanitizeBaseName = (value) =>
  path
    .basename(String(value || 'archivo'))
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .slice(0, 150) || 'archivo'

export function resolveAttachmentDir(mascotaId) {
  const dir = path.join(getStorageRoot(), 'historial', String(mascotaId))
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function resolveAttachmentPath(mascotaId, storedName) {
  const dir = path.join(getStorageRoot(), 'historial', String(mascotaId))
  const resolved = path.join(dir, storedName)
  if (!resolved.startsWith(path.join(getStorageRoot(), 'historial') + path.sep)) {
    throw new Error('Ruta de archivo inválida')
  }
  return resolved
}

export const uploadAttachment = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      try {
        cb(null, resolveAttachmentDir(req.mascotaId))
      } catch (err) {
        cb(err)
      }
    },
    filename: (_req, file, cb) => {
      const uniquePrefix = crypto.randomUUID()
      cb(null, `${uniquePrefix}-${sanitizeBaseName(file.originalname)}`)
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
})

export function removeAttachmentFile(storedPath) {
  fs.rm(storedPath, { force: true }, () => {})
}
