import nodemailer from 'nodemailer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ASSETS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets')
const LOGO_PATH = path.join(ASSETS_DIR, 'frodosoft-logo-white.png')
const LOGO_CID = 'frodosoft-logo'

// Relay SMTP compartido del VPS (Mailgun via Postfix, /srv/docker/mail) para
// mail del sistema. Misma implementacion que Facturacion-Web y Kinetic; la
// fuente de verdad es infra-notes-vps-hostinger/vps/mail.md.
//
// Se le habla CONTENEDOR A CONTENEDOR por la red Docker compartida "mail_net":
// host = "mail" (el container_name del relay), puerto 25 (el interno del
// contenedor). El servicio `server` tiene que estar en esa red -- ver
// docker-compose.yml en la raiz.
//
// NO usar "host.docker.internal:2525": se probo en produccion el 19/08 en la
// otra app y da "Connection timeout". El 2525 esta publicado solo en
// 127.0.0.1 del host, mientras que host.docker.internal resuelve a la IP del
// bridge (172.17.0.1), donde ese puerto no escucha -- y ademas UFW bloquea el
// trafico entrante por el bridge.
//
// El remitente esta obligado a ser @mail.frodosoft.com.ar (unico dominio
// verificado en Mailgun).
const RELAY_HOST = process.env.SYSTEM_MAIL_RELAY_HOST || 'mail'
const RELAY_PORT = Number(process.env.SYSTEM_MAIL_RELAY_PORT || 25)
const MAIL_FROM = process.env.SYSTEM_MAIL_FROM || 'noreply@mail.frodosoft.com.ar'

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// Restricciones de email, no de web: todo el CSS va inline (Gmail descarta
// <style> y las clases), la maqueta usa <table> (no flex/grid, que Outlook no
// soporta), y el logo se adjunta con cid: en vez de una URL o un data: --
// Gmail bloquea imagenes en data: y una URL de la app no siempre es
// alcanzable desde el cliente de correo.
const renderSystemEmailHtml = ({ title, intro, ctaLabel, ctaUrl, footnote }) => {
  const ink = '#102133'
  const muted = '#5a6d82'
  const accent = '#10a39e'
  const border = '#dbe4ef'
  const heroGradient = 'linear-gradient(135deg, #0f172a 0%, #172554 60%, #0f766e 100%)'
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#eef3f7;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3f7;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

          <tr><td style="background:#0f172a;background-image:${heroGradient};border-radius:20px 20px 0 0;padding:28px 30px;" align="left">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="padding-right:12px;" valign="middle">
                <img src="cid:${LOGO_CID}" width="34" alt="FrodoSoft"
                     style="display:block;border:0;width:34px;height:auto;" />
              </td>
              <td valign="middle">
                <span style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:19px;font-weight:700;color:#f8fbfd;letter-spacing:.2px;">VetAdmin</span>
              </td>
            </tr></table>
            <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:26px;line-height:1.2;font-weight:700;color:#f8fbfd;margin-top:18px;">
              ${escapeHtml(title)}
            </div>
          </td></tr>

          <tr><td style="background:#ffffff;border:1px solid ${border};border-top:0;border-radius:0 0 20px 20px;padding:28px 30px;">
            <p style="margin:0 0 20px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${ink};">
              ${escapeHtml(intro)}
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="border-radius:12px;background:${accent};">
                <a href="${escapeHtml(ctaUrl)}"
                   style="display:inline-block;padding:13px 26px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">
                  ${escapeHtml(ctaLabel)}
                </a>
              </td>
            </tr></table>

            <p style="margin:22px 0 6px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${muted};">
              Si el boton no funciona, copia y pega este enlace en tu navegador:
            </p>
            <p style="margin:0;font-family:Consolas,Menlo,monospace;font-size:12px;line-height:1.5;color:${accent};word-break:break-all;">
              ${escapeHtml(ctaUrl)}
            </p>

            <div style="margin-top:24px;padding-top:18px;border-top:1px solid ${border};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${muted};">
              ${escapeHtml(footnote)}
            </div>
          </td></tr>

          <tr><td align="center" style="padding:16px 0 0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:${muted};">
            Mail automatico de VetAdmin &middot; no respondas a esta direccion
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

export const buildPasswordResetEmail = (resetUrl) => ({
  subject: 'Recuperar contraseña - VetAdmin',
  text: `Para restablecer tu contraseña entra a este link (valido por 1 hora): ${resetUrl}\n\nSi no pediste esto, ignora este mail.`,
  html: renderSystemEmailHtml({
    title: 'Recuperar contraseña',
    intro: 'Recibimos un pedido para restablecer la contraseña de tu cuenta de VetAdmin. Hace clic en el boton para elegir una nueva.',
    ctaLabel: 'Restablecer contraseña',
    ctaUrl: resetUrl,
    footnote: 'El enlace vence en 1 hora y se puede usar una sola vez. Si no pediste esto, podes ignorar este mail: tu contraseña no cambia.',
  }),
})

export const sendSystemEmail = async ({ to, subject, text, html }) => {
  if (!to) throw new Error('Destinatario requerido')
  if (!subject) throw new Error('Asunto requerido')

  const transporter = nodemailer.createTransport({
    host: RELAY_HOST,
    port: RELAY_PORT,
    secure: false,
    // El relay anuncia STARTTLS con un certificado autofirmado, asi que
    // nodemailer cifraba pero fallaba al validarlo ("self-signed
    // certificate") y cortaba la conexion. Se sigue cifrando el salto, solo
    // que sin exigir una CA reconocida.
    //
    // Es seguro SOLO porque este salto es contenedor-a-contenedor dentro de
    // la red privada mail_net (nunca sale del host): no hay por donde
    // interceptarlo. El tramo que si viaja por internet -- del relay a
    // Mailgun -- lo cifra y valida Postfix aparte
    // (smtp_tls_security_level=encrypt).
    tls: { rejectUnauthorized: false },
  })

  // El logo va como adjunto inline (cid:). Si el archivo no estuviera, se
  // manda igual sin imagen -- nunca se pierde un mail por el logo.
  const attachments = fs.existsSync(LOGO_PATH)
    ? [{ filename: 'frodosoft.png', path: LOGO_PATH, cid: LOGO_CID, contentDisposition: 'inline' }]
    : []

  await transporter.sendMail({ from: MAIL_FROM, to, subject, text, html, attachments })
}
