/**
 * Fechas en formato ISO corto (YYYY-MM-DD), que es lo que esperan los
 * `<input type="date">` y lo que guarda la API.
 *
 * 🔴 No usar `new Date().toISOString().split('T')[0]` para "hoy": eso convierte
 * a UTC primero, así que en Argentina (UTC-3) a partir de las 21:00 devuelve el
 * día siguiente. Turnos de hoy, flujo de caja del día y las fechas que vienen
 * propuestas en los formularios quedaban corridos toda la tarde-noche.
 */

/** Pasa un Date a YYYY-MM-DD usando el huso del navegador, no UTC. */
export const aISO = (fecha: Date): string => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** El día de hoy según el reloj de quien está usando la app. */
export const hoyISO = (): string => aISO(new Date());
