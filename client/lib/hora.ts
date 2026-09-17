/**
 * Horarios de turno: normalizar lo que se escribe a mano y armar las sugerencias.
 *
 * El campo de hora dejó de ser un `<input type="time">` porque su desplegable es
 * el del navegador y no se cierra al elegir los minutos — no hay forma de
 * cerrarlo desde la página. Ahora es un campo de texto con sugerencias propias,
 * así que hace falta interpretar lo que la persona tipea.
 */

/** Minuto del día (0..1439) a "HH:MM". */
export const aHHMM = (minutos: number): string => {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** "HH:MM" a minuto del día, o null si no es una hora válida. */
export const aMinutos = (hora: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hora ?? '');
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
};

/**
 * Interpreta lo que se escribió a mano y lo deja en "HH:MM", o null si no hay
 * forma de leerlo como una hora.
 *
 * Es deliberadamente permisiva con el formato de entrada —"9", "930", "9.30" y
 * "9:30" son todos las nueve y media— porque el campo se completa tipeando
 * rápido. Lo que no hace es adivinar: "25:00" o "9:70" no existen y devuelven
 * null en vez de recortarse a algo cercano, que sería peor (un turno a una hora
 * que nadie eligió).
 */
export const normalizarHora = (crudo: string): string | null => {
  const texto = String(crudo ?? '').trim();
  if (!texto) return null;

  // Con separador: horas y minutos vienen explícitos.
  const conSeparador = /^(\d{1,2})\s*[:.,hH]\s*(\d{1,2})$/.exec(texto);
  if (conSeparador) {
    const h = Number(conSeparador[1]);
    const m = Number(conSeparador[2]);
    if (h > 23 || m > 59) return null;
    return aHHMM(h * 60 + m);
  }

  // Sólo dígitos: la cantidad define dónde corta la hora.
  if (/^\d+$/.test(texto)) {
    let h: number;
    let m: number;
    if (texto.length <= 2) {
      h = Number(texto);
      m = 0;
    } else if (texto.length === 3) {
      h = Number(texto.slice(0, 1));
      m = Number(texto.slice(1));
    } else if (texto.length === 4) {
      h = Number(texto.slice(0, 2));
      m = Number(texto.slice(2));
    } else {
      return null;
    }
    if (h > 23 || m > 59) return null;
    return aHHMM(h * 60 + m);
  }

  return null;
};

/** Tope de sugerencias: una lista más larga no se recorre, se sufre. */
export const MAX_SUGERENCIAS = 400;

/**
 * Los horarios sugeridos, de `inicio` a `fin` cada `intervalo` minutos.
 *
 * No condiciona lo que se puede guardar: es sólo la lista que se ofrece. El
 * horario se puede escribir a mano y puede caer fuera de la franja — la
 * disponibilidad real la maneja el profesional, no la app.
 */
export const horariosSugeridos = (
  inicio: string,
  fin: string,
  intervalo: number
): string[] => {
  const desde = aMinutos(inicio);
  const hasta = aMinutos(fin);
  const paso = Math.floor(Number(intervalo));

  if (desde === null || hasta === null || !Number.isFinite(paso) || paso < 1) return [];
  if (hasta < desde) return [];

  const horarios: string[] = [];
  for (let m = desde; m <= hasta && horarios.length < MAX_SUGERENCIAS; m += paso) {
    horarios.push(aHHMM(m));
  }
  return horarios;
};
