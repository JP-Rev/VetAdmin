import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma.js'

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
  const { email, password } = req.body || {}
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
  res.json({ user: { id: user.id, email: user.email } })
}

export function logout(_req, res) {
  res.clearCookie(COOKIE_NAME)
  res.json({ ok: true })
}

export async function me(req, res) {
  res.json({ user: req.user ?? null })
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) {
    return res.status(401).json({ error: 'No autenticado' })
  }
  try {
    const payload = jwt.verify(token, getJwtSecret())
    req.user = { id: payload.sub, email: payload.email }
    next()
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' })
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
