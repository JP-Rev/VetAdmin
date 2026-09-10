# scripts/

Scripts de mantenimiento que se corren a mano, no en cada arranque.

En el VPS se ejecutan con un contenedor efimero sobre la misma imagen:

```bash
docker compose run --rm server node scripts/<script>.js
```

Para que eso funcione, **esta carpeta tiene que estar dentro de la imagen**:
`server/Dockerfile` la copia explicitamente (`COPY scripts ./scripts`).

## Por que existe esa linea en el Dockerfile

El 04/09/2025 el Dockerfile copiaba solo `package*.json`, `prisma` y `src`. El
deploy del peso historico era:

1. `docker compose run --rm server node scripts/migrarPesoAPesajes.js exportar`
2. `docker compose run --rm server npx prisma db push --accept-data-loss`
3. `docker compose run --rm server node scripts/migrarPesoAPesajes.js importar`

Los pasos 1 y 3 fallaron con `Cannot find module
'/app/scripts/migrarPesoAPesajes.js'` porque el script no estaba en la imagen.
El paso 2 corrio igual y borro la columna `Mascota.peso` con 3 valores adentro.

Regla que quedo: **si un paso de deploy corre un script, verificar antes que el
script exista en la imagen** y no seguir con `db push` si el paso previo fallo.

```bash
docker compose run --rm server ls scripts/
```

## migrarPesoAPesajes.js

Pasa `Mascota.peso` (columna vieja) a filas de `Pesaje`. Va en dos tiempos
porque `prisma db push` crea la tabla nueva y borra la columna vieja en la misma
operacion.

```bash
node scripts/migrarPesoAPesajes.js exportar   # ANTES de db push
npx prisma db push
node scripts/migrarPesoAPesajes.js importar   # DESPUES de db push
```

Ambos pasos son idempotentes.

## recuperarPesosDesdeBackup.js

Plan B del anterior: si el `db push` ya borro la columna, lee los pesos de una
copia vieja de la base y los inserta como `Pesaje` en la base viva.

```bash
node scripts/recuperarPesosDesdeBackup.js /ruta/copia.db --dry-run
node scripts/recuperarPesosDesdeBackup.js /ruta/copia.db
```

Pasale una **copia** del backup, no el backup original: SQLite abre journal
aunque solo leas. Saltea las mascotas que ya tengan algun pesaje cargado, asi
que se puede correr de nuevo sin duplicar.
