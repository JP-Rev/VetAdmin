/*
  # Esquema inicial para VetAdmin

  1. Nuevas Tablas
    - `clientes` - Información de clientes/propietarios
    - `razas` - Catálogo de razas de mascotas
    - `mascotas` - Información de mascotas
    - `productos` - Catálogo de productos
    - `enfermedades` - Catálogo de enfermedades
    - `cirugias` - Catálogo de tipos de cirugía
    - `turnos` - Citas/turnos médicos
    - `ventas` - Ventas realizadas
    - `venta_productos` - Productos incluidos en cada venta
    - `pagos` - Pagos realizados
    - `historial_medico` - Historial médico de mascotas
    - `mascota_enfermedades` - Enfermedades diagnosticadas por mascota
    - `mascota_cirugias` - Cirugías realizadas por mascota
    - `gastos` - Gastos registrados

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para usuarios autenticados
*/

-- Crear tipos enum
CREATE TYPE especie_enum AS ENUM ('Perro', 'Gato', 'Ave', 'Roedor', 'Reptil', 'Otro');
CREATE TYPE sexo_mascota_enum AS ENUM ('Macho', 'Hembra');
CREATE TYPE estado_venta_enum AS ENUM ('Pendiente', 'Pagada', 'Cancelada');
CREATE TYPE metodo_pago_enum AS ENUM ('Efectivo', 'Transferencia', 'Tarjeta');
CREATE TYPE tipo_evento_historial_enum AS ENUM ('Consulta General', 'Cirugía Realizada', 'Tratamiento Aplicado', 'Enfermedad Registrada', 'Vacunación');
CREATE TYPE categoria_gasto_enum AS ENUM ('Suministros Médicos', 'Alquiler/Hipoteca', 'Servicios Públicos (Luz, Agua)', 'Salarios y Honorarios', 'Marketing y Publicidad', 'Mantenimiento y Reparaciones', 'Limpieza', 'Equipamiento Nuevo/Usado', 'Impuestos y Licencias', 'Seguros', 'Capacitación y Desarrollo', 'Software y Suscripciones', 'Gastos Varios');
CREATE TYPE estado_turno_enum AS ENUM ('Pendiente', 'Atendido', 'Ausente', 'Cancelado');

-- Tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  telefono text NOT NULL,
  email text DEFAULT '',
  domicilio text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla razas
CREATE TABLE IF NOT EXISTS razas (
  id_raza uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  especie especie_enum NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabla mascotas
CREATE TABLE IF NOT EXISTS mascotas (
  id_mascota uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  especie especie_enum NOT NULL,
  raza_id uuid REFERENCES razas(id_raza) ON DELETE SET NULL,
  id_cliente uuid REFERENCES clientes(id_cliente) ON DELETE CASCADE,
  fecha_nacimiento date NOT NULL,
  sexo sexo_mascota_enum NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla productos
CREATE TABLE IF NOT EXISTS productos (
  id_producto uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  precio decimal(10,2) NOT NULL,
  categoria text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla enfermedades
CREATE TABLE IF NOT EXISTS enfermedades (
  id_enfermedad uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text NOT NULL,
  especie_afectada especie_enum,
  created_at timestamptz DEFAULT now()
);

-- Tabla cirugias
CREATE TABLE IF NOT EXISTS cirugias (
  id_cirugia uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  descripcion text NOT NULL,
  duracion_estimada_min integer NOT NULL,
  costo_estimado decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabla turnos
CREATE TABLE IF NOT EXISTS turnos (
  id_turno uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL,
  hora time NOT NULL,
  cliente_id uuid REFERENCES clientes(id_cliente) ON DELETE CASCADE,
  mascota_id uuid REFERENCES mascotas(id_mascota) ON DELETE CASCADE,
  motivo text NOT NULL,
  estado estado_turno_enum NOT NULL DEFAULT 'Pendiente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla ventas
CREATE TABLE IF NOT EXISTS ventas (
  id_venta uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha timestamptz NOT NULL DEFAULT now(),
  cliente_id uuid REFERENCES clientes(id_cliente) ON DELETE CASCADE,
  mascota_id uuid REFERENCES mascotas(id_mascota) ON DELETE SET NULL,
  total decimal(10,2) NOT NULL,
  estado estado_venta_enum NOT NULL DEFAULT 'Pendiente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla venta_productos
CREATE TABLE IF NOT EXISTS venta_productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid REFERENCES ventas(id_venta) ON DELETE CASCADE,
  producto_id uuid REFERENCES productos(id_producto) ON DELETE CASCADE,
  cantidad integer NOT NULL,
  precio_unitario decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabla pagos
CREATE TABLE IF NOT EXISTS pagos (
  id_pago uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid REFERENCES ventas(id_venta) ON DELETE CASCADE,
  monto decimal(10,2) NOT NULL,
  fecha timestamptz NOT NULL DEFAULT now(),
  metodo metodo_pago_enum NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabla historial_medico
CREATE TABLE IF NOT EXISTS historial_medico (
  id_evento uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mascota_id uuid REFERENCES mascotas(id_mascota) ON DELETE CASCADE,
  fecha timestamptz NOT NULL DEFAULT now(),
  tipo_evento tipo_evento_historial_enum NOT NULL,
  descripcion text NOT NULL,
  referencia_id text,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla mascota_enfermedades
CREATE TABLE IF NOT EXISTS mascota_enfermedades (
  id_mascota_enfermedad uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mascota_id uuid REFERENCES mascotas(id_mascota) ON DELETE CASCADE,
  enfermedad_id uuid REFERENCES enfermedades(id_enfermedad) ON DELETE CASCADE,
  fecha_diagnostico date NOT NULL,
  observaciones text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla mascota_cirugias
CREATE TABLE IF NOT EXISTS mascota_cirugias (
  id_mascota_cirugia uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mascota_id uuid REFERENCES mascotas(id_mascota) ON DELETE CASCADE,
  cirugia_id uuid REFERENCES cirugias(id_cirugia) ON DELETE CASCADE,
  fecha date NOT NULL,
  observaciones text DEFAULT '',
  costo_final decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla gastos
CREATE TABLE IF NOT EXISTS gastos (
  id_gasto uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL,
  descripcion text NOT NULL,
  monto decimal(10,2) NOT NULL,
  categoria categoria_gasto_enum NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE razas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mascotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE enfermedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE cirugias ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_medico ENABLE ROW LEVEL SECURITY;
ALTER TABLE mascota_enfermedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE mascota_cirugias ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir todo para usuarios autenticados por ahora)
CREATE POLICY "Allow all for authenticated users" ON clientes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON razas FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON mascotas FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON productos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON enfermedades FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON cirugias FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON turnos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON ventas FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON venta_productos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON pagos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON historial_medico FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON mascota_enfermedades FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON mascota_cirugias FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON gastos FOR ALL TO authenticated USING (true);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_mascotas_cliente_id ON mascotas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_mascotas_raza_id ON mascotas(raza_id);
CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON turnos(fecha);
CREATE INDEX IF NOT EXISTS idx_turnos_cliente_id ON turnos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_turnos_mascota_id ON turnos(mascota_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_venta_productos_venta_id ON venta_productos(venta_id);
CREATE INDEX IF NOT EXISTS idx_pagos_venta_id ON pagos(venta_id);
CREATE INDEX IF NOT EXISTS idx_historial_medico_mascota_id ON historial_medico(mascota_id);
CREATE INDEX IF NOT EXISTS idx_historial_medico_fecha ON historial_medico(fecha);
CREATE INDEX IF NOT EXISTS idx_mascota_enfermedades_mascota_id ON mascota_enfermedades(mascota_id);
CREATE INDEX IF NOT EXISTS idx_mascota_cirugias_mascota_id ON mascota_cirugias(mascota_id);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);