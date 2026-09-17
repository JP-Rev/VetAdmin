import { prisma } from './prisma.js'
import { enviarWhatsApp, whatsappConfigurado, normalizarTelefono, estadoSesion } from './whatsapp.js'
import { sendSystemEmail } from './mailer.js'
import { getClinica } from './serializers.js'

/**
 * Recordatorios de turno por WhatsApp: uno el día anterior y otro una hora antes.
 *
 * Corre dentro del mismo proceso del server: un `setInterval` que cada pocos
 * minutos busca los turnos que entran en alguna ventana y manda lo que falte.
 * No hace falta un scheduler aparte para un contenedor único.
 *
 * 🔴 Depende del huso horario del contenedor. `Turno.fecha` guarda la fecha
 * como medianoche UTC y `Turno.hora` es un texto "HH:MM": el instante real del
 * turno sale de combinarlos en la hora de la veterinaria. Si el contenedor
 * corre en UTC (el default de Docker), los recordatorios salen 3 horas
 * corridos. Por eso docker-compose fija TZ=America/Argentina/Buenos_Aires, y
 * al arrancar se loguea el huso que quedó activo.
 */

const MINUTOS_ANTES_HORA = Number(process.env.RECORDATORIO_MINUTOS_ANTES || 60)
const MINUTOS_ANTES_DIA = Number(process.env.RECORDATORIO_MINUTOS_ANTES_DIA || 24 * 60)
const CADA_MINUTOS = Number(process.env.RECORDATORIO_INTERVALO_MINUTOS || 5)

/**
 * Los dos avisos, del más lejano al más cercano. Cada uno tiene su columna:
 * marcar es lo que evita el doble envío.
 *
 * Las ventanas son BANDAS DISJUNTAS, no acumulativas: el aviso del día anterior
 * cubre de 24 h a 1 h antes, y el de la hora previa de 1 h a 0. Por eso nunca
 * hay dos avisos vencidos a la vez, y un turno que se carga media hora antes
 * recibe un solo mensaje —el de la hora— en vez de los dos de golpe.
 */
export const AVISOS = [
  { clave: 'dia', minutos: MINUTOS_ANTES_DIA, campo: 'recordatorioDiaAnteriorEnviadoAt' },
  { clave: 'hora', minutos: MINUTOS_ANTES_HORA, campo: 'recordatorioEnviadoAt' },
].sort((a, b) => b.minutos - a.minutos)

/** Combina la fecha (medianoche UTC) con la hora "HH:MM" en el huso local. */
export function instanteDelTurno(turno) {
  const dia = new Date(turno.fecha).toISOString().slice(0, 10)
  const hora = /^\d{1,2}:\d{2}$/.test(turno.hora || '') ? turno.hora.padStart(5, '0') : null
  if (!hora) return null
  const instante = new Date(`${dia}T${hora}:00`)
  return Number.isNaN(instante.getTime()) ? null : instante
}

/**
 * Qué aviso corresponde mandar ahora para un turno, o null si ninguno.
 *
 * Que el turno no haya pasado es lo que evita que, si el contenedor estuvo
 * caído, al volver mande de golpe los recordatorios de todo lo que ya ocurrió.
 */
export function avisoPendiente(turno, ahora = new Date()) {
  if (turno.estado !== 'Pendiente') return null
  const instante = instanteDelTurno(turno)
  if (instante === null || instante <= ahora) return null

  const faltanMin = (instante.getTime() - ahora.getTime()) / 60000

  for (let i = 0; i < AVISOS.length; i++) {
    const aviso = AVISOS[i]
    // Piso de la banda: donde arranca el aviso siguiente (0 para el último).
    const piso = AVISOS[i + 1]?.minutos ?? 0
    if (faltanMin <= aviso.minutos && faltanMin > piso) {
      return turno[aviso.campo] ? null : aviso
    }
  }
  return null
}

/** Los turnos con algún aviso vencido, cada uno con el aviso que le toca. */
export function turnosAAvisar(turnos, ahora = new Date()) {
  return turnos
    .map((turno) => ({ turno, aviso: avisoPendiente(turno, ahora) }))
    .filter((x) => x.aviso !== null)
}

/** "lunes, 16/09/2026" → "Lunes, 16/09/2026" */
function fechaLarga(instante) {
  const texto = instante.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * El mensaje que recibe el cliente.
 *
 * El formato es el de WhatsApp, no Markdown: *negrita*, _cursiva_, y las dos
 * juntas se anidan (*_texto_*). Va el nombre de pila solo — el apellido en un
 * saludo automático suena a carta del banco.
 */
export function armarMensaje({ turno, cliente, clinica }) {
  const nombre = cliente?.nombre?.trim().split(/\s+/)[0] || 'Hola'
  const instante = instanteDelTurno(turno)
  const cuando = instante ? `${fechaLarga(instante)}, a las ${turno.hora} hs.` : `las ${turno.hora} hs.`

  const lineas = [
    `¡Hola, *_${nombre}_*! 👋`,
    '',
    'Este es un recordatorio de tu turno reservado para el dia',
    `*${cuando}* 🕒✨`,
    '',
    '⚠️ Importante: Este número es exclusivo para envíos automáticos y no recibe respuestas.',
  ]

  // El enlace sale sólo si hay un número cargado y normalizable: mandar un
  // wa.me roto es peor que no ofrecer contacto.
  const contacto = normalizarTelefono(clinica?.whatsappContacto)
  if (contacto) {
    lineas.push(
      'Si necesitas reprogramar o tienes alguna consulta, por favor escríbenos directamente a través de este enlace:',
      '',
      `👉 https://wa.me/${contacto}`
    )
  }

  return lineas.join('\n')
}

// --- Vigilancia de la sesión de WhatsApp -----------------------------------
//
// La sesión se cae en silencio: si desvinculan el dispositivo, si WhatsApp corta
// la sesión o si el teléfono pasa ~14 días sin conectarse, los envíos dejan de
// salir y nada avisa. Sin esto, la veterinaria se enteraría porque un cliente no
// vino, o mirando el log a mano.

const REPETIR_ALERTA_MS = Number(process.env.ALERTA_REPETIR_HORAS || 12) * 60 * 60 * 1000

// En memoria a propósito: un reinicio vuelve a avisar si sigue caída, que es
// justamente lo que conviene. Persistirlo sería más estado para mantener a
// cambio de silenciar el aviso después de un redeploy.
let sesionOk = null
let ultimaAlerta = 0

/** A quién avisarle. Sin destinatario el aviso queda sólo en el log. */
async function destinatarioAlerta() {
  if (process.env.ALERTA_WHATSAPP_EMAIL) return process.env.ALERTA_WHATSAPP_EMAIL
  const clinica = await getClinica().catch(() => null)
  return clinica?.email || null
}

async function mandarAlerta(asunto, cuerpo) {
  const to = await destinatarioAlerta()
  if (!to) {
    console.warn('No hay a quién avisarle: cargá el email en Configuración → Datos de la veterinaria, o definí ALERTA_WHATSAPP_EMAIL.')
    return
  }
  try {
    await sendSystemEmail({ to, subject: asunto, text: cuerpo })
    console.log(`Aviso de WhatsApp enviado a ${to}`)
  } catch (err) {
    // Que falle el mail no puede tumbar la pasada de recordatorios.
    console.error('No se pudo mandar el aviso por mail:', err.message)
  }
}

/**
 * Mira el estado de la sesión y avisa cuando cambia.
 *
 * Avisa en la transición, no en cada pasada: con un chequeo cada 5 minutos, una
 * sesión caída un fin de semana serían casi 600 mails. Si sigue caída insiste
 * cada ALERTA_REPETIR_HORAS, para que un aviso perdido no deje el problema
 * invisible para siempre.
 */
export async function vigilarSesion(ahora = new Date()) {
  const estado = await estadoSesion()

  if (!estado.ok) {
    const primeraVez = sesionOk !== false
    const toca = ahora.getTime() - ultimaAlerta >= REPETIR_ALERTA_MS
    if (primeraVez || toca) {
      console.error(
        `🔴 La sesión de WhatsApp no está operativa (${estado.estado}).` +
          `${estado.detalle ? ` ${estado.detalle}.` : ''}` +
          ' Los recordatorios de turno NO están saliendo.'
      )
      await mandarAlerta(
        'Vet-Admin: los recordatorios por WhatsApp no están saliendo',
        [
          `La sesión de WhatsApp quedó en estado "${estado.estado}".`,
          estado.detalle ? `Detalle: ${estado.detalle}` : null,
          '',
          'Mientras siga así, los recordatorios de turno no se mandan. Los turnos NO pierden el aviso:',
          'al no marcarse como enviados, salen solos en cuanto la sesión vuelva — siempre que el turno',
          'todavía no haya pasado.',
          '',
          'Para reconectar hay que volver a vincular el teléfono escaneando un QR nuevo. El paso a paso',
          'está en vps/evolution.md del repo de infraestructura, sección 3.',
        ].filter((l) => l !== null).join('\n')
      )
      ultimaAlerta = ahora.getTime()
    }
    sesionOk = false
    return estado
  }

  if (sesionOk === false) {
    console.log('✅ La sesión de WhatsApp volvió a estar operativa; los recordatorios pendientes salen en esta pasada.')
    await mandarAlerta(
      'Vet-Admin: la sesión de WhatsApp se recuperó',
      'La sesión volvió a estado "open". Los recordatorios pendientes de turnos que todavía no pasaron se mandan en la próxima pasada.'
    )
  }
  sesionOk = true
  return estado
}

/** Una pasada. Exportada aparte para poder probarla sin esperar al intervalo. */
export async function revisarRecordatorios(ahora = new Date()) {
  if (!whatsappConfigurado()) return { enviados: 0, fallidos: 0, salteados: 0 }

  // Si la sesión no está vinculada no se intenta nada: los envíos fallarían y,
  // como no se marcan, se reintentan solos cuando vuelva. Lo que sí se hace es
  // avisar, porque de otro modo el corte es invisible.
  const sesion = await vigilarSesion(ahora)
  if (!sesion.ok) return { enviados: 0, fallidos: 0, salteados: 0, sesion: sesion.estado }

  // Sólo la franja que puede tener algún aviso vencido: no tiene sentido traer
  // la agenda entera. El margen extra cubre el desfase entre `fecha` (medianoche
  // UTC) y el instante real del turno.
  const desde = new Date(ahora.getTime() - 24 * 60 * 60 * 1000)
  const hasta = new Date(ahora.getTime() + (MINUTOS_ANTES_DIA + 24 * 60) * 60 * 1000)
  const turnos = await prisma.turno.findMany({
    where: {
      fecha: { gte: desde, lte: hasta },
      estado: 'Pendiente',
      OR: AVISOS.map((a) => ({ [a.campo]: null })),
    },
    include: { cliente: true, mascota: true },
  })

  const pendientes = turnosAAvisar(turnos, ahora)
  if (pendientes.length === 0) return { enviados: 0, fallidos: 0, salteados: 0 }

  const clinica = await getClinica()
  let enviados = 0
  let fallidos = 0
  let salteados = 0

  for (const { turno, aviso } of pendientes) {
    const telefono = turno.cliente?.telefono || turno.cliente?.telefonoAlt
    if (!normalizarTelefono(telefono)) {
      // Se marca igual: sin un teléfono usable no hay nada que reintentar, y
      // sin marcarlo el planificador lo volvería a mirar cada cinco minutos.
      await prisma.turno.update({ where: { id: turno.id }, data: { [aviso.campo]: new Date() } })
      console.warn(`Recordatorio (${aviso.clave}) salteado, turno ${turno.id}: teléfono inválido "${telefono ?? ''}"`)
      salteados++
      continue
    }

    try {
      await enviarWhatsApp(telefono, armarMensaje({ turno, cliente: turno.cliente, clinica }))
      await prisma.turno.update({ where: { id: turno.id }, data: { [aviso.campo]: new Date() } })
      enviados++
    } catch (err) {
      // No se marca: si Evolution está caído, la próxima pasada reintenta.
      console.error(`No se pudo mandar el recordatorio (${aviso.clave}) del turno ${turno.id}:`, err.message)
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

  const bandas = AVISOS.map((a) => `${a.minutos} min`).join(' y ')
  console.log(`Recordatorios por WhatsApp: activos — ${bandas} antes, revisando cada ${CADA_MINUTOS} min (huso ${huso})`)
  if (huso === 'UTC') {
    console.warn('⚠️  El contenedor está en UTC: los recordatorios van a salir corridos. Fijá TZ en docker-compose.yml.')
  }

  const pasada = () =>
    revisarRecordatorios().catch((err) => console.error('Error revisando recordatorios:', err.message))

  pasada()
  setInterval(pasada, CADA_MINUTOS * 60 * 1000)
}
