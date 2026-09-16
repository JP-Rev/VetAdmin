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
