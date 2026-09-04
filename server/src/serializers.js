const dateOnly = (value) => new Date(value).toISOString().slice(0, 10)
const epoch = (value) => new Date(value).getTime()

export const toCliente = (c) => ({
  id_cliente: c.id,
  nombre: c.nombre,
  telefono: c.telefono,
  telefono_alt: c.telefonoAlt ?? '',
  email: c.email ?? '',
  calle: c.calle ?? '',
  numero: c.numero ?? '',
  localidad: c.localidad ?? '',
  createdAt: dateOnly(c.createdAt),
  lastModified: epoch(c.updatedAt),
})

export const toRaza = (r) => ({
  id_raza: r.id,
  nombre: r.nombre,
  especie: r.especie,
})

export const toMascota = (m) => ({
  id_mascota: m.id,
  nombre: m.nombre,
  especie: m.especie,
  raza_id: m.razaId ?? '',
  id_cliente: m.clienteId ?? '',
  fecha_nacimiento: dateOnly(m.fechaNacimiento),
  sexo: m.sexo,
  createdAt: dateOnly(m.createdAt),
  lastModified: epoch(m.updatedAt),
})

export const toPesaje = (p) => ({
  id_pesaje: p.id,
  mascota_id: p.mascotaId,
  fecha: dateOnly(p.fecha),
  peso: p.peso,
  nota: p.nota ?? '',
})

export const toEnfermedad = (e) => ({
  id_enfermedad: e.id,
  nombre: e.nombre,
  descripcion: e.descripcion,
  especie_afectada: e.especieAfectada ?? undefined,
})

export const toCirugia = (c) => ({
  id_cirugia: c.id,
  tipo: c.tipo,
  descripcion: c.descripcion,
  duracion_estimada_min: c.duracionEstimadaMin,
  costo_estimado: c.costoEstimado,
})

export const toCategoriaProducto = (c) => ({
  id_categoria: c.id,
  nombre: c.nombre,
  descripcion: c.descripcion ?? '',
  activa: c.activa,
})

export const toProducto = (p) => ({
  id_producto: p.id,
  nombre: p.nombre,
  stock: p.stock,
  precio: p.precio,
  categoria: p.categoria,
  categoria_id: p.categoriaId ?? undefined,
  lastModified: epoch(p.updatedAt),
})

export const toTurno = (t) => ({
  id_turno: t.id,
  fecha: dateOnly(t.fecha),
  hora: t.hora,
  cliente_id: t.clienteId ?? '',
  mascota_id: t.mascotaId ?? '',
  motivo: t.motivo,
  estado: t.estado,
  lastModified: epoch(t.updatedAt),
})

export const toVenta = (v) => ({
  id_venta: v.id,
  fecha: v.fecha.toISOString(),
  cliente_id: v.clienteId ?? '',
  mascota_id: v.mascotaId ?? undefined,
  productos: (v.productos ?? []).map((vp) => ({
    producto_id: vp.productoId,
    cantidad: vp.cantidad,
    precio_unitario: vp.precioUnitario,
  })),
  total: v.total,
  estado: v.estado,
  lastModified: epoch(v.updatedAt),
})

export const toPago = (p) => ({
  id_pago: p.id,
  venta_id: p.ventaId,
  monto: p.monto,
  fecha: p.fecha.toISOString(),
  metodo: p.metodo,
  lastModified: epoch(p.createdAt),
})

export const toAttachment = (a) => ({
  id: a.id,
  name: a.originalName,
  type: a.mimeType,
  size: a.sizeBytes,
  url: `/api/attachments/${a.id}`,
})

export const toHistorialMedico = (h) => ({
  id_evento: h.id,
  mascota_id: h.mascotaId,
  fecha: h.fecha.toISOString(),
  tipo_evento: h.tipoEvento,
  descripcion: h.descripcion,
  referencia_id: h.referenciaId ?? undefined,
  attachments: (h.attachments ?? []).map(toAttachment),
  lastModified: epoch(h.updatedAt),
})

export const toMascotaEnfermedad = (me) => ({
  id_mascota_enfermedad: me.id,
  mascota_id: me.mascotaId,
  enfermedad_id: me.enfermedadId,
  fecha_diagnostico: dateOnly(me.fechaDiagnostico),
  observaciones: me.observaciones ?? '',
  lastModified: epoch(me.updatedAt),
})

export const toMascotaCirugia = (mc) => ({
  id_mascota_cirugia: mc.id,
  mascota_id: mc.mascotaId,
  cirugia_id: mc.cirugiaId,
  fecha: dateOnly(mc.fecha),
  observaciones: mc.observaciones ?? '',
  costo_final: mc.costoFinal ?? undefined,
  lastModified: epoch(mc.updatedAt),
})

export const toGasto = (g) => ({
  id_gasto: g.id,
  fecha: dateOnly(g.fecha),
  descripcion: g.descripcion,
  monto: g.monto,
  categoria: g.categoria,
  lastModified: epoch(g.updatedAt),
})

export const CLINICA_ID = 'default'

export const toClinica = (c) => ({
  nombre: c.nombre,
  direccion: c.direccion ?? '',
  telefono: c.telefono ?? '',
  email: c.email ?? '',
})

// La fila singleton se crea al primer acceso, para que la app nunca vea null.
export const getClinica = async () => {
  const { prisma } = await import('./prisma.js')
  return prisma.clinica.upsert({
    where: { id: CLINICA_ID },
    create: { id: CLINICA_ID },
    update: {},
  })
}
