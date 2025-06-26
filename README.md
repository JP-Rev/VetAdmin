# VetAdmin - Sistema de Gestión Veterinaria

Una aplicación web completa para la gestión de clínicas veterinarias, construida con React, TypeScript y Supabase.

## Características

- **Gestión de Clientes**: Registro y administración de propietarios de mascotas
- **Gestión de Mascotas**: Perfiles completos con información médica
- **Sistema de Turnos**: Calendario de citas con estados y seguimiento
- **Historial Médico**: Registro detallado de consultas, tratamientos y cirugías
- **Gestión de Productos**: Inventario y control de stock
- **Sistema de Ventas**: Facturación y control de pagos
- **Reportes Financieros**: Flujo de caja diario y estadísticas
- **Gestión de Gastos**: Control de egresos por categorías
- **Configuración**: Catálogos de razas, enfermedades y cirugías

## Tecnologías

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **PDF Generation**: jsPDF + html2canvas
- **Build Tool**: Vite

## Configuración

### 1. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta las migraciones SQL desde la carpeta `supabase/migrations/`
3. Copia las credenciales de tu proyecto

### 2. Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### 3. Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
├── contexts/           # Context providers (Supabase)
├── pages/              # Páginas principales
├── lib/                # Configuración de Supabase
├── types.ts            # Definiciones de tipos
└── constants.tsx       # Constantes de la aplicación

supabase/
└── migrations/         # Migraciones de base de datos
```

## Base de Datos

El esquema incluye las siguientes tablas principales:

- `clientes` - Información de propietarios
- `mascotas` - Datos de las mascotas
- `turnos` - Sistema de citas
- `productos` - Inventario
- `ventas` - Transacciones de venta
- `historial_medico` - Registros médicos
- `gastos` - Control de egresos

## Características Técnicas

- **PWA Ready**: Configurado como Progressive Web App
- **Responsive Design**: Optimizado para móviles y desktop
- **Real-time Updates**: Sincronización automática con Supabase
- **Type Safety**: Completamente tipado con TypeScript
- **Row Level Security**: Seguridad a nivel de fila en Supabase

## Licencia

Este proyecto está bajo la Licencia MIT.