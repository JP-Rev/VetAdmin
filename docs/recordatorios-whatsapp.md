# Recordatorios de turno por WhatsApp

La app manda un WhatsApp una hora antes de cada turno. El envío lo hace
**Evolution API**, un servicio aparte que mantiene abierta una sesión de
WhatsApp; VetAdmin sólo le pega por HTTP.

> **El número desde el que sale el mensaje es el de la sesión de Evolution.**
> No se manda en cada pedido: es el número que se vincula escaneando el QR. Para
> que salga desde **2346566306**, ese tiene que ser el WhatsApp escaneado.

El código ya está en la app y queda **inerte** hasta que existan las tres
variables de entorno. Sin ellas arranca igual y lo dice en el log:

```
Recordatorios por WhatsApp: apagados (falta configurar EVOLUTION_URL, ...)
```

## 1. Levantar Evolution en el VPS

Va como stack propio en `/srv/docker/evolution`, igual que el relay de mail —
así lo pueden compartir Kinetic y Facturación más adelante.

```bash
docker network create evolution_net     # una sola vez, la comparten las apps
mkdir -p /srv/docker/evolution && cd /srv/docker/evolution
```

`docker-compose.yml` de arranque:

```yaml
services:
  evolution:
    image: atendai/evolution-api:v2.1.1     # fijá una versión, no uses latest
    container_name: evolution
    restart: unless-stopped
    environment:
      AUTHENTICATION_API_KEY: ${EVOLUTION_API_KEY}
      DATABASE_ENABLED: "true"
      DATABASE_PROVIDER: postgresql
      DATABASE_CONNECTION_URI: postgresql://evolution:${POSTGRES_PASSWORD}@evolution_db:5432/evolution
      CACHE_REDIS_ENABLED: "false"
      TZ: America/Argentina/Buenos_Aires
    volumes:
      - evolution_instances:/evolution/instances
    ports:
      # Sólo local: se entra por el proxy del host, nunca por la IP pública.
      - "127.0.0.1:8080:8080"
    depends_on:
      - evolution_db
    networks: [evolution_net]

  evolution_db:
    image: postgres:16-alpine
    container_name: evolution_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: evolution
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: evolution
    volumes:
      - evolution_pg:/var/lib/postgresql/data
    networks: [evolution_net]

volumes:
  evolution_instances:
  evolution_pg:

networks:
  evolution_net:
    external: true
```

Y un `.env` al lado (no va a git):

```bash
EVOLUTION_API_KEY=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 24)
```

⚠️ **Verificá los nombres de las variables contra la documentación de la
versión que bajes.** Evolution las cambió entre v1 y v2 y este compose es un
punto de partida, no una configuración verificada contra tu servidor.

```bash
docker compose up -d
docker compose logs -f evolution      # que levante sin errores de base
```

## 2. Vincular el número 2346566306

```bash
# crear la instancia
curl -X POST http://127.0.0.1:8080/instance/create \
  -H "apikey: $EVOLUTION_API_KEY" -H 'Content-Type: application/json' \
  -d '{"instanceName":"vetadmin","integration":"WHATSAPP-BAILEYS","qrcode":true}'

# pedir el QR (devuelve un base64 para abrir en el navegador)
curl -s http://127.0.0.1:8080/instance/connect/vetadmin -H "apikey: $EVOLUTION_API_KEY"
```

Escaneá ese QR desde **WhatsApp del 2346566306** → Dispositivos vinculados.
Confirmá que quedó conectado:

```bash
curl -s http://127.0.0.1:8080/instance/connectionState/vetadmin -H "apikey: $EVOLUTION_API_KEY"
# tiene que decir "open"
```

🔴 **Esa sesión se cae.** Si desvinculan el dispositivo desde el teléfono, si el
teléfono queda mucho tiempo sin internet o si WhatsApp corta la sesión, los
recordatorios dejan de salir en silencio. Conviene mirar el
`connectionState` cada tanto, o revisar el log del server buscando
`No se pudo mandar el recordatorio`.

## 3. Configurar VetAdmin

En `/srv/docker/vet-admin/server/.env`:

```bash
EVOLUTION_URL=http://evolution:8080
EVOLUTION_API_KEY=<la misma del stack de Evolution>
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
