/*
  # Crear tabla de usuarios personalizada

  1. Nueva Tabla
    - `usuarios` - Tabla de usuarios personalizada para manejo manual
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text) - Hash de la contraseña
      - `nombre` (text) - Nombre del usuario
      - `rol` (text) - Rol del usuario (admin, veterinario, etc.)
      - `activo` (boolean) - Si el usuario está activo
      - `ultimo_acceso` (timestamp) - Último acceso del usuario
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Datos iniciales
    - Usuario administrador por defecto
    - Email: admin@vetadmin.com
    - Password: 123456 (hasheado)

  3. Seguridad
    - Habilitar RLS en la tabla usuarios
    - Política para que solo usuarios autenticados puedan acceder
*/

-- Crear tabla usuarios personalizada
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  nombre text NOT NULL,
  rol text NOT NULL DEFAULT 'admin',
  activo boolean NOT NULL DEFAULT true,
  ultimo_acceso timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso a usuarios autenticados
CREATE POLICY "Allow authenticated users to read usuarios" 
  ON usuarios 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to update usuarios" 
  ON usuarios 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Función para hashear contraseñas (usando crypt de pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Función para verificar contraseñas
CREATE OR REPLACE FUNCTION verify_password(input_password text, stored_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN stored_hash = crypt(input_password, stored_hash);
END $$;

-- Función para crear hash de contraseña
CREATE OR REPLACE FUNCTION hash_password(input_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(input_password, gen_salt('bf'));
END $$;

-- Insertar usuario administrador por defecto
-- Password: 123456
INSERT INTO usuarios (email, password_hash, nombre, rol) 
VALUES (
  'admin@vetadmin.com',
  hash_password('123456'),
  'Administrador',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Función para autenticar usuario
CREATE OR REPLACE FUNCTION authenticate_user(input_email text, input_password text)
RETURNS TABLE(
  user_id uuid,
  email text,
  nombre text,
  rol text,
  activo boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record usuarios%ROWTYPE;
BEGIN
  -- Buscar usuario por email
  SELECT * INTO user_record
  FROM usuarios
  WHERE usuarios.email = input_email
  AND usuarios.activo = true;

  -- Verificar si el usuario existe y la contraseña es correcta
  IF user_record.id IS NOT NULL AND verify_password(input_password, user_record.password_hash) THEN
    -- Actualizar último acceso
    UPDATE usuarios 
    SET ultimo_acceso = now(), updated_at = now()
    WHERE usuarios.id = user_record.id;

    -- Retornar datos del usuario
    RETURN QUERY SELECT 
      user_record.id,
      user_record.email,
      user_record.nombre,
      user_record.rol,
      user_record.activo;
  ELSE
    -- Retornar vacío si la autenticación falla
    RETURN;
  END IF;
END $$;

-- Función para crear nuevo usuario
CREATE OR REPLACE FUNCTION create_user(
  input_email text,
  input_password text,
  input_nombre text,
  input_rol text DEFAULT 'admin'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  INSERT INTO usuarios (email, password_hash, nombre, rol)
  VALUES (
    input_email,
    hash_password(input_password),
    input_nombre,
    input_rol
  )
  RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
END $$;

-- Función para cambiar contraseña
CREATE OR REPLACE FUNCTION change_password(
  user_id uuid,
  old_password text,
  new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_hash text;
BEGIN
  -- Obtener hash actual
  SELECT password_hash INTO current_hash
  FROM usuarios
  WHERE id = user_id;

  -- Verificar contraseña actual
  IF verify_password(old_password, current_hash) THEN
    -- Actualizar con nueva contraseña
    UPDATE usuarios
    SET password_hash = hash_password(new_password),
        updated_at = now()
    WHERE id = user_id;
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END $$;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- Comentarios para documentación
COMMENT ON TABLE usuarios IS 'Tabla de usuarios personalizada para manejo manual de autenticación';
COMMENT ON FUNCTION authenticate_user IS 'Función para autenticar usuario con email y contraseña';
COMMENT ON FUNCTION create_user IS 'Función para crear nuevo usuario con contraseña hasheada';
COMMENT ON FUNCTION change_password IS 'Función para cambiar contraseña de usuario';