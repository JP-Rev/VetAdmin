import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../prisma.js'
import { asyncRoute } from '../http.js'
import { toUsuario } from '../serializers.js'
import { requirePasswordConfirmation } from '../auth.js'
import { PERMISOS, PERMISOS_VALIDOS, serializarPermisos, requireAdmin } from '../permisos.js'

/**
 * Modulo de usuarios. El permiso `usuarios` deja VER la lista; escribirla
 * (crear, editar, borrar, repartir permisos y marcar admin) pide ademas la
 * marca de admin -- por eso el GET va suelto y el resto lleva requireAdmin.
 *
 * Tres reglas que evitan quedarse afuera: no se puede borrar el propio
 * usuario, ni el ultimo que queda, ni sacarse a uno mismo admin o el acceso a
 * Usuarios.
 */
const router = Router()

const MIN_PASSWORD = 8

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Email inválido')
  .max(120)

const passwordSchema = z
  .string()
  .min(MIN_PASSWORD, `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`)

const permisosSchema = z.array(z.enum(PERMISOS_VALIDOS)).optional()

const altaSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  permisos: permisosSchema,
  esAdmin: z.boolean().optional(),
})

// En la edicion todo es opcional: se manda solo lo que se cambia. Una
// contraseña vacia significa "no la toques", no "borrala" -- el GET nunca
// devuelve la actual, asi que el formulario siempre llega vacio.
const edicionSchema = z
  .object({
    email: emailSchema.optional(),
    nuevaPassword: passwordSchema.optional(),
    permisos: permisosSchema,
    esAdmin: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.email !== undefined ||
      d.nuevaPassword !== undefined ||
      d.permisos !== undefined ||
      d.esAdmin !== undefined,
    { message: 'No hay nada para cambiar' }
  )


router.get(
  '/',
  asyncRoute(async (_req, res) => {
    const usuarios = await prisma.user.findMany({ orderBy: { email: 'asc' } })
    res.json(usuarios.map(toUsuario))
  })
)

router.post(
  '/',
  requireAdmin,
  asyncRoute(async (req, res) => {
    const { email, password, permisos, esAdmin } = altaSchema.parse(req.body)

    if (await prisma.user.findUnique({ where: { email } })) {
      return res.status(400).json({ error: `Ya hay un usuario con el email ${email}` })
    }

    const usuario = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 10),
        // Sin permisos explicitos entra con General, que es lo minimo util.
        permisos: serializarPermisos(permisos ?? [PERMISOS.GENERAL]),
        // Explicito: una cuenta nueva no es admin salvo que se lo marquen.
        esAdmin: esAdmin ?? false,
      },
    })
    res.status(201).json(toUsuario(usuario))
  })
)

router.patch(
  '/:id',
  requireAdmin,
  asyncRoute(async (req, res) => {
    const datos = edicionSchema.parse(req.body)

    if (datos.email) {
      const otro = await prisma.user.findUnique({ where: { email: datos.email } })
      if (otro && otro.id !== req.params.id) {
        return res.status(400).json({ error: `Ya hay un usuario con el email ${datos.email}` })
      }
    }

    // Nadie puede desarmar su propio acceso a la administracion de usuarios.
    // Como para llegar hasta acá ya hay que ser admin y tener el modulo, estas
    // dos reglas garantizan que siempre quede alguien capaz de administrar:
    // no hace falta ademas contar cuantos hay.
    if (req.params.id === req.user.id) {
      if (datos.permisos && !datos.permisos.includes(PERMISOS.USUARIOS)) {
        return res.status(400).json({ error: 'No podés quitarte a vos mismo el acceso a Usuarios' })
      }
      if (datos.esAdmin === false) {
        return res.status(400).json({ error: 'No podés quitarte a vos mismo la marca de admin' })
      }
    }

    const usuario = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        email: datos.email,
        ...(datos.permisos ? { permisos: serializarPermisos(datos.permisos) } : {}),
        ...(datos.esAdmin !== undefined ? { esAdmin: datos.esAdmin } : {}),
        ...(datos.nuevaPassword
          ? {
              passwordHash: await bcrypt.hash(datos.nuevaPassword, 10),
              // Cambiar la contraseña invalida cualquier link de recuperacion
              // pendiente: si se pidio uno por error, deja de servir.
              resetTokenHash: null,
              resetTokenExpiresAt: null,
            }
          : {}),
      },
    })
    res.json(toUsuario(usuario))
  })
)

router.delete(
  '/:id',
  requireAdmin,
  // Borrar un usuario deja a alguien afuera del sistema: se pide la contraseña
  // del que lo esta borrando, mismo criterio que los adjuntos y los eventos de
  // historia clinica.
  requirePasswordConfirmation,
  asyncRoute(async (req, res) => {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'No podés eliminar tu propio usuario' })
    }
    if ((await prisma.user.count()) <= 1) {
      return res.status(400).json({ error: 'No podés eliminar el último usuario del sistema' })
    }

    await prisma.user.delete({ where: { id: req.params.id } })
    res.status(204).end()
  })
)

export default router
