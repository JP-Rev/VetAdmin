import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { asyncRoute } from '../http.js'
import { toClinica, CLINICA_ID, getClinica } from '../serializers.js'
import { PERMISOS, requirePermiso } from '../permisos.js'

const router = Router()

// "HH:MM" de 00:00 a 23:59. Comparar dos de estos como texto equivale a
// compararlos como hora, porque están siempre con dos dígitos.
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

const clinicaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  direccion: z.string().trim().max(200).nullish(),
  telefono: z.string().trim().max(50).nullish(),
  email: z.string().trim().email('Email inválido').max(120).nullish().or(z.literal('')),
  whatsappContacto: z.string().trim().max(50).nullish(),

  // La franja y el intervalo sólo arman la lista de sugerencias. El tope de 240
  // y el piso de 5 evitan configuraciones que generen listas inusables; el
  // formato HH:MM se valida acá para no depender de lo que mande el front.
  turnoIntervaloMin: z.coerce
    .number()
    .int('El intervalo debe ser un número entero de minutos')
    .min(5, 'El intervalo mínimo es de 5 minutos')
    .max(240, 'El intervalo máximo es de 240 minutos')
    .optional(),
  turnoHoraInicio: z.string().regex(HHMM, 'La hora de inicio debe tener formato HH:MM').optional(),
  turnoHoraFin: z.string().regex(HHMM, 'La hora de fin debe tener formato HH:MM').optional(),
})
  .refine(
    (d) =>
      d.turnoHoraInicio === undefined ||
      d.turnoHoraFin === undefined ||
      d.turnoHoraFin >= d.turnoHoraInicio,
    { message: 'La hora de fin no puede ser anterior a la de inicio', path: ['turnoHoraFin'] }
  )

router.get(
  '/',
  asyncRoute(async (_req, res) => {
    res.json(toClinica(await getClinica()))
  })
)

router.put(
  '/',
  // El GET lo puede hacer cualquiera (el nombre se muestra en toda la app);
  // cambiar los datos de la veterinaria es lo que pide permiso.
  requirePermiso(PERMISOS.CLINICA),
  asyncRoute(async (req, res) => {
    const data = clinicaSchema.parse(req.body)
    const payload = {
      nombre: data.nombre,
      direccion: data.direccion || null,
      telefono: data.telefono || null,
      email: data.email || null,
      whatsappContacto: data.whatsappContacto || null,
    }

    // Sólo se pisan si vinieron: un PUT que no los manda no tiene por qué
    // resetear la agenda a los valores por defecto.
    if (data.turnoIntervaloMin !== undefined) payload.turnoIntervaloMin = data.turnoIntervaloMin
    if (data.turnoHoraInicio !== undefined) payload.turnoHoraInicio = data.turnoHoraInicio
    if (data.turnoHoraFin !== undefined) payload.turnoHoraFin = data.turnoHoraFin

    const clinica = await prisma.clinica.upsert({
      where: { id: CLINICA_ID },
      create: { id: CLINICA_ID, ...payload },
      update: payload,
    })

    res.json(toClinica(clinica))
  })
)

export default router
