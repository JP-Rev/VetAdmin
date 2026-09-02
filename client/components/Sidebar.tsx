import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { EstadoTurno } from '../types';
import {
  LayoutDashboard, Users, CalendarDays, ShoppingCart, Package, X as IconClose,
  PawPrint, BarChart3, Settings as IconSettings, CreditCard, ArrowRight,
} from 'lucide-react';

interface NavItemProps {
  to: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  badge?: number;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, children, icon, badge, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (location.pathname.startsWith(to) && to !== '/');

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-[10px] text-[13.5px] transition-colors duration-150 ${
        isActive
          ? 'bg-[#2dd4bf] text-[#04211e] font-bold shadow-[0_6px_16px_-6px_rgba(45,212,191,0.65)]'
          : 'text-[#a8c6c2] font-medium hover:bg-white/[0.06] hover:text-white'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="flex items-center gap-[11px] min-w-0">
        <span className="h-[17px] w-[17px] flex-shrink-0">{icon}</span>
        <span className="truncate">{children}</span>
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="font-mono text-[10px] font-semibold bg-[#2dd4bf]/[0.16] text-[#5eead4] px-[7px] py-0.5 rounded-full flex-shrink-0">
          {badge}
        </span>
      )}
    </NavLink>
  );
};

const NavSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-[3px]">
    <span className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-[#55817c] px-2.5 pb-1.5">
      {label}
    </span>
    {children}
  </div>
);

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { clinica, appointments } = useSupabaseData();
  // El badge cuenta los turnos pendientes de HOY (accionable), no todos los
  // futuros: ese número crece sin techo y deja de significar algo.
  const hoy = new Date().toISOString().split('T')[0];
  const turnosCount = appointments.filter(a => a.fecha === hoy && a.estado === EstadoTurno.PENDIENTE).length;

  const handleMobileLinkClick = () => {
    if (window.innerWidth < 768) toggleSidebar();
  };

  return (
    <aside
      id="sidebar"
      className={`fixed inset-y-0 left-0 z-40 w-[252px] flex flex-col gap-[26px] px-4 py-[22px]
                 bg-gradient-to-b from-[#0a2a27] to-[#07211f] text-[#cfe3e0]
                 transform transition-transform duration-300 ease-in-out
                 md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-between px-1.5">
        <NavLink to="/" className="flex items-center gap-2.5 min-w-0" onClick={handleMobileLinkClick}>
          <span className="w-[34px] h-[34px] rounded-[11px] bg-[#14b8a6] text-[#04211e] flex items-center justify-center flex-shrink-0">
            <PawPrint size={19} />
          </span>
          <span className="flex flex-col leading-[1.1] min-w-0">
            <strong className="text-base font-extrabold tracking-[-0.2px] text-white">VetAdmin</strong>
            <span className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-[#6fa19b] truncate">
              {clinica.nombre}
            </span>
          </span>
        </NavLink>
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1 rounded-md text-[#a8c6c2] hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#2dd4bf]"
          aria-label="Cerrar menú"
          aria-controls="sidebar"
          aria-expanded={isOpen}
        >
          <IconClose className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-col gap-[22px] flex-1 overflow-y-auto">
        <NavSection label="General">
          <NavItem to="/" icon={<LayoutDashboard size={17} />} onClick={handleMobileLinkClick}>Dashboard</NavItem>
          <NavItem to="/clients" icon={<Users size={17} />} onClick={handleMobileLinkClick}>Clientes</NavItem>
          <NavItem to="/pets" icon={<PawPrint size={17} />} onClick={handleMobileLinkClick}>Mascotas</NavItem>
          <NavItem to="/appointments" icon={<CalendarDays size={17} />} badge={turnosCount} onClick={handleMobileLinkClick}>Turnos</NavItem>
        </NavSection>

        <NavSection label="Comercial">
          <NavItem to="/ventas" icon={<ShoppingCart size={17} />} onClick={handleMobileLinkClick}>Ventas</NavItem>
          <NavItem to="/products" icon={<Package size={17} />} onClick={handleMobileLinkClick}>Productos</NavItem>
          <NavItem to="/expenses" icon={<CreditCard size={17} />} onClick={handleMobileLinkClick}>Gastos</NavItem>
          <NavItem to="/statistics" icon={<BarChart3 size={17} />} onClick={handleMobileLinkClick}>Estadísticas</NavItem>
        </NavSection>

        <NavSection label="Sistema">
          <NavItem to="/settings" icon={<IconSettings size={17} />} onClick={handleMobileLinkClick}>Configuración</NavItem>
        </NavSection>
      </nav>

      <div className="rounded-[14px] bg-white/[0.05] border border-white/[0.07] p-3.5">
        <p className="m-0 mb-2 text-xs leading-[1.45] text-[#a8c6c2]">
          La base se respalda con el volumen Docker del servidor.
        </p>
        <NavLink
          to="/settings"
          onClick={handleMobileLinkClick}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5eead4] hover:text-[#2dd4bf] transition-colors"
        >
          Ver configuración <ArrowRight size={13} />
        </NavLink>
      </div>
    </aside>
  );
};
