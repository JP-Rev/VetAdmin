import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { prisma } from './prisma.js'
import { buildPasswordResetEmail, sendSystemEmail } from './mailer.js'
import { parsePermisos } from './permisos.js'

const COOKIE_NAME = 'vetadmin_token'
const TOKEN_TTL = '7d'

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET no configurado')
  return secret
}

const signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, getJwtSecret(), { expiresIn: TOKEN_TTL })

const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export async function login(req, res) {
  const { password } = req.body || {}
  // Se normaliza igual que en el alta y en la recuperacion: el teclado del
  // celular capitaliza la primera letra y si no, el mail no matchea nunca.
  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: 'Credenciales inválidas' })
  }

  const token = signToken(user)
  setAuthCookie(res, token)
  res.json({ user: { id: user.id, email: user.email, esAdmin: user.esAdmin, permisos: parsePermisos(user.permisos) } })
}

export function logout(_req, res) {
  res.clearCookie(COOKIE_NAME)
  res.json({ ok: true })
}

export async function me(req, res, next) {
  try {
    if (!req.user) return res.json({ user: null })
    // Los permisos salen de la base y no del token: si a alguien le sacan un
    // modulo, lo pierde en la proxima carga sin esperar a que expire el JWT.
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) return res.json({ user: null })
    res.json({ user: { id: user.id, email: user.email, esAdmin: user.esAdmin, permisos: parsePermisos(user.permisos) } })
  } catch (err) {
    next(err)
  }
}

export async function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) {
    return res.status(401).json({ error: 'No autenticado' })
  }
  let payload
  try {
    payload = jwt.verify(token, getJwtSecret())
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' })
  }

  // Se relee el usuario en cada request: los permisos que valen son los de la
  // base, no los que tenia cuando se firmo el token. Tambien corta la sesion
  // de un usuario que fue eliminado.
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) {
      return res.status(401).json({ error: 'Sesión inválida o expirada' })
    }
      req.user = { id: user.id, email: user.email, esAdmin: user.esAdmin, permisos: parsePermisos(user.permisos) }
    next()
  } catch (err) {
    next(err)
  }
}

export async function attachUserIfPresent(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) return next()
  try {
    const payload = jwt.verify(token, getJwtSecret())
    req.user = { id: payload.sub, email: payload.email }
  } catch {
    // ignore invalid token, treat as anonymous
  }
  next()
}

/**
 * Middleware para acciones destructivas: exige reingresar la contraseña del
 * usuario logueado. Tener la sesion abierta no alcanza cuando lo que se borra
 * no se puede recuperar (archivos en disco, eventos de historia clinica).
 */
export async function requirePasswordConfirmation(req, res, next) {
  const password = req.body?.password
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Ingresá tu contraseña para confirmar' })
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(403).json({ error: 'Contraseña incorrecta' })
  }
  next()
}

// ---------------------------------------------------------------------------
// Recuperacion de contraseña por mail
//
// Mismo esquema que Facturacion-Web: el token viaja en el link y en la base
// queda solo su sha256, asi que ni con la base en la mano se puede fabricar un
// link valido. Sale por el relay SMTP compartido del VPS (ver src/mailer.js).
// ---------------------------------------------------------------------------

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hora
const MIN_PASSWORD_LENGTH = 8

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

export async function forgotPassword(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase()

  // Del cliente se acepta unicamente el PATH, nunca un origin completo: si el
  // link se armara con algo que manda el request, cualquiera podria hacer que
  // el mail apunte a un dominio de phishing. El origin sale siempre del Host
  // real de la request.
  const resetPath =
    typeof req.body?.resetPath === 'string' &&
    req.body.resetPath.startsWith('/') &&
    !req.body.resetPath.includes('://')
      ? req.body.resetPath
      : '/'

  if (email) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex')
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash: hashResetToken(rawToken),
          resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      })

      const proto = req.headers['x-forwarded-proto'] || req.protocol
      const resetUrl = `${proto}://${req.get('host')}${resetPath}?reset=${rawToken}`

      try {
        await sendSystemEmail({ to: user.email, ...buildPasswordResetEmail(resetUrl) })
      } catch (mailError) {
        // El mail puede fallar (relay caido, red mal configurada) sin que eso
        // le diga nada util a quien esta del otro lado. Queda en el log.
        console.error('No se pudo enviar el mail de recuperacion:', mailError.message)
      }
    }
  }

  // Siempre 200, exista o no el email: si la respuesta cambiara, esto seria un
  // oraculo para averiguar que direcciones tienen cuenta.
  res.json({ ok: true })
}

export async function resetPassword(req, res) {
  const token = String(req.body?.token || '')
  const password = String(req.body?.password || '')

  if (!token || !password) {
    return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' })
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` })
  }

  const user = await prisma.user.findFirst({ where: { resetTokenHash: hashResetToken(token) } })
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    return res.status(400).json({ error: 'El link de recuperación es inválido o expiró' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { id: user.id },
    // Limpiar el token acá es lo que lo hace de un solo uso.
    data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
  })

  res.json({ ok: true })
}
