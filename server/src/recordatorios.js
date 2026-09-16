import { prisma } from './prisma.js'
import { enviarWhatsApp, whatsappConfigurado, normalizarTelefono } from './whatsapp.js'
import { getClinica } from './serializers.js'

/**
 * Recordatorio de turno por WhatsApp, una hora antes.
 *
 * Corre dentro del mismo proceso del server: un `setInterval` que cada pocos
 * minutos busca los turnos que entran en la ventana y manda lo que falte. No
 * hace falta un scheduler aparte para un contenedor único.
 *
 * 🔴 Depende del huso horario del contenedor. `Turno.fecha` guarda la fecha
 * como medianoche UTC y `Turno.hora` es un texto "HH:MM": el instante real del
 * turno sale de combinarlos en la hora de la veterinaria. Si el contenedor
 * corre en UTC (el default de Docker), los recordatorios salen 3 horas
 * corridos. Por eso docker-compose fija TZ=America/Argentina/Buenos_Aires, y
 * al arrancar se loguea el huso que quedó activo.
 */

const MINUTOS_ANTES = Number(process.env.RECORDATORIO_MINUTOS_ANTES || 60)
const CADA_MINUTOS = Number(process.env.RECORDATORIO_INTERVALO_MINUTOS || 5)

/** Combina la fecha (medianoche UTC) con la hora "HH:MM" en el huso local. */
export function instanteDelTurno(turno) {
  const dia = new Date(turno.fecha).toISOString().slice(0, 10)
  const hora = /^\d{1,2}:\d{2}$/.test(turno.hora || '') ? turno.hora.padStart(5, '0') : null
  if (!hora) return null
  const instante = new Date(`${dia}T${hora}:00`)
  return Number.isNaN(instante.getTime()) ? null : instante
}

/**
 * Turnos que corresponde avisar ahora: pendientes, todavía por venir, dentro
 * de la ventana y sin recordatorio mandado.
 *
 * El límite de abajo (que el turno no haya pasado) es lo que evita que, si el
 * contenedor estuvo caído, al volver mande de golpe los recordatorios de todo
 * lo que ya ocurrió.
 */
export function turnosAAvisar(turnos, ahora = new Date()) {
  const limite = new Date(ahora.getTime() + MINUTOS_ANTES * 60 * 1000)
  return turnos.filter((t) => {
    if (t.estado !== 'Pendiente' || t.recordatorioEnviadoAt) return false
    const instante = instanteDelTurno(t)
    return instante !== null && instante > ahora && instante <= limite
  })
}

export function armarMensaje({ turno, cliente, mascota, clinica }) {
  const nombre = cliente?.nombre?.split(' ')[0] || 'Hola'
  const quien = mascota?.nombre ? ` de ${mascota.nombre}` : ''
  const donde = clinica?.nombre ? ` en ${clinica.nombre}` : ''
  const motivo = turno.motivo ? `\nMotivo: ${turno.motivo}` : ''
  return (
    `Hola ${nombre}! Te recordamos el turno${quien} hoy a las ${turno.hora}${donde}.` +
    `${motivo}\n\nSi no podés venir, avisanos respondiendo este mensaje.`
  )
}

/** Una pasada. Exportada aparte para poder probarla sin esperar al intervalo. */
export async function revisarRecordatorios(ahora = new Date()) {
  if (!whatsappConfigurado()) return { enviados: 0, fallidos: 0, salteados: 0 }

  // Sólo los turnos de hoy y mañana: no tiene sentido traer la agenda entera.
  const desde = new Date(ahora.getTime() - 24 * 60 * 60 * 1000)
  const hasta = new Date(ahora.getTime() + 48 * 60 * 60 * 1000)
  const turnos = await prisma.turno.findMany({
    where: { fecha: { gte: desde, lte: hasta }, estado: 'Pendiente', recordatorioEnviadoAt: null },
    include: { cliente: true, mascota: true },
  })

  const pendientes = turnosAAvisar(turnos, ahora)
  if (pendientes.length === 0) return { enviados: 0, fallidos: 0, salteados: 0 }

  const clinica = await getClinica()
  let enviados = 0
  let fallidos = 0
  let salteados = 0

  for (const turno of pendientes) {
    const telefono = turno.cliente?.telefono || turno.cliente?.telefonoAlt
    if (!normalizarTelefono(telefono)) {
      // Se marca igual: sin un teléfono usable no hay nada que reintentar, y
      // sin marcarlo el planificador lo volvería a mirar cada cinco minutos.
      await prisma.turno.update({ where: { id: turno.id }, data: { recordatorioEnviadoAt: new Date() } })
      console.warn(`Recordatorio salteado (turno ${turno.id}): teléfono inválido "${telefono ?? ''}"`)
      salteados++
      continue
    }

    try {
      await enviarWhatsApp(telefono, armarMensaje({ turno, cliente: turno.cliente, mascota: turno.mascota, clinica }))
      await prisma.turno.update({ where: { id: turno.id }, data: { recordatorioEnviadoAt: new Date() } })
      enviados++
    } catch (err) {
      // No se marca: si Evolution está caído, la próxima pasada reintenta.
      console.error(`No se pudo mandar el recordatorio del turno ${turno.id}:`, err.message)
      fallidos++
    }
  }

  return { enviados, fallidos, salteados }
}

export function iniciarRecordatorios() {
  const huso = Intl.DateTimeFormat().resolvedOptions().timeZone

  if (!whatsappConfigurado()) {
    console.log('Recordatorios por WhatsApp: apagados (falta configurar EVOLUTION_URL, EVOLUTION_API_KEY o EVOLUTION_INSTANCE)')
    return
  }

  console.log(
    `Recordatorios por WhatsApp: activos — ${MINUTOS_ANTES} min antes, revisando cada ${CADA_MINUTOS} min (huso ${huso})`
  )
  if (huso === 'UTC') {
    console.warn('⚠️  El contenedor está en UTC: los recordatorios van a salir corridos. Fijá TZ en docker-compose.yml.')
  }

  const pasada = () =>
    revisarRecordatorios().catch((err) => console.error('Error revisando recordatorios:', err.message))

  pasada()
  setInterval(pasada, CADA_MINUTOS * 60 * 1000)
}
