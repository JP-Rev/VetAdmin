export enum Especie {
  PERRO = 'Perro',
  GATO = 'Gato',
  AVE = 'Ave',
  ROEDOR = 'Roedor',
  REPTIL = 'Reptil',
  OTRO = 'Otro',
}

export enum SexoMascota {
  MACHO = 'Macho',
  HEMBRA = 'Hembra',
}

export enum EstadoVenta {
  PENDIENTE = 'Pendiente',
  PAGADA = 'Pagada',
  CANCELADA = 'Cancelada',
}

export enum MetodoPago {
  EFECTIVO = 'Efectivo',
  TRANSFERENCIA = 'Transferencia',
  TARJETA = 'Tarjeta',
}

export enum TipoEventoHistorial {
  CONSULTA = 'Consulta General', 
  CIRUGIA = 'Cirugía Realizada',
  TRATAMIENTO = 'Tratamiento Aplicado',
  ENFERMEDAD_REGISTRADA = 'Enfermedad Registrada',
  VACUNACION = 'Vacunación',
}

export enum CategoriaGasto {
  SUMINISTROS = 'Suministros Médicos',
  ALQUILER = 'Alquiler/Hipoteca',
  SERVICIOS = 'Servicios Públicos (Luz, Agua)',
  SALARIOS = 'Salarios y Honorarios',
  MARKETING = 'Marketing y Publicidad',
  MANTENIMIENTO = 'Mantenimiento y Reparaciones',
  LIMPIEZA = 'Limpieza',
  EQUIPAMIENTO = 'Equipamiento Nuevo/Usado',
  IMPUESTOS = 'Impuestos y Licencias',
  SEGUROS = 'Seguros',
  CAPACITACION = 'Capacitación y Desarrollo',
  SOFTWARE = 'Software y Suscripciones',
  VARIOS = 'Gastos Varios',
}

export enum EstadoTurno {
  PENDIENTE = 'Pendiente',
  ATENDIDO = 'Atendido',
  AUSENTE = 'Ausente',
  CANCELADO = 'Cancelado',
}

export interface Cliente {
  id_cliente: string;
  nombre: string;
  telefono: string;
  email: string;
  domicilio: string;
  lastModified: number;
}

export interface Raza {
  id_raza: string;
  nombre: string;
  especie: Especie; 
}

export interface Mascota {
  id_mascota: string;
  nombre: string;
  especie: Especie;
  raza_id: string; 
  id_cliente: string; 
  fecha_nacimiento: string; 
  sexo: SexoMascota;
  lastModified: number;
}

export interface Enfermedad {
  id_enfermedad: string;
  nombre: string;
  descripcion: string;
  especie_afectada?: Especie; 
}

export interface MascotaEnfermedad {
  id_mascota_enfermedad: string;
  mascota_id: string; 
  enfermedad_id: string; 
  fecha_diagnostico: string; 
  observaciones: string;
  lastModified: number;
}

export interface Cirugia {
  id_cirugia: string;
  tipo: string;
  descripcion: string;
  duracion_estimada_min: number; 
  costo_estimado: number;
}

export interface MascotaCirugia {
  id_mascota_cirugia: string;
  mascota_id: string; 
  cirugia_id: string; 
  fecha: string; 
  observaciones: string;
  costo_final?: number;
  lastModified: number;
}

export interface CategoriaProducto {
  id_categoria: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
}

export interface Producto {
  id_producto: string;
  nombre: string;
  stock: number;
  precio: number;
  categoria: string; // Mantener para compatibilidad
  categoria_id?: string; // Nueva referencia a categoría
  lastModified: number;
}

export interface VentaProducto {
  producto_id: string; 
  cantidad: number;
  precio_unitario: number; 
}

// Specific type for receipts that includes product name
export interface ReceiptVentaProducto extends VentaProducto {
  nombre: string;
}

export interface Venta {
  id_venta: string;
  fecha: string; 
  cliente_id: string; 
  mascota_id?: string; 
  productos: VentaProducto[];
  total: number;
  estado: EstadoVenta;
  lastModified: number;
}

export interface Pago {
  id_pago: string;
  venta_id: string;
  monto: number;
  fecha: string; 
  metodo: MetodoPago;
  lastModified: number;
}

export interface Turno {
  id_turno: string;
  fecha: string; 
  hora: string; 
  cliente_id: string; 
  mascota_id: string; 
  motivo: string;
  estado: EstadoTurno; 
  lastModified: number;
}

export interface AttachmentFile {
  id: string;
  name: string;
  type: string; // MIME type
  dataUrl: string; // Base64 encoded file content
  size: number; // File size in bytes
}

export interface HistorialMedico {
  id_evento: string;
  mascota_id: string; 
  fecha: string; 
  tipo_evento: TipoEventoHistorial;
  descripcion: string; 
  referencia_id?: string; 
  attachments?: AttachmentFile[];
  lastModified: number;
}

export interface Gasto {
  id_gasto: string;
  fecha: string; 
  descripcion: string;
  monto: number;
  categoria: CategoriaGasto;
  lastModified: number;
}

export interface ConsultationDiseaseItem {
  id: string; 
  diseaseId: string;
  notes: string;
}
export interface ConsultationSurgeryItem {
  id: string; 
  surgeryId: string;
  notes: string;
  cost?: string;
}
export interface ConsultationVaccinationItem {
  id: string; 
  vaccineName: string;
  notes: string;
}

export interface ConsultationFormState {
  mainDescription: string;
  eventDate: string;
  diseases: ConsultationDiseaseItem[];
  surgeries: ConsultationSurgeryItem[];
  vaccinations: ConsultationVaccinationItem[];
  attachments: AttachmentFile[];
}

export interface DailyCashFlowReportDetails {
  incomeByMethod: {
    [key in MetodoPago]?: number;
  };
  totalIncome: number;
  expensesByCategory: {
    [key in CategoriaGasto]?: number;
  };
  totalExpenses: number;
  netBalance: number;
  date: string; // YYYY-MM-DD
}

export type ClienteForm = Omit<Cliente, 'id_cliente' | 'lastModified'>;
export type MascotaForm = Omit<Mascota, 'id_mascota' | 'lastModified'>;
export type TurnoForm = Omit<Turno, 'id_turno' | 'lastModified' | 'estado'>; 
export type ProductoForm = Omit<Producto, 'id_producto' | 'lastModified'>;
export type VentaFormValues = {
  cliente_id: string;
  mascota_id?: string;
  productos: Array<{ producto_id: string; cantidad: number }>;
};
export type EnfermedadForm = Omit<Enfermedad, 'id_enfermedad'>;
export type CirugiaForm = Omit<Cirugia, 'id_cirugia'>;
export type RazaForm = Omit<Raza, 'id_raza'>;
export type GastoForm = Omit<Gasto, 'id_gasto' | 'lastModified'>;
export type CategoriaProductoForm = Omit<CategoriaProducto, 'id_categoria'>;