# CLAUDE.md — Vet-Admin

Contexto para retomar este proyecto en sesiones futuras. Para arquitectura/stack ver [README.md](README.md).

## Infraestructura compartida del VPS

Este repo corre en el mismo VPS que Facturacion-Web y Kinetic (`vetadmin.frodosoft.com.ar`, instancia única por ahora, ver `docker-compose.yml` en la raíz). La documentación operativa del servidor (Nginx, Cloudflare, backups, incidentes) vive en el repo `infra-notes-vps-hostinger`, no acá — es la fuente de verdad si necesitás saber algo del estado real del servidor:

- `proyectos/vet-admin.md` — estado de este proyecto en el VPS.
- `vps/mail.md` — relay SMTP compartido (Mailgun) para que cualquier app del VPS mande mail sin guardar sus propias credenciales. **Aplica directamente acá**: Vet-Admin ya tiene auth real (`server/src/auth.js`, JWT en cookie httpOnly + `User.passwordHash`), le falta implementar los endpoints de recuperación de contraseña (solicitud + reset, campo de token en `User`, pantalla de frontend) y el mailer apuntando a este relay — leer ese documento antes de tocar nada de mailer, tiene el detalle no obvio de `host.docker.internal` (conectarse a `localhost:2525` desde el contenedor **no funciona**, hace falta `extra_hosts: ["host.docker.internal:host-gateway"]` en el `docker-compose.yml`) y el dominio remitente obligatorio (`@mail.frodosoft.com.ar`, no `@frodosoft.com.ar`).

⚠️ **Convención del VPS**: si este proyecto migra a multiempresa (un stack Docker por cliente, como ya hace Kinetic), cualquier `docker-compose.yml` por cliente nuevo necesita un `name:` explícito (`vetadmin-<slug>`) para evitar colisión de nombre de proyecto con otra app del mismo VPS — ver incidente real en `infra-notes-vps-hostinger/plan-multiempresa-y-backups.md` sección 0b.
