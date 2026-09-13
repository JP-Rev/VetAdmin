import { ValidationError } from './validators.js'

export const asyncRoute = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err))
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message })
  }
  // Sin esto un schema de zod que no valida terminaba en el 500 generico de
  // abajo, y el mensaje util ("Email inválido") no llegaba nunca al front.
  if (err?.name === 'ZodError' && Array.isArray(err.issues)) {
    return res.status(400).json({ error: err.issues[0]?.message || 'Datos inválidos' })
  }
  if (err?.code === 'P2025') {
    return res.status(404).json({ error: 'No encontrado' })
  }
  if (err?.code === 'P2003') {
    return res.status(400).json({ error: 'Referencia inválida' })
  }
  if (err?.code?.startsWith?.('P')) {
    return res.status(400).json({ error: err.message })
  }
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
}
