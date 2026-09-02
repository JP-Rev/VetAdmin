# CLAUDE.md — Vet-Admin

Contexto para retomar este proyecto en sesiones futuras. Para arquitectura/stack ver [README.md](README.md).

## Infraestructura compartida del VPS

Este repo corre en el mismo VPS que Facturacion-Web y Kinetic (`vetadmin.frodosoft.com.ar`, instancia única por ahora, ver `docker-compose.yml` en la raíz). La documentación operativa del servidor (Nginx, Cloudflare, backups, incidentes) vive en el repo `infra-notes-vps-hostinger`, no acá — es la fuente de verdad si necesitás saber algo del estado real del servidor:

- `proyectos/vet-admin.md` — estado de este proyecto en el VPS.
- `proyectos/vet-admin.md` — estado de este proyecto en el VPS.
- `vps/mail.md` — relay SMTP compartido (Mailgun) para mandar mail sin guardar credenciales propias. **Aplica directamente acá**: Vet-Admin ya tiene auth real (`server/src/auth.js`, JWT en cookie httpOnly + `User.passwordHash`), le faltan los endpoints de recuperación de contraseña + el mailer. **Leer ese documento antes de tocar nada de mailer**: el mecanismo es una red Docker compartida (`mail_net`, host SMTP `mail`, puerto `25`), y hay dos detalles que ya costaron horas de debug en otra app — `tls: { rejectUnauthorized: false }` es obligatorio (el relay usa certificado autofirmado), y el remitente tiene que ser `@mail.frodosoft.com.ar`. Kinetic ya implementó todo esto el 23/08, sirve de referencia.
- `vps/backups.md` — esquema de backups del VPS. Ver la convención de storage abajo.

## Storage: todo bajo `/srv/storage/vetadmin/`

🔴 **Cualquier archivo que esta app persista en disco tiene que quedar bajo `/srv/storage/vetadmin/` en el VPS.** El backup automático del servidor recorre `/srv/storage/` para respaldar los archivos de las tres apps — lo que se guarde fuera de ese árbol **no se respalda** y se pierde si falla el VPS.

Esto motivó un cambio (28/08): `STORAGE_ROOT_HOST` tenía como default `../storage/vet-admin`, una ruta **relativa** que en el VPS resolvía a `/srv/docker/storage/vet-admin` — fuera del árbol de backup. Ahora el default es `/srv/storage/vetadmin`. Si agregás una carpeta nueva de archivos (reportes, exports, adjuntos de otro tipo), que cuelgue de ahí.

⚠️ **La base todavía es la excepción**: vive en un volumen Docker nombrado (`sqlite_data`), no bajo `/srv/storage/`. Está respaldada igual, pero el script de backup tiene que listarla a mano en vez de descubrirla sola como las de Kinetic y Facturacion-Web. Migrarla a `/srv/storage/vetadmin/database/vetadmin.db` la alinearía con las otras dos — requiere parar el stack y copiar el archivo, ver `vps/backups.md` sección 12.

⚠️ **Convención del VPS**: si este proyecto migra a multiempresa (un stack Docker por cliente, como ya hace Kinetic), cualquier `docker-compose.yml` por cliente nuevo necesita un `name:` explícito (`vetadmin-<slug>`) para evitar colisión de nombre de proyecto con otra app del mismo VPS — ver incidente real en `infra-notes-vps-hostinger/plan-multiempresa-y-backups.md` sección 0b.
