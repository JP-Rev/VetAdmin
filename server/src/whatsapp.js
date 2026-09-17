/**
 * Envío de WhatsApp por Evolution API.
 *
 * Evolution es un servicio aparte que corre en el VPS y mantiene una sesión de
 * WhatsApp abierta (la del número de la veterinaria, vinculada escaneando un
 * QR). Esta app sólo le pega por HTTP; el número desde el que sale el mensaje
 * es el de esa sesión, no algo que se mande en cada pedido.
 *
 * Config por entorno (ver .env.example):
 *   EVOLUTION_URL       http://evolution:8080
 *   EVOLUTION_API_KEY   la apikey global de Evolution
 *   EVOLUTION_INSTANCE  nombre de la instancia (ej. "vetadmin")
 *
 * Sin esas tres variables el módulo queda inerte y lo dice en el log: la app
 * arranca igual, simplemente no manda recordatorios.
 */

const url = () => (process.env.EVOLUTION_URL || '').replace(/\/+$/, '')
const apiKey = () => process.env.EVOLUTION_API_KEY || ''
const instancia = () => process.env.EVOLUTION_INSTANCE || ''

export const whatsappConfigurado = () => Boolean(url() && apiKey() && instancia())

/**
 * Deja un teléfono argentino como lo espera WhatsApp: 549 + área + número,
 * sin el 0 inicial ni el 15.
 *
 * Es deliberadamente estricto: si no llega a diez dígitos de área+abonado
 * devuelve null y el recordatorio no se manda. Mandarle un mensaje al número
 * equivocado es peor que no mandarlo.
 */
export function normalizarTelefono(crudo) {
  let d = String(crudo ?? '').replace(/\D/g, '')
  if (!d) return null

  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('54')) d = d.slice(2)
  if (d.startsWith('9') && d.length > 10) d = d.slice(1)
  if (d.startsWith('0')) d = d.slice(1)

  // El 15 va después del código de área, que en Argentina tiene 2, 3 o 4
  // dígitos. Si sacándolo quedan los 10 que corresponden, era un 15.
  if (d.length === 12) {
    for (const corte of [2, 3, 4]) {
      if (d.slice(corte, corte + 2) === '15') {
        d = d.slice(0, corte) + d.slice(corte + 2)
        break
      }
    }
  }

  if (d.length !== 10) return null
  return `549${d}`
}

/**
 * Estado de la sesión de WhatsApp: 'open' cuando está vinculada y puede mandar.
 *
 * Existe porque la sesión se cae en silencio. Si desvinculan el dispositivo, si
 * WhatsApp corta la sesión o si el teléfono pasa ~14 días sin conectarse (ahí
 * WhatsApp desvincula los dispositivos companion), los envíos dejan de salir y
 * nada avisa: los recordatorios simplemente no llegan.
 *
 * Nunca lanza. Devuelve `{ ok, estado, detalle }` para que el que llama pueda
 * distinguir los tres casos que importan: sesión vinculada, sesión caída, y
 * Evolution inalcanzable (contenedor apagado, red mal, apikey equivocada).
 */
export async function estadoSesion() {
  if (!whatsappConfigurado()) return { ok: false, estado: 'sin-configurar', detalle: 'Faltan las variables de Evolution' }

  try {
    const respuesta = await fetch(`${url()}/instance/connectionState/${instancia()}`, {
      headers: { apikey: apiKey() },
    })

    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => '')
      return { ok: false, estado: 'error', detalle: `Evolution respondió ${respuesta.status}: ${detalle.slice(0, 200)}` }
    }

    const cuerpo = await respuesta.json().catch(() => ({}))
    // La respuesta viene como { instance: { instanceName, state } }; se acepta
    // también `state` en la raíz por si cambia entre versiones de Evolution.
    const estado = cuerpo?.instance?.state ?? cuerpo?.state ?? 'desconocido'
    return { ok: estado === 'open', estado, detalle: estado === 'open' ? null : `La sesión está en "${estado}"` }
  } catch (err) {
    return { ok: false, estado: 'inalcanzable', detalle: `No se pudo consultar Evolution: ${err.message}` }
  }
}

/** Manda un texto. Lanza si Evolution responde mal, para que el que llama lo loguee. */
export async function enviarWhatsApp(telefono, texto) {
  if (!whatsappConfigurado()) throw new Error('Evolution API no está configurado')

  const numero = normalizarTelefono(telefono)
  if (!numero) throw new Error(`Teléfono inválido para WhatsApp: "${telefono}"`)

  const respuesta = await fetch(`${url()}/message/sendText/${instancia()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey() },
    body: JSON.stringify({ number: numero, text: texto }),
  })

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '')
    throw new Error(`Evolution respondió ${respuesta.status}: ${detalle.slice(0, 300)}`)
  }
  return respuesta.json().catch(() => ({}))
}
