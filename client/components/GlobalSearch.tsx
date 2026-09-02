import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { SpeciesIcon } from '../lib/speciesIcon';
import { Search, Users, ShoppingCart, CornerDownLeft } from 'lucide-react';

type Result = {
  id: string;
  tipo: 'cliente' | 'mascota' | 'venta';
  titulo: string;
  detalle: string;
  especie?: string;
  to: string;
};

const GRUPOS: { tipo: Result['tipo']; label: string }[] = [
  { tipo: 'cliente', label: 'Clientes' },
  { tipo: 'mascota', label: 'Mascotas' },
  { tipo: 'venta', label: 'Ventas' },
];

const MAX_POR_GRUPO = 4;

export const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const { clients, pets, ventas, getClientById, breeds } = useSupabaseData();
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [cursor, setCursor] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl+K enfoca el buscador desde cualquier parte de la app.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Cerrar al hacer click afuera.
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const results = React.useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const clienteHits: Result[] = clients
      .filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
      )
      .slice(0, MAX_POR_GRUPO)
      .map(c => ({
        id: c.id_cliente,
        tipo: 'cliente' as const,
        titulo: c.nombre,
        detalle: c.telefono || c.email || 'Sin contacto',
        to: `/clients/${c.id_cliente}`,
      }));

    const mascotaHits: Result[] = pets
      .filter(p => {
        const raza = breeds.find(b => b.id_raza === p.raza_id)?.nombre ?? '';
        return (
          p.nombre.toLowerCase().includes(q) ||
          p.especie.toLowerCase().includes(q) ||
          raza.toLowerCase().includes(q)
        );
      })
      .slice(0, MAX_POR_GRUPO)
      .map(p => ({
        id: p.id_mascota,
        tipo: 'mascota' as const,
        titulo: p.nombre,
        detalle: `${p.especie} · ${getClientById(p.id_cliente)?.nombre ?? 'Sin dueño'}`,
        especie: p.especie,
        to: `/pets/${p.id_mascota}/history`,
      }));

    const ventaHits: Result[] = ventas
      .filter(v => {
        const cliente = getClientById(v.cliente_id)?.nombre.toLowerCase() ?? '';
        return cliente.includes(q) || v.id_venta.toLowerCase().includes(q);
      })
      .slice(0, MAX_POR_GRUPO)
      .map(v => ({
        id: v.id_venta,
        tipo: 'venta' as const,
        titulo: `$${v.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })} · ${v.estado}`,
        detalle: `${getClientById(v.cliente_id)?.nombre ?? 'Sin cliente'} · ${new Date(v.fecha).toLocaleDateString('es-AR')}`,
        to: '/ventas',
      }));

    return [...clienteHits, ...mascotaHits, ...ventaHits];
  }, [query, clients, pets, ventas, breeds, getClientById]);

  React.useEffect(() => setCursor(0), [query]);

  const go = (r: Result) => {
    navigate(r.to);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); return; }
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => (c + 1) % results.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => (c - 1 + results.length) % results.length); }
    if (e.key === 'Enter') { e.preventDefault(); go(results[cursor]); }
  };

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative flex-1 min-w-0 max-w-[380px] hidden sm:block">
      <div className="flex items-center gap-3 bg-surface border border-secondary-200 rounded-[11px] px-3.5 py-2.5
                      text-secondary-500 focus-within:border-secondary-300 transition-colors">
        <Search size={16} className="flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscar cliente, mascota o venta…"
          aria-label="Buscar en la aplicación"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="global-search-results"
          className="border-0 outline-none text-[13.5px] text-secondary-900 bg-transparent w-full placeholder:text-secondary-500"
        />
        <span className="font-mono text-[10px] text-secondary-400 border border-secondary-200 rounded px-1.5 py-px flex-shrink-0 hidden md:inline">
          ⌘K
        </span>
      </div>

      {showPanel && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 mt-2 bg-surface border border-secondary-200 rounded-xl shadow-lg
                     overflow-hidden z-50 max-h-[420px] overflow-y-auto"
        >
          {results.length === 0 ? (
            <p className="m-0 px-4 py-6 text-center text-[13px] text-secondary-500">
              Sin resultados para “{query.trim()}”.
            </p>
          ) : (
            GRUPOS.map(grupo => {
              const items = results.filter(r => r.tipo === grupo.tipo);
              if (!items.length) return null;
              return (
                <div key={grupo.tipo}>
                  <p className="m-0 px-3 pt-2.5 pb-1 font-mono text-[9.5px] tracking-[0.16em] uppercase text-secondary-500">
                    {grupo.label}
                  </p>
                  {items.map(r => {
                    const idx = results.indexOf(r);
                    const activo = idx === cursor;
                    return (
                      <button
                        key={`${r.tipo}-${r.id}`}
                        role="option"
                        aria-selected={activo}
                        onClick={() => go(r)}
                        onMouseEnter={() => setCursor(idx)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                          activo ? 'bg-secondary-100' : 'hover:bg-secondary-50'
                        }`}
                      >
                        <span className="w-8 h-8 rounded-lg bg-secondary-100 text-secondary-600 flex items-center justify-center flex-shrink-0">
                          {r.tipo === 'cliente' && <Users size={16} />}
                          {r.tipo === 'mascota' && <SpeciesIcon especie={r.especie} size={16} />}
                          {r.tipo === 'venta' && <ShoppingCart size={16} />}
                        </span>
                        <span className="flex-1 min-w-0 flex flex-col">
                          <span className="text-[13px] font-semibold text-secondary-900 truncate">{r.titulo}</span>
                          <span className="text-[11.5px] text-secondary-500 truncate">{r.detalle}</span>
                        </span>
                        {activo && <CornerDownLeft size={13} className="text-secondary-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
