# VetAdmin - Sistema de Gestión Veterinaria

Una aplicación web completa para la gestión de clínicas veterinarias, construida con React, TypeScript, Express y SQLite.

## Características

- **Gestión de Clientes**: Registro y administración de propietarios de mascotas
- **Gestión de Mascotas**: Perfiles completos con información médica
- **Sistema de Turnos**: Calendario de citas con estados y seguimiento
- **Historial Médico**: Registro detallado de consultas, tratamientos y cirugías, con archivos adjuntos
- **Gestión de Productos**: Inventario y control de stock
- **Sistema de Ventas**: Facturación y control de pagos
- **Reportes Financieros**: Flujo de caja diario y estadísticas
- **Gestión de Gastos**: Control de egresos por categorías
- **Configuración**: Catálogos de razas, enfermedades y cirugías

## Tecnologías

- **Frontend** (`client/`): React 19, TypeScript, Tailwind CSS, Vite
- **Backend** (`server/`): Node, Express, Prisma, SQLite
- **Autenticación**: JWT en cookie httpOnly
- **Archivos**: subida real a disco (volumen Docker), no Base64
- **PDF Generation**: jsPDF + html2canvas
- **Despliegue**: Docker Compose (dos contenedores: `server` y `client` detrás de nginx)

## Estructura del Proyecto

```
client/                  # SPA React (Vite)
├── components/
├── contexts/             # AuthContext y SupabaseDataContext (hoy hablan con la API propia, no con Supabase)
├── pages/
├── lib/                  # api.ts: cliente fetch hacia /api
└── types.ts

server/                  # API REST propia
├── prisma/
│   ├── schema.prisma     # Modelos SQLite
│   └── seed.js           # Catálogos iniciales + usuario admin
└── src/
    ├── app.js            # Wiring de rutas Express
    ├── auth.js           # Login JWT + cookie httpOnly
    ├── storage.js         # Subida de adjuntos (multer) al volumen de archivos
    └── routes/            # Un router por entidad (clientes, mascotas, ventas, etc.)
```

## Desarrollo local

### 1. Backend

```bash
cd server
cp .env.example .env     # completar JWT_SECRET, SEED_ADMIN_EMAIL/PASSWORD
npm install
npm run db:generate
npm run db:push          # crea el archivo SQLite según el schema
npm run db:seed          # catálogos iniciales + usuario admin (si están definidos en .env)
npm run dev               # http://localhost:4000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev               # http://localhost:5173, con proxy de /api hacia el backend
```

## Despliegue con Docker

Desde la raíz del repo (por ejemplo en `/srv/docker/vet-admin` en el VPS):

```bash
cp .env.example .env                     # puertos y ruta de almacenamiento de archivos
cp server/.env.example server/.env       # JWT_SECRET, SEED_ADMIN_EMAIL/PASSWORD

docker compose up -d --build
docker compose exec server npm run db:seed   # una vez, para cargar catálogos + usuario admin
```

Por defecto:
- El sitio queda expuesto en el puerto `3008` del host (`CLIENT_PORT`) y la API en `4010` (`SERVER_PORT`) — se eligieron distintos a los que ya usa `facturacion-web` (`3007`/`4000`) en el mismo servidor.
- La base SQLite persiste en un volumen Docker nombrado (`sqlite_data`).
- Los archivos adjuntos se guardan en `${STORAGE_ROOT_HOST}` del host, que por defecto resuelve a `../storage/vet-admin` relativo a este `docker-compose.yml` (es decir, `/srv/docker/storage/vet-admin` si el repo está en `/srv/docker/vet-admin`).

## Base de Datos

El esquema (`server/prisma/schema.prisma`) incluye las siguientes tablas principales:

- `Cliente` - Información de propietarios
- `Mascota` - Datos de las mascotas
- `Turno` - Sistema de citas
- `Producto` / `CategoriaProducto` - Inventario
- `Venta` / `VentaProducto` / `Pago` - Transacciones de venta
- `HistorialMedico` / `Attachment` - Registros médicos y archivos adjuntos
- `Gasto` - Control de egresos
- `User` - Usuarios con acceso al sistema

## Licencia

Este proyecto está bajo la Licencia MIT.
