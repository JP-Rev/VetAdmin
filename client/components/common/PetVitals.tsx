import React from 'react';
import { Cake, Scale } from 'lucide-react';
import { getPetAge } from '../../lib/petAge';

/**
 * Edad y peso como pastillas, separadas de la línea de identificación
 * (especie · raza · sexo). Son los dos datos clínicos que se buscan al barrer
 * una lista de mascotas, y mezclados en el gris de la raza se perdían.
 *
 * El peso va en teal, el color de acción de la app; la edad en gris fuerte
 * para que no compitan entre sí. Cuando falta el peso se muestra igual: "sin
 * peso" avisa, la ausencia silenciosa no.
 */
const Pastilla: React.FC<{
  children: React.ReactNode;
  icon: React.ReactNode;
  tono: 'edad' | 'peso' | 'vacio';
  title?: string;
}> = ({ children, icon, tono, title }) => {
  const estilo =
    tono === 'peso'
      ? 'bg-primary-50 text-primary-700 border-primary-100'
      : tono === 'edad'
      ? 'bg-secondary-100 text-secondary-700 border-secondary-200'
      : 'bg-surface text-secondary-400 border-secondary-200';
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 font-mono text-[10.5px] font-semibold
                  px-2 py-[2px] rounded-full border whitespace-nowrap ${estilo}`}
    >
      {icon}
      {children}
    </span>
  );
};

interface PetVitalsProps {
  fechaNacimiento: string;
  /** Último pesaje en kg, o null si la mascota todavía no se pesó. */
  peso: number | null;
  className?: string;
}

export const PetVitals: React.FC<PetVitalsProps> = ({ fechaNacimiento, peso, className = '' }) => {
  const edad = getPetAge(fechaNacimiento);

  return (
    <span className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {edad && (
        <Pastilla
          tono="edad"
          icon={<Cake size={11} className="flex-shrink-0" />}
          title={`${edad.label} · nació el ${new Date(fechaNacimiento + 'T12:00:00').toLocaleDateString('es-AR')}`}
        >
          {edad.short}
        </Pastilla>
      )}
      {peso !== null ? (
        <Pastilla tono="peso" icon={<Scale size={11} className="flex-shrink-0" />} title="Último peso registrado">
          {peso.toLocaleString('es-AR')} kg
        </Pastilla>
      ) : (
        <Pastilla tono="vacio" icon={<Scale size={11} className="flex-shrink-0" />} title="Todavía no se registró el peso">
          sin peso
        </Pastilla>
      )}
    </span>
  );
};
