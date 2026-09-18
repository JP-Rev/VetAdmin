# CLAUDE.md — Vet-Admin

Contexto para retomar este proyecto en sesiones futuras. Para arquitectura/stack ver [README.md](README.md).

## Infraestructura compartida del VPS

Este repo corre en el mismo VPS que Facturacion-Web y Kinetic (`vetadmin.frodosoft.com.ar`, instancia única por ahora, ver `docker-compose.yml` en la raíz). La documentación operativa del servidor (Nginx, Cloudflare, backups, incidentes) vive en el repo `infra-notes-vps-hostinger`, no acá — es la fuente de verdad si necesitás saber algo del estado real del servidor:

- `proyectos/vet-admin.md` — estado de este proyecto en el VPS.
- `vps/mail.md` — relay SMTP compartido (Mailgun) para mandar mail sin guardar credenciales propias. **Leer ese documento antes de tocar nada de mailer.** Acá ya se usa para la recuperación de contraseña (ver sección propia más abajo).
- `vps/backups.md` — esquema de backups del VPS. Ver la convención de storage abajo.

## Storage: todo bajo `/srv/storage/vetadmin/`

🔴 **Cualquier archivo que esta app persista en disco tiene que quedar bajo `/srv/storage/vetadmin/` en el VPS.** El backup automático del servidor recorre `/srv/storage/` para respaldar los archivos de las tres apps — lo que se guarde fuera de ese árbol **no se respalda** y se pierde si falla el VPS.

Esto motivó un cambio (28/08): `STORAGE_ROOT_HOST` tenía como default `../storage/vet-admin`, una ruta **relativa** que en el VPS resolvía a `/srv/docker/storage/vet-admin` — fuera del árbol de backup. Ahora el default es `/srv/storage/vetadmin`. Si agregás una carpeta nueva de archivos (reportes, exports, adjuntos de otro tipo), que cuelgue de ahí.

⚠️ **La base todavía es la excepción**: vive en un volumen Docker nombrado (`sqlite_data`), no bajo `/srv/storage/`. Está respaldada igual, pero el script de backup tiene que listarla a mano en vez de descubrirla sola como las de Kinetic y Facturacion-Web. Migrarla a `/srv/storage/vetadmin/database/vetadmin.db` la alinearía con las otras dos — requiere parar el stack y copiar el archivo, ver `vps/backups.md` sección 12.

⚠️ **Convención del VPS**: si este proyecto migra a multiempresa (un stack Docker por cliente, como ya hace Kinetic), cualquier `docker-compose.yml` por cliente nuevo necesita un `name:` explícito (`vetadmin-<slug>`) para evitar colisión de nombre de proyecto con otra app del mismo VPS — ver incidente real en `infra-notes-vps-hostinger/plan-multiempresa-y-backups.md` sección 0b.

## Recuperación de contraseña por mail

Implementada (13/09), calcada de Facturacion-Web. `POST /api/auth/forgot-password`
manda el link y `POST /api/auth/reset-password` lo consume; ambas van **antes**
de `requireAuth` en `server/src/app.js`, porque justamente se usan cuando no se
puede iniciar sesión. El token vive 1 hora, es de un solo uso y en la base queda
sólo su sha256 (`User.resetTokenHash`): ni con la base en la mano se puede
fabricar un link. `forgot-password` responde 200 exista o no el email, para no
filtrar qué direcciones están registradas.

Los usuarios se administran en Configuración → Usuarios (`/api/usuarios`).
Dos reglas evitan quedarse afuera, iguales a las de Facturacion-Web: no se
puede borrar el propio usuario ni el último que queda; además borrar pide la
contraseña del que borra. Y ojo con el seed:
`admin@vetadmin.local` no es un buzón real, así que a esa cuenta el link de
recuperación **no le llega** — conviene que al menos un usuario tenga un mail
de verdad.

El link llega como `?reset=<token>` **antes del hash** (`https://host/?reset=…#/`)
porque el front usa HashRouter; `LoginForm` lo lee de `window.location.search`.

🔴 **El mail sale por el relay SMTP compartido del VPS, no por credenciales
propias** (`server/src/mailer.js`). La fuente de verdad es `vps/mail.md` en
`infra-notes-vps-hostinger`. Tres cosas que no se pueden cambiar sin romperlo:

- El servicio `server` tiene que estar en la red Docker `mail_net` (ya está en
  `docker-compose.yml`, como `external: true`). Si esa red no existe en el VPS:
  `docker network create mail_net`. Sin eso el mail no sale.
- `tls: { rejectUnauthorized: false }` es obligatorio: el relay usa certificado
  autofirmado. Es seguro porque ese salto es contenedor a contenedor dentro de
  `mail_net`; el tramo que sí viaja por internet lo cifra y valida Postfix.
- El remitente tiene que ser `@mail.frodosoft.com.ar`, único dominio verificado
  en Mailgun.

## Permisos por usuario

**Marca de admin** (`User.esAdmin`, default `true` por lo mismo que abajo):
separa ver de escribir en el módulo Usuarios. Con el permiso `usuarios` a secas
se ve la lista; crear, editar, eliminar, repartir permisos y marcar admin pide
además ser admin (`requireAdmin` en `permisos.js`, montado sobre POST/PATCH/
DELETE de `routes/usuarios.js`). Nadie puede quitarse a sí mismo la marca.

Cuatro módulos, en `server/src/permisos.js` (el front los espeja en
`contexts/AuthContext.tsx`): `general` (dashboard, clientes, mascotas, turnos,
historia clínica), `comercial` (ventas, productos, gastos), `usuarios` y
`clinica` (editar los datos de la veterinaria). Se guardan en `User.permisos`
como JSON de strings porque SQLite no tiene arrays; el default da los cuatro,
así que nadie perdió acceso al agregarse la columna.

Tres cosas para no romperlo:

- 🔴 **El permiso se chequea en el backend** (`requirePermiso` montado sobre los
  grupos de rutas en `app.js`). Esconder una opción del sidebar no es un
  permiso: el endpoint se puede llamar a mano igual.
- **Los catálogos (razas, enfermedades, cirugías, categorías) no se revocan** a
  propósito: sin razas no se da de alta una mascota y sin enfermedades ni
  cirugías no se carga una consulta. Por eso alguien sin ningún módulo igual
  entra, y aterriza en `/settings/razas`.
- **Nadie puede quitarse a sí mismo el acceso a Usuarios ni la marca de
  admin.** Como para editar permisos ya hay que tener las dos cosas, esas
  reglas garantizan que siempre quede alguien capaz de administrar: no hace
  falta contar cuántos hay.

`GET /api/bootstrap` sigue devolviendo todo: los permisos son de acceso a
módulos, no de confidencialidad entre el personal de la misma veterinaria.

Configuración dejó de ser una pantalla con pestañas: cada sección es una ruta
(`/settings/<slug>`, ver `SECCIONES_CONFIG` en `pages/SettingsPage.tsx`) y entra
al sidebar como submenú desplegable.

## Recordatorios de turno por WhatsApp

De cada turno salen **dos** WhatsApp: uno el día anterior y otro una hora antes.
El envío lo hace **Evolution API**, un servicio compartido del VPS que mantiene
la sesión de WhatsApp: cómo levantarlo, crear la instancia y vincular el número
está en `vps/evolution.md` del repo `infra-notes-vps-hostinger` — **no en este
repo**, porque lo usan también las otras apps. Acá vive sólo el que envía
(`server/src/whatsapp.js` y `server/src/recordatorios.js`).

**Las dos ventanas son bandas disjuntas**, no acumulativas: el aviso del día
anterior cubre de 1440 a 60 minutos antes, y el de la hora previa de 60 a 0.
Por eso nunca hay dos avisos vencidos al mismo tiempo, y un turno que se carga
media hora antes recibe un solo mensaje en vez de los dos juntos. Cada banda
tiene su columna propia (`recordatorioDiaAnteriorEnviadoAt` y
`recordatorioEnviadoAt`); el segundo conserva el nombre viejo a propósito,
porque renombrarlo haría que `prisma db push` borre la columna y con ella las
marcas de lo ya avisado.

**El número al que se deriva al cliente se configura** en Configuración → Datos
de la veterinaria (`Clinica.whatsappContacto`). La línea desde la que sale el
mensaje es la de la sesión de Evolution y no recibe respuestas, así que el
mensaje invita a escribir a ese otro número. Si está vacío, el mensaje sale
igual pero sin el enlace.

Lo que hay que saber para no romperlo:

- **El número remitente es el de la sesión de Evolution**, no algo que mande la
  app en cada pedido. Para cambiarlo hay que revincular otro WhatsApp.
- El servicio `server` tiene que estar en la red Docker `evolution_net` (ya está
  en `docker-compose.yml`, como `external: true`). Si no existe en el VPS:
  `docker network create evolution_net`.
- 🔴 **Depende del huso del contenedor.** `Turno.fecha` guarda la fecha como
  medianoche UTC y `Turno.hora` es texto: el instante real se arma combinándolos
  con el huso del proceso. `docker-compose.yml` fija
  `TZ=America/Argentina/Buenos_Aires`; en UTC los avisos salen 3 horas
  corridos. `iniciarRecordatorios()` loguea el huso al arrancar y avisa si
  quedó en UTC.
- **Las marcas de envío son lo que evita el doble aviso.** Se marca la columna
  del aviso que se mandó, y también cuando el teléfono no se puede normalizar
  (no hay nada que reintentar). Si falla Evolution **no** se marca, así la
  pasada siguiente reintenta.
- 🔴 **Reprogramar o reactivar un turno limpia las marcas** (`seReprogramo` y
  `seReactivo` en `routes/turnos.js`), así el cliente recibe el aviso que
  corresponde. Sin eso, quien reprograma no recibía ningún recordatorio: las
  marcas del horario viejo seguían puestas. Se compara contra lo guardado —para
  eso turnos pasa `loadCurrent: true` a `crudRouter`— porque el formulario manda
  `fecha`, `hora` y `estado` en toda edición, incluso cuando se cambió sólo el
  motivo: limpiarlas a ciegas mandaría un recordatorio repetido cada vez que
  alguien edita el turno. Reactivar es pasar a `Pendiente` desde un estado que
  **no** era `Pendiente` (un turno cancelado y repuesto necesita avisarse de
  nuevo, porque al cliente se le había dicho que no viniera).
- **El texto usa el formato de WhatsApp, no Markdown**: `*negrita*`, `_cursiva_`
  y las dos anidadas (`*_texto_*`). Va sólo el nombre de pila.
- Sin `EVOLUTION_URL`, `EVOLUTION_API_KEY` y `EVOLUTION_INSTANCE` el módulo
  queda inerte y la app arranca igual.

### La sesión se cae en silencio: por eso hay un vigilante

Si desvinculan el dispositivo, si WhatsApp corta la sesión o si el teléfono pasa
~14 días sin conectarse (ahí WhatsApp desvincula los dispositivos companion), los
envíos dejan de salir y **nada lo dice**. Sin vigilancia, la veterinaria se
entera porque un cliente no vino.

`vigilarSesion()` consulta `connectionState` en cada pasada y **avisa en la
transición, no en cada pasada**: con un chequeo cada 5 minutos, una sesión caída
un fin de semana serían casi 600 mails. Si sigue caída insiste cada
`ALERTA_REPETIR_HORAS` (12 por defecto), para que un aviso perdido no deje el
problema invisible para siempre. También avisa cuando se recupera.

- **Destinatario**: `ALERTA_WHATSAPP_EMAIL`, y si está vacío el email de
  Configuración → Datos de la veterinaria. Sin ninguno de los dos, el aviso
  queda sólo en el log. El mail sale por el mismo relay compartido.
- **Con la sesión caída no se intenta mandar nada.** Los turnos no pierden el
  aviso: al no marcarse, salen solos cuando la sesión vuelva — siempre que el
  turno todavía no haya pasado.
- El estado previo se guarda **en memoria** a propósito: un reinicio vuelve a
  avisar si sigue caída, que es lo que conviene.
- Que falle el mail nunca tumba la pasada de recordatorios.

## Campo de hora de los turnos

🔴 **No usar `<input type="time">`.** Su desplegable es el del navegador y queda
abierto después de elegir los minutos: no hay forma de cerrarlo desde la página
(existe `showPicker()`, no hay `hidePicker()`). Por eso el campo es
`components/common/TimePicker.tsx`, un combobox propio.

- **Se escribe a mano o se elige de la lista**, que sí cierra al elegir.
  `normalizarHora` (en `lib/hora.ts`) interpreta `9`, `930`, `9.30` y `9:30`
  como las nueve y media. Lo que no se puede leer como hora **no se recorta a
  algo cercano**: se vuelve al último valor válido, porque guardar un turno a
  una hora que nadie eligió es peor que rechazar el tipeo.
- **Las opciones cancelan el `mousedown`** (`preventDefault`). Si no, el `blur`
  del input se dispara antes que el `click` y la lista se cierra sin haber
  elegido nada. Lo mismo el botón del chevron.
- **`onBlur` normaliza**, que es lo que cubre salir con Tab. Sin eso, tabular
  dejaba lo tipeado en crudo en el formulario.
- **La franja y el intervalo salen de Configuración → Datos de la veterinaria**
  (`Clinica.turnoHoraInicio`, `turnoHoraFin`, `turnoIntervaloMin`). Son sólo
  sugerencias: el horario se puede escribir libremente y caer fuera de la franja.
- 🔴 **No agregar validación de superposición de turnos.** La disponibilidad la
  maneja el profesional; la app permite solapar a propósito.

## Botón Atrás del teléfono

La app usa `HashRouter`, así que moverse entre pantallas siempre anduvo. Lo que
no existía para el navegador eran los **overlays**: con un modal abierto, Atrás
se llevaba puesta la pantalla entera —o la app, si era la primera— en vez de
cerrar el modal.

`useCerrarConAtras(activo, alCerrar)` en `lib/atras.ts` apila una entrada de
historial mientras el overlay está abierto. La URL no cambia, así que el router
ni se entera: sólo le damos al botón Atrás algo que consumir. Está puesto en
`components/Modal.tsx` —lo que cubre **los 23 modales de una vez**, porque todos
usan ese componente— y en el sidebar del celular.

Tres cosas que no son obvias:

- 🔴 **Al apilar se conserva el estado previo** (`{...history.state, marca}`).
  React-router guarda ahí su `idx`, que es la profundidad de navegación.
  Pisarlo deja al router sin saber a qué altura está.
- **Al cerrar por otra vía** (la X, guardar, clic afuera) hay que sacar la
  entrada, pero **sólo si sigue siendo la actual**. Varias pantallas navegan con
  `replace: true` al cerrar el modal, lo que pisa nuestra entrada con la del
  router: ahí un `back()` volvería a la pantalla anterior de verdad, reabriendo
  el modal recién cerrado.
- **`alCerrar` va por referencia.** Como dependencia del efecto haría que se
  desmonte y remonte en cada render, apilando una entrada por render.

### Aviso antes de salir

`components/common/GuardiaSalida.tsx` apila un centinela al arrancar y pregunta
antes de que Atrás cierre la app.

🔴 **Para saber si estamos en el fondo se mira `idx`, no la marca del
centinela.** Ninguna entrada del router lleva la marca, así que con ese criterio
el aviso saltaba en **cada** Atrás entre pantallas. `esElFondo` da true cuando
`idx` es 0 o no existe.

**Cerrar la app de verdad sólo es posible en la PWA instalada**, y las dos cosas
de abajo están comprobadas en Chromium, no supuestas:

- 🔴 **`history.go(-n)` no sirve para salir.** El navegador recorta el salto al
  principio del historial: pedir más pasos de los que hay es un **no-op
  silencioso**, la página queda viva y `history.length` no cambia. La primera
  versión de esto usaba `go(-2)` y por eso el botón no hacía nada.
- 🔴 **`window.close()` en una pestaña común tampoco cierra.** El navegador sólo
  lo permite si la ventana la abrió un script, o si es una aplicación instalada.

Por eso `salir()` intenta `window.close()` y, si a los 300 ms seguimos vivos,
el diálogo cambia a un aviso que explica por qué — un botón que aparenta estar
roto es peor que uno que dice qué pasó. El texto distingue si está instalada
(`display-mode: standalone`) de si es una pestaña, porque el remedio es
distinto.

## Incidentes

**04/09 — se perdieron datos en un `db push`.** El deploy de la tabla `Pesaje`
corría un script de migración con `docker compose run`, pero `server/Dockerfile`
no copiaba `scripts/` a la imagen: los pasos de exportar/importar fallaron con
`Cannot find module`, el `prisma db push --accept-data-loss` que iba en el medio
corrió igual y se llevó `Mascota.peso` (3 valores, de prueba) y
`Cliente.domicilio` (1, ficticio). Ya está arreglado (`COPY scripts ./scripts`).
La regla quedó anotada en `server/scripts/README.md`: **si un paso del deploy
corre un script, verificar primero que el script exista en la imagen y no seguir
si el paso anterior falló.**
