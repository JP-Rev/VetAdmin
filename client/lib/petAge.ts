/**
 * Edad de una mascota a partir de su fecha de nacimiento (YYYY-MM-DD).
 *
 * La precisión se ajusta a la edad: en un cachorro de semanas importan los
 * días, en un perro de ocho años no. Devuelve null cuando no hay fecha
 * cargada o no es válida, para que quien lo use muestre un guion.
 */

export interface PetAge {
  /** Años completos. */
  years: number;
  /** Meses completos por encima de los años. */
  months: number;
  /** Días totales desde el nacimiento. */
  totalDays: number;
  /** Texto listo para mostrar: "3 años 2 meses", "5 meses", "12 días". */
  label: string;
  /** Versión corta para tablas: "3a 2m", "5m", "12d". */
  short: string;
}

const plural = (n: number, singular: string, plural_: string) =>
  `${n} ${n === 1 ? singular : plural_}`;

export function getPetAge(fechaNacimiento?: string | null, hoy: Date = new Date()): PetAge | null {
  if (!fechaNacimiento) return null;

  // Se interpreta al mediodía para que el cambio de huso horario no corra el día.
  const nacimiento = new Date(`${fechaNacimiento.split('T')[0]}T12:00:00`);
  if (Number.isNaN(nacimiento.getTime())) return null;

  const ref = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12);
  if (nacimiento > ref) return null; // fecha futura: dato mal cargado

  const totalDays = Math.floor((ref.getTime() - nacimiento.getTime()) / 86_400_000);

  let years = ref.getFullYear() - nacimiento.getFullYear();
  let months = ref.getMonth() - nacimiento.getMonth();
  if (ref.getDate() < nacimiento.getDate()) months--;
  if (months < 0) {
    years--;
    months += 12;
  }

  let label: string;
  let short: string;

  if (years > 0) {
    label = months > 0
      ? `${plural(years, 'año', 'años')} ${plural(months, 'mes', 'meses')}`
      : plural(years, 'año', 'años');
    short = months > 0 ? `${years}a ${months}m` : `${years}a`;
  } else if (months > 0) {
    label = plural(months, 'mes', 'meses');
    short = `${months}m`;
  } else {
    label = plural(totalDays, 'día', 'días');
    short = `${totalDays}d`;
  }

  return { years, months, totalDays, label, short };
}
