import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { login, logout, me, requireAuth, attachUserIfPresent } from './auth.js'
import { errorHandler } from './http.js'

import bootstrapRouter from './routes/bootstrap.js'
import clientesRouter from './routes/clientes.js'
import mascotasRouter from './routes/mascotas.js'
import turnosRouter from './routes/turnos.js'
import productosRouter from './routes/productos.js'
import categoriasProductosRouter from './routes/categoriasProductos.js'
import razasRouter from './routes/razas.js'
import enfermedadesRouter from './routes/enfermedades.js'
import cirugiasRouter from './routes/cirugias.js'
import gastosRouter from './routes/gastos.js'
import ventasRouter from './routes/ventas.js'
import historialMedicoRouter from './routes/historialMedico.js'
import attachmentsRouter from './routes/attachments.js'
import pesajesRouter from './routes/pesajes.js'
import clinicaRouter from './routes/clinica.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json({ limit: '2mb' }))
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  app.post('/api/auth/login', login)
  app.post('/api/auth/logout', logout)
  app.get('/api/auth/me', attachUserIfPresent, me)

  app.use('/api/bootstrap', requireAuth, bootstrapRouter)
  app.use('/api/clientes', requireAuth, clientesRouter)
  app.use('/api/mascotas', requireAuth, mascotasRouter)
  app.use('/api/turnos', requireAuth, turnosRouter)
  app.use('/api/productos', requireAuth, productosRouter)
  app.use('/api/categorias-productos', requireAuth, categoriasProductosRouter)
  app.use('/api/razas', requireAuth, razasRouter)
  app.use('/api/enfermedades', requireAuth, enfermedadesRouter)
  app.use('/api/cirugias', requireAuth, cirugiasRouter)
  app.use('/api/gastos', requireAuth, gastosRouter)
  app.use('/api/ventas', requireAuth, ventasRouter)
  app.use('/api/historial-medico', requireAuth, historialMedicoRouter)
  app.use('/api/attachments', requireAuth, attachmentsRouter)
  app.use('/api/pesajes', requireAuth, pesajesRouter)
  app.use('/api/clinica', requireAuth, clinicaRouter)

  app.use(errorHandler)

  return app
}
