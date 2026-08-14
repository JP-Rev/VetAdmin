import { Router } from 'express'
import { prisma } from '../prisma.js'
import { toVenta, toPago } from '../serializers.js'
import { asyncRoute } from '../http.js'
import { assertOneOf, ESTADOS_VENTA, METODOS_PAGO, ValidationError } from '../validators.js'

const router = Router()

router.post(
  '/',
  asyncRoute(async (req, res) => {
    const { cliente_id, mascota_id, productos } = req.body
    if (!Array.isArray(productos) || productos.length === 0) {
      throw new ValidationError('La venta debe incluir al menos un producto')
    }

    const venta = await prisma.$transaction(async (tx) => {
      let total = 0
      const lineItems = []
      for (const item of productos) {
        const producto = await tx.producto.findUniqueOrThrow({ where: { id: item.producto_id } })
        if (producto.stock < item.cantidad) {
          throw new ValidationError(`Stock insuficiente para ${producto.nombre}`)
        }
        total += producto.precio * item.cantidad
        lineItems.push({ productoId: producto.id, cantidad: item.cantidad, precioUnitario: producto.precio })
        await tx.producto.update({
          where: { id: producto.id },
          data: { stock: { decrement: item.cantidad } },
        })
      }

      return tx.venta.create({
        data: {
          clienteId: cliente_id,
          mascotaId: mascota_id || null,
          total: Math.round(total * 100) / 100,
          estado: 'Pendiente',
          productos: { create: lineItems },
        },
        include: { productos: true },
      })
    })

    res.status(201).json(toVenta(venta))
  })
)

router.patch(
  '/:id/estado',
  asyncRoute(async (req, res) => {
    assertOneOf(req.body.estado, ESTADOS_VENTA, 'estado')
    const venta = await prisma.venta.update({
      where: { id: req.params.id },
      data: { estado: req.body.estado },
      include: { productos: true },
    })
    res.json(toVenta(venta))
  })
)

router.post(
  '/:id/pagos',
  asyncRoute(async (req, res) => {
    assertOneOf(req.body.metodo, METODOS_PAGO, 'metodo')
    const monto = Number(req.body.monto)

    const pago = await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUniqueOrThrow({
        where: { id: req.params.id },
        include: { pagos: true },
      })
      const created = await tx.pago.create({
        data: { ventaId: venta.id, monto, metodo: req.body.metodo },
      })
      const totalPaid = venta.pagos.reduce((sum, p) => sum + p.monto, 0) + monto
      if (totalPaid >= venta.total && venta.estado !== 'Pagada') {
        await tx.venta.update({ where: { id: venta.id }, data: { estado: 'Pagada' } })
      }
      return created
    })

    res.status(201).json(toPago(pago))
  })
)

export default router
