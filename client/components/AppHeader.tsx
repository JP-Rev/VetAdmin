import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserMenu } from './UserMenu';
import { GlobalSearch } from './GlobalSearch';
import { Menu as IconMenu, Plus } from 'lucide-react';

interface AppHeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const navigate = useNavigate();

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

      <GlobalSearch />

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
