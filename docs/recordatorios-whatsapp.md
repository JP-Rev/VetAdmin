# Recordatorios de turno por WhatsApp

La app manda un WhatsApp una hora antes de cada turno. El envío lo hace
**Evolution API** ([evolution-foundation/evolution-api](https://github.com/evolution-foundation/evolution-api)),
un servicio aparte que mantiene abierta una sesión de WhatsApp; VetAdmin sólo le
pega por HTTP.

> **El número desde el que sale el mensaje es el de la sesión de Evolution.**
> No se manda en cada pedido: es el WhatsApp que se vincula escaneando el QR.
> Para que salga desde **2346566306**, ese es el teléfono que hay que escanear.

El código ya está en la app y queda **inerte** hasta que existan las tres
variables de entorno. Sin ellas arranca igual y lo dice en el log:

```
Recordatorios por WhatsApp: apagados (falta configurar EVOLUTION_URL, ...)
```

---

## 1. Generar las claves

🔴 **Generalas primero y pegá el resultado.** En un archivo `.env` de Docker
Compose `$(openssl rand -hex 32)` **no se ejecuta**: Compose lo guarda tal cual,
como el texto literal `$(openssl rand -hex 32)`, y esa terminaría siendo tu
apikey. El `.env` no es un script de shell.

Corré esto en la terminal del VPS:

```bash
openssl rand -hex 32      # para AUTHENTICATION_API_KEY
openssl rand -hex 24      # para la password de Postgres
```

Cada uno imprime una línea de hexadecimal, así:

```
9f2c41a7e83b5d06c14fa927de5b3081f6a4c92e7b18d05a3fc6e921b47d8a3e
```

Copiá **esa salida** y pegala en el `.env` del paso siguiente. Guardá la apikey
en algún lado: la vas a necesitar de nuevo para configurar VetAdmin.

`-hex 32` son 32 bytes al azar mostrados en hexadecimal, o sea 64 caracteres.
No tiene nada de especial el 32; es largo suficiente para que no se adivine.

## 2. Levantar Evolution en el VPS

Va como stack propio en `/srv/docker/evolution`, igual que el relay de mail —
así lo pueden compartir Kinetic y Facturación más adelante.

**Primero la red compartida.** Es un paso aparte y se hace una sola vez en el
VPS; no la crea ningún compose porque la comparten las tres apps:

```bash
docker network create evolution_net
```

Si te la salteás, `docker compose up` baja las imágenes y recién ahí falla con:

```
network evolution_net declared as external, but could not be found
```

No se rompió nada: creá la red y volvé a correr `docker compose up -d`.

```bash
mkdir -p /srv/docker/evolution && cd /srv/docker/evolution
```

`docker-compose.yml`:

```yaml
services:
  evolution:
    # Es la imagen oficial del repo. Fijá un tag en vez de latest cuando
    # confirmes qué versión te funciona, así un pull no te cambia la API.
    image: evoapicloud/evolution-api:latest
    container_name: evolution
    restart: unless-stopped
    env_file: .env
    volumes:
      - evolution_instances:/evolution/instances
    ports:
      # Sólo local, y en 8081 a propósito: el 8080 del VPS ya lo usa File
      # Browser. Este puerto se publica nada más que para el alta de la
      # instancia y el QR; VetAdmin le habla por la red interna de Docker
      # (http://evolution:8080), no por acá.
      - "127.0.0.1:8081:8080"
    depends_on:
      - evolution_db
      - evolution_redis
    networks: [evolution_net]

  evolution_db:
    image: postgres:15
    container_name: evolution_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: evolution
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: evolution
    volumes:
      - evolution_pg:/var/lib/postgresql/data
    networks: [evolution_net]

  evolution_redis:
    image: redis:latest
    container_name: evolution_redis
    restart: unless-stopped
    command: redis-server --port 6379 --appendonly yes
    volumes:
      - evolution_redis:/data
    networks: [evolution_net]

volumes:
  evolution_instances:
  evolution_pg:
  evolution_redis:

networks:
  evolution_net:
    external: true
```

Y el `.env` al lado (**no va a git**). El
[`.env.example` del repo](https://github.com/evolution-foundation/evolution-api/blob/main/.env.example)
tiene cientos de variables — casi todas son integraciones apagadas (Kafka,
RabbitMQ, SQS, Chatwoot, Typebot, OpenAI, S3…) que no hacen falta. Estas son
las que importan para este caso:

```bash
# --- servidor
# SERVER_PORT es el puerto DENTRO del contenedor: se deja en 8080 aunque
# afuera lo publiques en otro. El mapeo lo hace el compose.
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=http://127.0.0.1:8081

# --- autenticación (pegá acá la salida de openssl rand -hex 32)
AUTHENTICATION_API_KEY=9f2c41a7e83b5d06c14fa927de5b3081f6a4c92e7b18d05a3fc6e921b47d8a3e

# --- base (la password va también en POSTGRES_PASSWORD, abajo)
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://evolution:PEGAR_PASSWORD_ACA@evolution_db:5432/evolution?schema=evolution_api
DATABASE_CONNECTION_CLIENT_NAME=evolution

# Sólo mandamos recordatorios: no hace falta guardar el historial de chats,
# contactos ni mensajes. Con todo esto en true la base crece sin sentido.
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=false
DATABASE_SAVE_MESSAGE_UPDATE=false
DATABASE_SAVE_DATA_CONTACTS=false
DATABASE_SAVE_DATA_CHATS=false
DATABASE_SAVE_DATA_LABELS=false
DATABASE_SAVE_DATA_HISTORIC=false

# --- caché (viene en true por defecto: si no levantás Redis, hay que apagarlo)
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://evolution_redis:6379/6
CACHE_REDIS_PREFIX_KEY=evolution
CACHE_LOCAL_ENABLED=false

# --- cómo aparece en "Dispositivos vinculados" del teléfono.
# Es sólo una etiqueta: no tiene NADA que ver con el nombre de la instancia
# (ese es "vetadmin" y va en la URL de todos los endpoints). Cambiala libremente.
CONFIG_SESSION_PHONE_CLIENT=VetAdmin
CONFIG_SESSION_PHONE_NAME=Chrome

# --- varios
TELEMETRY_ENABLED=false
LOG_LEVEL=ERROR,WARN,INFO
LANGUAGE=en
TZ=America/Argentina/Buenos_Aires

# --- para el servicio de Postgres del compose (pegá la de openssl rand -hex 24)
POSTGRES_PASSWORD=PEGAR_PASSWORD_ACA
```

⚠️ La password de Postgres va en **dos lugares**: dentro de
`DATABASE_CONNECTION_URI` y en `POSTGRES_PASSWORD`. Tienen que coincidir.

```bash
docker compose up -d
docker compose logs -f evolution      # que levante sin errores de base
```

## 3. Vincular el número 2346566306

Es la misma clave que generaste en el paso 1 y pegaste en el `.env` del paso 2
(`AUTHENTICATION_API_KEY`). No es un valor nuevo. Para no copiarla a mano,
leela del archivo:

```bash
cd /srv/docker/evolution
API=http://127.0.0.1:8081
KEY=$(grep '^AUTHENTICATION_API_KEY=' .env | cut -d= -f2-)
echo $KEY      # confirmá que imprime el hexadecimal y no algo vacío
```

⚠️ **No escribas `KEY=<tu clave>` con los signos `<>`**: bash los toma como
redirección y tira `syntax error near unexpected token`, dejando `$KEY` vacío.

**Antes de seguir, confirmá que del otro lado está Evolution y no otra cosa:**

```bash
curl -s $API | head -5
```

Tiene que devolver un JSON de Evolution. Si te devuelve HTML, ese puerto lo
tiene otro servicio del VPS — a nosotros nos pasó con File Browser en el 8080.
Mirá quién lo ocupa y elegí otro puerto en el compose:

```bash
docker compose ps                    # ¿está corriendo evolution?
docker compose logs evolution        # ¿se quejó al arrancar?
ss -tlnp | grep -E '8080|8081'       # quién tiene cada puerto
```

Ahí sí, con `$KEY` cargada en esa terminal:

```bash
# crear la instancia
curl -X POST $API/instance/create \
  -H "apikey: $KEY" -H 'Content-Type: application/json' \
  -d '{"instanceName":"vetadmin","integration":"WHATSAPP-BAILEYS","qrcode":true}'

# pedir el QR (devuelve un base64 largo dentro del JSON)
curl -s $API/instance/connect/vetadmin -H "apikey: $KEY"
```

El QR viene como data URL en base64. Para verlo, guardalo y abrilo:

```bash
curl -s $API/instance/connect/vetadmin -H "apikey: $KEY" \
  | python3 -c "import sys,json,base64; d=json.load(sys.stdin); \
      open('/tmp/qr.png','wb').write(base64.b64decode(d['base64'].split(',')[1]))"
# después bajá /tmp/qr.png a tu máquina y escanealo
```

Escaneá desde **WhatsApp del 2346566306** → Dispositivos vinculados. Confirmá:

```bash
curl -s $API/instance/connectionState/vetadmin -H "apikey: $KEY"
# tiene que decir "open"
```

> Si preferís no pelear con el base64, el proyecto publica también
> `evoapicloud/evolution-manager`, una UI web que muestra el QR y el estado de
> las instancias. Se agrega como un servicio más al compose.

🔴 **Esa sesión se cae.** Si desvinculan el dispositivo desde el teléfono, si el
teléfono queda mucho tiempo sin internet o si WhatsApp corta la sesión, los
recordatorios dejan de salir **en silencio**. Conviene mirar el
`connectionState` cada tanto, o revisar el log del server buscando
`No se pudo mandar el recordatorio`.

## 4. Configurar VetAdmin

En `/srv/docker/vet-admin/server/.env`:

```bash
EVOLUTION_URL=http://evolution:8080
EVOLUTION_API_KEY=<la misma AUTHENTICATION_API_KEY>
EVOLUTION_INSTANCE=vetadmin
```

`evolution` resuelve por DNS interno de Docker gracias a `evolution_net`, que
ya está en el `docker-compose.yml` de la app. Después:

```bash
cd /srv/docker/vet-admin && docker compose up -d --build
docker compose logs server | grep -i recordatorio
# Recordatorios por WhatsApp: activos — 60 min antes, revisando cada 5 min (huso America/Argentina/Buenos_Aires)
```

Si el log dice **UTC** en vez del huso argentino, los avisos van a salir tres
horas corridos: revisá que `TZ` esté llegando al contenedor.

### Probar sin esperar un turno

Cargá un turno para dentro de ~40 minutos con un cliente que tenga tu teléfono,
y esperá la próxima pasada (máximo 5 minutos). O mandá uno a mano:

```bash
curl -X POST $API/message/sendText/vetadmin \
  -H "apikey: $KEY" -H 'Content-Type: application/json' \
  -d '{"number":"5492346690893","text":"Prueba desde el VPS"}'
```

Ese es exactamente el endpoint y el cuerpo que usa `server/src/whatsapp.js`.

---

## Cómo funciona, en criollo

Cada 5 minutos el server busca turnos **pendientes**, que **todavía no
pasaron** y que caen **dentro de la próxima hora**, y manda los que no tengan
`recordatorioEnviadoAt`.

De ahí salen tres comportamientos que conviene conocer:

- **No se manda dos veces.** Se marca el turno al enviar.
- **Un reinicio no dispara avisos viejos.** Como sólo entran turnos futuros, si
  el contenedor estuvo caído no manda de golpe lo que ya ocurrió.
- **Si Evolution está caído, reintenta.** No se marca el turno, así que la
  pasada siguiente lo vuelve a intentar. En cambio, si el cliente tiene un
  teléfono que no se puede normalizar, se marca y se saltea: no hay nada que
  reintentar y si no quedaría mirándolo cada 5 minutos para siempre. Queda en
  el log como `Recordatorio salteado`.

Ajustables por entorno: `RECORDATORIO_MINUTOS_ANTES` (60) y
`RECORDATORIO_INTERVALO_MINUTOS` (5).

## Lo que no está hecho

- **No hay forma de desactivar el recordatorio por cliente ni por turno.** Se
  manda para todos los turnos pendientes con teléfono válido.
- **No se lee la respuesta.** El mensaje invita a responder, pero eso llega al
  WhatsApp del teléfono, no a la app.
- **No hay reintento con espera.** Si Evolution está caído, se reintenta a los
  5 minutos hasta que el turno pase.
- **Nadie avisa si la sesión se cayó.** Ver la advertencia del paso 3.
