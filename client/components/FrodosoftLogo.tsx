import React from 'react';

/**
 * Marca de Frodosoft, reconstruida en SVG a partir del logotipo original.
 * Usa `currentColor` en todos los trazos, así hereda el color del contenedor
 * y funciona igual sobre fondo claro u oscuro sin necesidad de dos versiones.
 */
export const FrodosoftLogo: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <g stroke="currentColor" strokeLinecap="round">
      {/* Anillo exterior, partido donde salen las trazas diagonales */}
      <path d="M 68.2 14.4 A 40 40 0 0 0 14.4 68.2" strokeWidth="7" fill="none" />
      <path d="M 31.8 85.6 A 40 40 0 0 0 85.6 31.8" strokeWidth="7" fill="none" />

      {/* Trazas diagonales que irradian desde el centro hacia el borde */}
      <path d="M 62 38 L 81 19" strokeWidth="8" fill="none" />
      <path d="M 38 62 L 19 81" strokeWidth="8" fill="none" />

      {/* Anillo intermedio, partido en la misma diagonal */}
      <path d="M 60 30.4 A 22 22 0 0 0 30.4 60" strokeWidth="6" fill="none" />
      <path d="M 40 69.6 A 22 22 0 0 0 69.6 40" strokeWidth="6" fill="none" />

      {/* Centro: anillo + punto */}
      <circle cx="50" cy="50" r="11" strokeWidth="5.5" fill="none" />
      <circle cx="50" cy="50" r="4.5" stroke="none" fill="currentColor" />

      {/* Nodos en los extremos de los arcos */}
      <circle cx="68.2" cy="14.4" r="3.4" strokeWidth="3" fill="none" />
      <circle cx="14.4" cy="68.2" r="3.4" strokeWidth="3" fill="none" />
      <circle cx="31.8" cy="85.6" r="3.4" strokeWidth="3" fill="none" />
      <circle cx="85.6" cy="31.8" r="3.4" strokeWidth="3" fill="none" />
    </g>
  </svg>
);

/**
 * Nombre de la marca con el contraste de pesos del logotipo original:
 * "Frodo" en negrita y "soft" en fina.
 */
export const FrodosoftWordmark: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className}>
    <span className="font-extrabold">Frodo</span>
    <span className="font-light">soft</span>
  </span>
);
