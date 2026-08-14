export const ESPECIES = ['Perro', 'Gato', 'Ave', 'Roedor', 'Reptil', 'Otro']
export const SEXOS = ['Macho', 'Hembra']
export const ESTADOS_VENTA = ['Pendiente', 'Pagada', 'Cancelada']
export const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta']
export const TIPOS_EVENTO_HISTORIAL = [
  'Consulta General',
  'Cirugía Realizada',
  'Tratamiento Aplicado',
  'Enfermedad Registrada',
  'Vacunación',
]
export const CATEGORIAS_GASTO = [
  'Suministros Médicos',
  'Alquiler/Hipoteca',
  'Servicios Públicos (Luz, Agua)',
  'Salarios y Honorarios',
  'Marketing y Publicidad',
  'Mantenimiento y Reparaciones',
  'Limpieza',
  'Equipamiento Nuevo/Usado',
  'Impuestos y Licencias',
  'Seguros',
  'Capacitación y Desarrollo',
  'Software y Suscripciones',
  'Gastos Varios',
]
export const ESTADOS_TURNO = ['Pendiente', 'Atendido', 'Ausente', 'Cancelado']

export class ValidationError extends Error {}

export function assertOneOf(value, allowed, fieldName) {
  if (value === undefined) return
  if (!allowed.includes(value)) {
    throw new ValidationError(`${fieldName} inválido: ${value}`)
  }
}
