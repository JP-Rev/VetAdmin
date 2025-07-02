export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categorias_productos: {
        Row: {
          activa: boolean | null
          created_at: string | null
          descripcion: string | null
          id_categoria: string
          nombre: string
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id_categoria?: string
          nombre: string
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id_categoria?: string
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cirugias: {
        Row: {
          costo_estimado: number
          created_at: string | null
          descripcion: string
          duracion_estimada_min: number
          id_cirugia: string
          tipo: string
        }
        Insert: {
          costo_estimado: number
          created_at?: string | null
          descripcion: string
          duracion_estimada_min: number
          id_cirugia?: string
          tipo: string
        }
        Update: {
          costo_estimado?: number
          created_at?: string | null
          descripcion?: string
          duracion_estimada_min?: number
          id_cirugia?: string
          tipo?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          created_at: string | null
          domicilio: string | null
          email: string | null
          id_cliente: string
          nombre: string
          telefono: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domicilio?: string | null
          email?: string | null
          id_cliente?: string
          nombre: string
          telefono: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domicilio?: string | null
          email?: string | null
          id_cliente?: string
          nombre?: string
          telefono?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      enfermedades: {
        Row: {
          created_at: string | null
          descripcion: string
          especie_afectada: Database["public"]["Enums"]["especie_enum"] | null
          id_enfermedad: string
          nombre: string
        }
        Insert: {
          created_at?: string | null
          descripcion: string
          especie_afectada?: Database["public"]["Enums"]["especie_enum"] | null
          id_enfermedad?: string
          nombre: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string
          especie_afectada?: Database["public"]["Enums"]["especie_enum"] | null
          id_enfermedad?: string
          nombre?: string
        }
        Relationships: []
      }
      gastos: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_gasto_enum"]
          created_at: string | null
          descripcion: string
          fecha: string
          id_gasto: string
          monto: number
          updated_at: string | null
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_gasto_enum"]
          created_at?: string | null
          descripcion: string
          fecha: string
          id_gasto?: string
          monto: number
          updated_at?: string | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_gasto_enum"]
          created_at?: string | null
          descripcion?: string
          fecha?: string
          id_gasto?: string
          monto?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      historial_medico: {
        Row: {
          attachments: Json | null
          created_at: string | null
          descripcion: string
          fecha: string
          id_evento: string
          mascota_id: string | null
          referencia_id: string | null
          tipo_evento: Database["public"]["Enums"]["tipo_evento_historial_enum"]
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          descripcion: string
          fecha?: string
          id_evento?: string
          mascota_id?: string | null
          referencia_id?: string | null
          tipo_evento: Database["public"]["Enums"]["tipo_evento_historial_enum"]
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          descripcion?: string
          fecha?: string
          id_evento?: string
          mascota_id?: string | null
          referencia_id?: string | null
          tipo_evento?: Database["public"]["Enums"]["tipo_evento_historial_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historial_medico_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id_mascota"]
          }
        ]
      }
      mascota_cirugias: {
        Row: {
          cirugia_id: string | null
          costo_final: number | null
          created_at: string | null
          fecha: string
          id_mascota_cirugia: string
          mascota_id: string | null
          observaciones: string | null
          updated_at: string | null
        }
        Insert: {
          cirugia_id?: string | null
          costo_final?: number | null
          created_at?: string | null
          fecha: string
          id_mascota_cirugia?: string
          mascota_id?: string | null
          observaciones?: string | null
          updated_at?: string | null
        }
        Update: {
          cirugia_id?: string | null
          costo_final?: number | null
          created_at?: string | null
          fecha?: string
          id_mascota_cirugia?: string
          mascota_id?: string | null
          observaciones?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mascota_cirugias_cirugia_id_fkey"
            columns: ["cirugia_id"]
            isOneToOne: false
            referencedRelation: "cirugias"
            referencedColumns: ["id_cirugia"]
          },
          {
            foreignKeyName: "mascota_cirugias_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id_mascota"]
          }
        ]
      }
      mascota_enfermedades: {
        Row: {
          created_at: string | null
          enfermedad_id: string | null
          fecha_diagnostico: string
          id_mascota_enfermedad: string
          mascota_id: string | null
          observaciones: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enfermedad_id?: string | null
          fecha_diagnostico: string
          id_mascota_enfermedad?: string
          mascota_id?: string | null
          observaciones?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enfermedad_id?: string | null
          fecha_diagnostico?: string
          id_mascota_enfermedad?: string
          mascota_id?: string | null
          observaciones?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mascota_enfermedades_enfermedad_id_fkey"
            columns: ["enfermedad_id"]
            isOneToOne: false
            referencedRelation: "enfermedades"
            referencedColumns: ["id_enfermedad"]
          },
          {
            foreignKeyName: "mascota_enfermedades_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id_mascota"]
          }
        ]
      }
      mascotas: {
        Row: {
          created_at: string | null
          especie: Database["public"]["Enums"]["especie_enum"]
          fecha_nacimiento: string
          id_cliente: string | null
          id_mascota: string
          nombre: string
          raza_id: string | null
          sexo: Database["public"]["Enums"]["sexo_mascota_enum"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          especie: Database["public"]["Enums"]["especie_enum"]
          fecha_nacimiento: string
          id_cliente?: string | null
          id_mascota?: string
          nombre: string
          raza_id?: string | null
          sexo: Database["public"]["Enums"]["sexo_mascota_enum"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          especie?: Database["public"]["Enums"]["especie_enum"]
          fecha_nacimiento?: string
          id_cliente?: string | null
          id_mascota?: string
          nombre?: string
          raza_id?: string | null
          sexo?: Database["public"]["Enums"]["sexo_mascota_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mascotas_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id_cliente"]
          },
          {
            foreignKeyName: "mascotas_raza_id_fkey"
            columns: ["raza_id"]
            isOneToOne: false
            referencedRelation: "razas"
            referencedColumns: ["id_raza"]
          }
        ]
      }
      pagos: {
        Row: {
          created_at: string | null
          fecha: string
          id_pago: string
          metodo: Database["public"]["Enums"]["metodo_pago_enum"]
          monto: number
          venta_id: string | null
        }
        Insert: {
          created_at?: string | null
          fecha?: string
          id_pago?: string
          metodo: Database["public"]["Enums"]["metodo_pago_enum"]
          monto: number
          venta_id?: string | null
        }
        Update: {
          created_at?: string | null
          fecha?: string
          id_pago?: string
          metodo?: Database["public"]["Enums"]["metodo_pago_enum"]
          monto?: number
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id_venta"]
          }
        ]
      }
      productos: {
        Row: {
          categoria: string
          categoria_id: string | null
          created_at: string | null
          id_producto: string
          nombre: string
          precio: number
          stock: number
          updated_at: string | null
        }
        Insert: {
          categoria: string
          categoria_id?: string | null
          created_at?: string | null
          id_producto?: string
          nombre: string
          precio: number
          stock?: number
          updated_at?: string | null
        }
        Update: {
          categoria?: string
          categoria_id?: string | null
          created_at?: string | null
          id_producto?: string
          nombre?: string
          precio?: number
          stock?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_productos"
            referencedColumns: ["id_categoria"]
          }
        ]
      }
      razas: {
        Row: {
          created_at: string | null
          especie: Database["public"]["Enums"]["especie_enum"]
          id_raza: string
          nombre: string
        }
        Insert: {
          created_at?: string | null
          especie: Database["public"]["Enums"]["especie_enum"]
          id_raza?: string
          nombre: string
        }
        Update: {
          created_at?: string | null
          especie?: Database["public"]["Enums"]["especie_enum"]
          id_raza?: string
          nombre?: string
        }
        Relationships: []
      }
      turnos: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          estado: Database["public"]["Enums"]["estado_turno_enum"]
          fecha: string
          hora: string
          id_turno: string
          mascota_id: string | null
          motivo: string
          updated_at: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_turno_enum"]
          fecha: string
          hora: string
          id_turno?: string
          mascota_id?: string | null
          motivo: string
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_turno_enum"]
          fecha?: string
          hora?: string
          id_turno?: string
          mascota_id?: string | null
          motivo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turnos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id_cliente"]
          },
          {
            foreignKeyName: "turnos_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id_mascota"]
          }
        ]
      }
      venta_productos: {
        Row: {
          cantidad: number
          created_at: string | null
          id: string
          precio_unitario: number
          producto_id: string | null
          venta_id: string | null
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          id?: string
          precio_unitario: number
          producto_id?: string | null
          venta_id?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          id?: string
          precio_unitario?: number
          producto_id?: string | null
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venta_productos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id_producto"]
          },
          {
            foreignKeyName: "venta_productos_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id_venta"]
          }
        ]
      }
      ventas: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          estado: Database["public"]["Enums"]["estado_venta_enum"]
          fecha: string
          id_venta: string
          mascota_id: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_venta_enum"]
          fecha?: string
          id_venta?: string
          mascota_id?: string | null
          total: number
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_venta_enum"]
          fecha?: string
          id_venta?: string
          mascota_id?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id_cliente"]
          },
          {
            foreignKeyName: "ventas_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id_mascota"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categoria_gasto_enum:
        | "Suministros Médicos"
        | "Alquiler/Hipoteca"
        | "Servicios Públicos (Luz, Agua)"
        | "Salarios y Honorarios"
        | "Marketing y Publicidad"
        | "Mantenimiento y Reparaciones"
        | "Limpieza"
        | "Equipamiento Nuevo/Usado"
        | "Impuestos y Licencias"
        | "Seguros"
        | "Capacitación y Desarrollo"
        | "Software y Suscripciones"
        | "Gastos Varios"
      especie_enum: "Perro" | "Gato" | "Ave" | "Roedor" | "Reptil" | "Otro"
      estado_turno_enum: "Pendiente" | "Atendido" | "Ausente" | "Cancelado"
      estado_venta_enum: "Pendiente" | "Pagada" | "Cancelada"
      metodo_pago_enum: "Efectivo" | "Transferencia" | "Tarjeta"
      sexo_mascota_enum: "Macho" | "Hembra"
      tipo_evento_historial_enum:
        | "Consulta General"
        | "Cirugía Realizada"
        | "Tratamiento Aplicado"
        | "Enfermedad Registrada"
        | "Vacunación"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}