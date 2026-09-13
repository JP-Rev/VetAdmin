import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import {
  login, logout, me, requireAuth, attachUserIfPresent, forgotPassword, resetPassword,
} from './auth.js'
import { errorHandler } from './http.js'
import { PERMISOS, requirePermiso } from './permisos.js'

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
import usuariosRouter from './routes/usuarios.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json({ limit: '2mb' }))
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  app.post('/api/auth/login', login)
  app.post('/api/auth/logout', logout)
  app.get('/api/auth/me', attachUserIfPresent, me)
  // Sin requireAuth a proposito: a estas dos se llega justamente cuando no se
  // puede iniciar sesion.
  app.post('/api/auth/forgot-password', forgotPassword)
  app.post('/api/auth/reset-password', resetPassword)

  // Modulos con permiso propio. El chequeo va acá y no solo en el front:
  // esconder una opcion del menu no impide llamar al endpoint a mano.
  const general = requirePermiso(PERMISOS.GENERAL)
  const comercial = requirePermiso(PERMISOS.COMERCIAL)

  app.use('/api/usuarios', requireAuth, requirePermiso(PERMISOS.USUARIOS), usuariosRouter)

  // bootstrap es la carga inicial de toda la app: pide sesion pero no modulo.
  // Lo que devuelve de mas, el front no lo muestra.
  app.use('/api/bootstrap', requireAuth, bootstrapRouter)

  app.use('/api/clientes', requireAuth, general, clientesRouter)
  app.use('/api/mascotas', requireAuth, general, mascotasRouter)
  app.use('/api/turnos', requireAuth, general, turnosRouter)

  app.use('/api/productos', requireAuth, comercial, productosRouter)
  app.use('/api/gastos', requireAuth, comercial, gastosRouter)

  // Catalogos: sin permiso propio a proposito. Sin razas no se puede dar de
  // alta una mascota, sin enfermedades ni cirugias no se puede cargar una
  // consulta, y las categorias las usa el alta de productos.
  app.use('/api/categorias-productos', requireAuth, categoriasProductosRouter)
  app.use('/api/razas', requireAuth, razasRouter)
  app.use('/api/enfermedades', requireAuth, enfermedadesRouter)
  app.use('/api/cirugias', requireAuth, cirugiasRouter)
  app.use('/api/ventas', requireAuth, comercial, ventasRouter)

  // La historia clinica, los adjuntos y los pesajes son la ficha de la
  // mascota: van con General, igual que Mascotas.
  app.use('/api/historial-medico', requireAuth, general, historialMedicoRouter)
  app.use('/api/attachments', requireAuth, general, attachmentsRouter)
  app.use('/api/pesajes', requireAuth, general, pesajesRouter)

  // El GET de clinica queda abierto: el nombre de la veterinaria se muestra en
  // el sidebar y en el dashboard de cualquiera. El permiso protege la edicion.
  app.use('/api/clinica', requireAuth, clinicaRouter)

  app.use(errorHandler)

  return app
}
