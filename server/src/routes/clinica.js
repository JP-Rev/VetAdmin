import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { asyncRoute } from '../http.js'
import { toClinica, CLINICA_ID, getClinica } from '../serializers.js'

const router = Router()

const clinicaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  direccion: z.string().trim().max(200).nullish(),
  telefono: z.string().trim().max(50).nullish(),
  email: z.string().trim().email('Email inválido').max(120).nullish().or(z.literal('')),
})

router.get(
  '/',
  asyncRoute(async (_req, res) => {
    res.json(toClinica(await getClinica()))
  })
)

router.put(
  '/',
  asyncRoute(async (req, res) => {
    const data = clinicaSchema.parse(req.body)
    const payload = {
      nombre: data.nombre,
      direccion: data.direccion || null,
      telefono: data.telefono || null,
      email: data.email || null,
    }

    const clinica = await prisma.clinica.upsert({
      where: { id: CLINICA_ID },
      create: { id: CLINICA_ID, ...payload },
      update: payload,
    })

    res.json(toClinica(clinica))
  })
)

export default router
