import React from 'react';

/**
 * Marca de Frodosoft. Placeholder geométrico — reemplazar el <svg> por el
 * logo real cuando esté disponible (mantener viewBox 0 0 24 24 y currentColor).
 */
export const FrodosoftLogo: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" opacity="0.14" />
    <path
      d="M8.5 16.5V7.5h7M8.5 12h5.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
