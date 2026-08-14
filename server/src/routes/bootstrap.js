import { Router } from 'express'
import { prisma } from '../prisma.js'
import { asyncRoute } from '../http.js'
import {
  toCliente,
  toMascota,
  toTurno,
  toProducto,
  toCategoriaProducto,
  toVenta,
  toPago,
  toHistorialMedico,
  toRaza,
  toEnfermedad,
  toCirugia,
  toMascotaEnfermedad,
  toMascotaCirugia,
  toGasto,
} from '../serializers.js'

const router = Router()

router.get(
  '/',
  asyncRoute(async (_req, res) => {
    const [
      clientes,
      mascotas,
      turnos,
      productos,
      categoriasProductos,
      ventas,
      pagos,
      historialMedico,
      razas,
      enfermedades,
      cirugias,
      mascotaEnfermedades,
      mascotaCirugias,
      gastos,
    ] = await Promise.all([
      prisma.cliente.findMany({ orderBy: { nombre: 'asc' } }),
      prisma.mascota.findMany({ orderBy: { nombre: 'asc' } }),
      prisma.turno.findMany({ orderBy: { fecha: 'desc' } }),
      prisma.producto.findMany({ orderBy: { nombre: 'asc' } }),
      prisma.categoriaProducto.findMany({ orderBy: { nombre: 'asc' } }),
      prisma.venta.findMany({ orderBy: { fecha: 'desc' }, include: { productos: true } }),
      prisma.pago.findMany({ orderBy: { fecha: 'desc' } }),
      prisma.historialMedico.findMany({ orderBy: { fecha: 'desc' }, include: { attachments: true } }),
      prisma.raza.findMany({ orderBy: { nombre: 'asc' } }),
      prisma.enfermedad.findMany({ orderBy: { nombre: 'asc' } }),
      prisma.cirugia.findMany({ orderBy: { tipo: 'asc' } }),
      prisma.mascotaEnfermedad.findMany(),
      prisma.mascotaCirugia.findMany(),
      prisma.gasto.findMany({ orderBy: { fecha: 'desc' } }),
    ])

    res.json({
      clientes: clientes.map(toCliente),
      mascotas: mascotas.map(toMascota),
      turnos: turnos.map(toTurno),
      productos: productos.map(toProducto),
      categoriasProductos: categoriasProductos.map(toCategoriaProducto),
      ventas: ventas.map(toVenta),
      pagos: pagos.map(toPago),
      historialMedico: historialMedico.map(toHistorialMedico),
      razas: razas.map(toRaza),
      enfermedades: enfermedades.map(toEnfermedad),
      cirugias: cirugias.map(toCirugia),
      mascotaEnfermedades: mascotaEnfermedades.map(toMascotaEnfermedad),
      mascotaCirugias: mascotaCirugias.map(toMascotaCirugia),
      gastos: gastos.map(toGasto),
    })
  })
)

export default router
