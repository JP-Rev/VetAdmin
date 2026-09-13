/**
 * Permisos por usuario. Son de acceso a modulos, no de confidencialidad entre
 * el personal de la misma veterinaria: quien tiene un modulo, lo tiene entero.
 *
 * Se guardan en User.permisos como un JSON de strings porque SQLite no tiene
 * arrays. Cualquier valor desconocido se ignora al leer, asi que sacar un
 * permiso de esta lista no rompe las filas viejas.
 */

export const PERMISOS = {
  GENERAL: 'general',
  COMERCIAL: 'comercial',
  USUARIOS: 'usuarios',
  CLINICA: 'clinica',
}

/** Orden estable, es el que usa la pantalla de usuarios. */
export const PERMISOS_VALIDOS = [
  PERMISOS.GENERAL,
  PERMISOS.COMERCIAL,
  PERMISOS.USUARIOS,
  PERMISOS.CLINICA,
]

/** Los catalogos (razas, enfermedades, cirugias, categorias) no se revocan:
 *  sin ellos no se puede cargar ni una consulta. */
export const TODOS_LOS_PERMISOS = [...PERMISOS_VALIDOS]

export const parsePermisos = (valor) => {
  if (typeof valor !== 'string' || !valor) return []
  try {
    const lista = JSON.parse(valor)
    return Array.isArray(lista) ? lista.filter((p) => PERMISOS_VALIDOS.includes(p)) : []
  } catch {
    return []
  }
}

export const serializarPermisos = (lista) => {
  const unicos = [...new Set((Array.isArray(lista) ? lista : []).filter((p) => PERMISOS_VALIDOS.includes(p)))]
  // Se guarda en el orden canonico para que dos permisos iguales se vean iguales.
  return JSON.stringify(PERMISOS_VALIDOS.filter((p) => unicos.includes(p)))
}

const NOMBRES = {
  [PERMISOS.GENERAL]: 'General',
  [PERMISOS.COMERCIAL]: 'Comercial',
  [PERMISOS.USUARIOS]: 'Usuarios',
  [PERMISOS.CLINICA]: 'Datos de la veterinaria',
}

/**
 * Corta el request si el usuario logueado no tiene el permiso. Va montado en
 * los grupos de rutas de app.js: esconder el menu en el front no es un
 * permiso, es una sugerencia.
 */
export const requirePermiso = (permiso) => (req, res, next) => {
  if (!req.user?.permisos?.includes(permiso)) {
    return res.status(403).json({ error: `No tenés acceso al módulo ${NOMBRES[permiso] ?? permiso}` })
  }
  next()
}
