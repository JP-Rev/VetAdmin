import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserMenu } from './UserMenu';
import { Menu as IconMenu, Search, Plus } from 'lucide-react';

interface AppHeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const navigate = useNavigate();
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState('');

  // ⌘K / Ctrl+K enfoca el buscador
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/clients?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-surface/[0.86] backdrop-blur-[10px] border-b border-secondary-200 px-4 sm:px-8 py-3.5 flex items-center gap-3 sm:gap-5">
      <button
        onClick={toggleSidebar}
        className="md:hidden p-2 -ml-2 rounded-md text-secondary-600 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Abrir menú"
        aria-expanded={isSidebarOpen}
        aria-controls="sidebar"
      >
        <IconMenu className="h-5 w-5" />
      </button>

      <form
        onSubmit={handleSearch}
        className="flex-1 min-w-0 hidden sm:flex items-center gap-3 max-w-[380px] bg-surface border border-secondary-200 rounded-[11px] px-3.5 py-2.5 text-secondary-500 focus-within:border-secondary-300 transition-colors"
      >
        <Search size={16} className="flex-shrink-0" />
        <input
          ref={searchRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar cliente, mascota o venta…"
          aria-label="Buscar"
          className="border-0 outline-none text-[13.5px] text-secondary-900 bg-transparent w-full placeholder:text-secondary-500"
        />
        <span className="font-mono text-[10px] text-secondary-400 border border-secondary-200 rounded px-1.5 py-px flex-shrink-0 hidden md:inline">
          ⌘K
        </span>
      </form>

      <div className="flex items-center gap-2.5 ml-auto">
        <button
          onClick={() => navigate('/appointments?action=new')}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white border-0 rounded-[10px] px-3.5 py-2.5 text-[13px] font-bold cursor-pointer transition-colors shadow-[0_8px_18px_-10px_rgba(15,118,110,0.9)]"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Nuevo turno</span>
        </button>
        <UserMenu />
      </div>
    </header>
  );
};
