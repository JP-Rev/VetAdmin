import React from 'react';
import { Dog, Cat, Bird, Rat, Turtle, PawPrint, LucideIcon } from 'lucide-react';
import { Especie } from '../types';

const ICON_BY_SPECIES: Record<string, LucideIcon> = {
  [Especie.PERRO]: Dog,
  [Especie.GATO]: Cat,
  [Especie.AVE]: Bird,
  [Especie.ROEDOR]: Rat,
  [Especie.REPTIL]: Turtle,
  [Especie.OTRO]: PawPrint,
};

/**
 * Ícono correspondiente a la especie de una mascota. Cae en PawPrint para
 * especies desconocidas o cuando la mascota no está cargada.
 */
export const SpeciesIcon: React.FC<{ especie?: string; size?: number; className?: string }> = ({
  especie,
  size = 17,
  className,
}) => {
  const Icon = (especie && ICON_BY_SPECIES[especie]) || PawPrint;
  return <Icon size={size} className={className} />;
};
