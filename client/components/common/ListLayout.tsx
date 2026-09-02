import React from 'react';
import { Search, Plus, Pencil, Trash2, Eye } from 'lucide-react';

/**
 * Componentes de listado compartidos: tarjeta de filtros arriba, tarjeta de
 * datos con contador y acción principal, y botones de acción por fila.
 * Mismo patrón visual en Clientes, Mascotas, Productos, Gastos y Turnos.
 */

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section
    className={`bg-surface border border-secondary-200 rounded-[18px] shadow-[0_1px_2px_rgba(15,31,29,0.04)] ${className}`}
  >
    {children}
  </section>
);

interface FilterCardProps {
  title?: string;
  subtitle?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  children?: React.ReactNode;
}

export const FilterCard: React.FC<FilterCardProps> = ({
  title = 'Filtros',
  subtitle,
  value,
  onChange,
  placeholder = 'Buscar…',
  hint,
  children,
}) => (
  <Card className="px-5 py-[18px]">
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="m-0 text-[16.5px] font-bold tracking-[-0.3px] text-secondary-900">{title}</h2>
        {subtitle && <p className="mt-0.5 mb-0 text-[12.5px] text-secondary-500">{subtitle}</p>}
      </div>
      {children}
    </div>

    <label className="block">
      <span className="block text-[12.5px] font-semibold text-secondary-700 mb-1.5">Buscar</span>
      <span className="flex items-center gap-2.5 bg-surface border border-secondary-200 rounded-[10px] px-3.5 py-2.5
                       text-secondary-500 focus-within:border-secondary-300 transition-colors max-w-xl">
        <Search size={16} className="flex-shrink-0" />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="border-0 outline-none text-[13.5px] text-secondary-900 bg-transparent w-full placeholder:text-secondary-500"
        />
      </span>
    </label>
    {hint && <p className="mt-1.5 mb-0 text-[11.5px] text-secondary-500">{hint}</p>}
  </Card>
);

interface DataCardProps {
  title: string;
  count: number;
  /** true cuando hay un filtro activo, para decir "filtrados". */
  filtered?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}

export const DataCard: React.FC<DataCardProps> = ({
  title, count, filtered = false, actionLabel, onAction, children,
}) => (
  <Card className="overflow-hidden">
    <div className="flex items-center justify-between gap-4 px-5 pt-[18px] pb-3.5 border-b border-secondary-100">
      <div>
        <h2 className="m-0 text-[16.5px] font-bold tracking-[-0.3px] text-secondary-900">{title}</h2>
        <p className="mt-0.5 mb-0 text-[12.5px] text-secondary-500">
          {count} {count === 1 ? 'registro' : 'registros'}{filtered ? ' filtrados' : ''}
        </p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white border-0
                     rounded-[10px] px-3.5 py-2.5 text-[13px] font-bold transition-colors flex-shrink-0"
        >
          <Plus size={15} />
          {actionLabel}
        </button>
      )}
    </div>
    {children}
  </Card>
);

/** Tabla con scroll horizontal propio, para que la página nunca desborde. */
export const TableWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[640px] text-left">{children}</table>
  </div>
);

export const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <th
    className={`px-5 py-3 font-mono text-[10px] tracking-[0.14em] uppercase font-semibold
                text-secondary-500 bg-secondary-50 whitespace-nowrap ${className}`}
  >
    {children}
  </th>
);

export const Td: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`px-5 py-3.5 text-[13.5px] text-secondary-800 align-middle ${className}`}>{children}</td>
);

export const Tr: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <tr
    onClick={onClick}
    className={`border-b border-secondary-100 last:border-b-0 hover:bg-secondary-50 transition-colors ${
      onClick ? 'cursor-pointer' : ''
    }`}
  >
    {children}
  </tr>
);

type ActionVariant = 'default' | 'danger';

interface IconActionProps {
  onClick: (e: React.MouseEvent) => void;
  label: string;
  variant?: ActionVariant;
  children: React.ReactNode;
}

/** Botón de acción por fila: sólo ícono, con borde. El destructivo va en rojo. */
export const IconAction: React.FC<IconActionProps> = ({ onClick, label, variant = 'default', children }) => (
  <button
    onClick={e => { e.stopPropagation(); onClick(e); }}
    title={label}
    aria-label={label}
    className={`w-[34px] h-[34px] rounded-[9px] border flex items-center justify-center transition-colors flex-shrink-0 ${
      variant === 'danger'
        ? 'border-error-200 text-error-600 hover:bg-error-50 hover:border-error-300'
        : 'border-secondary-200 text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 hover:border-secondary-300'
    }`}
  >
    {children}
  </button>
);

export const RowActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-1.5 justify-end">{children}</div>
);

/** Íconos estándar de acción, para que el significado sea el mismo en toda la app. */
export const EditIcon = () => <Pencil size={15} />;
export const DeleteIcon = () => <Trash2 size={15} />;
export const ViewIcon = () => <Eye size={15} />;

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; hint?: string }> = ({ icon, title, hint }) => (
  <div className="px-5 py-14 flex flex-col items-center gap-3 text-center">
    <span className="w-14 h-14 rounded-[18px] bg-secondary-100 text-primary-700 flex items-center justify-center">
      {icon}
    </span>
    <strong className="text-[15px] text-secondary-900">{title}</strong>
    {hint && <p className="m-0 max-w-[320px] text-[13px] text-secondary-500">{hint}</p>}
  </div>
);
