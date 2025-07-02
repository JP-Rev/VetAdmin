/*
  # Agregar gestión de categorías de productos

  1. Nueva Tabla
    - `categorias_productos` - Catálogo de categorías de productos

  2. Modificaciones
    - Actualizar tabla `productos` para usar referencia a categorías
    - Migrar datos existentes

  3. Seguridad
    - Habilitar RLS en nueva tabla
    - Agregar políticas para usuarios autenticados
*/

-- Crear tabla de categorías de productos
CREATE TABLE IF NOT EXISTS categorias_productos (
  id_categoria uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  descripcion text DEFAULT '',
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insertar categorías predeterminadas basadas en los datos existentes
INSERT INTO categorias_productos (nombre, descripcion) VALUES
('Alimentos', 'Alimentos balanceados y snacks para mascotas'),
('Salud', 'Medicamentos, vitaminas y productos de salud'),
('Accesorios', 'Juguetes, correas, collares y accesorios'),
('Higiene', 'Productos de limpieza y cuidado personal'),
('Equipamiento', 'Equipos médicos y herramientas veterinarias'),
('Suministros', 'Materiales y suministros generales');

-- Agregar nueva columna categoria_id a productos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'categoria_id'
  ) THEN
    ALTER TABLE productos ADD COLUMN categoria_id uuid REFERENCES categorias_productos(id_categoria) ON DELETE SET NULL;
  END IF;
END $$;

-- Migrar datos existentes: asignar categorías basándose en el campo categoria actual
DO $$
DECLARE
  cat_record RECORD;
  prod_record RECORD;
BEGIN
  -- Para cada producto existente, buscar o crear la categoría correspondiente
  FOR prod_record IN SELECT id_producto, categoria FROM productos WHERE categoria_id IS NULL LOOP
    -- Buscar si ya existe la categoría
    SELECT id_categoria INTO cat_record FROM categorias_productos WHERE nombre = prod_record.categoria;
    
    -- Si no existe, crearla
    IF NOT FOUND THEN
      INSERT INTO categorias_productos (nombre, descripcion) 
      VALUES (prod_record.categoria, 'Categoría migrada automáticamente')
      RETURNING id_categoria INTO cat_record;
    END IF;
    
    -- Actualizar el producto con la nueva referencia
    UPDATE productos SET categoria_id = cat_record.id_categoria WHERE id_producto = prod_record.id_producto;
  END LOOP;
END $$;

-- Habilitar RLS en la nueva tabla
ALTER TABLE categorias_productos ENABLE ROW LEVEL SECURITY;

-- Crear política para usuarios autenticados
CREATE POLICY "Allow all for authenticated users" ON categorias_productos FOR ALL TO authenticated USING (true);

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_categorias_productos_nombre ON categorias_productos(nombre);