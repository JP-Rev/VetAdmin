
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { APP_TITLE } from '../constants';
import { Home, Users, CalendarDays, ShoppingCart, Package, X as IconClose, PawPrint, BarChart3, Settings as IconSettings, CreditCard } from 'lucide-react'; //lucide-react icons, Added CreditCard for Gastos

interface NavItemProps {
  to: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, children, icon, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (location.pathname.startsWith(to) && to !== '/');


  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={
        `flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 group ${
          isActive 
            ? 'bg-primary-700 text-white shadow-inner' 
            : 'text-primary-100 hover:bg-primary-700 hover:text-white'
        }`
      }
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-primary-300 group-hover:text-white'}`}>{icon}</span>
      {children}
    </NavLink>
  );
};

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const handleMobileLinkClick = () => {
    if (window.innerWidth < 768) { 
      toggleSidebar();
    }
  };

  return (
    <aside 
      id="sidebar"
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary-800 text-white p-4 
                 transform transition-transform duration-300 ease-in-out 
                 md:translate-x-0 md:shadow-lg
                 ${isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}
      aria-label="Main navigation"
    >
      <div className="flex justify-between items-center mb-8">
        <NavLink to="/" className="text-xl font-bold text-white hover:text-primary-200 transition-colors" onClick={handleMobileLinkClick}>
          {APP_TITLE}
        </NavLink>
        <button 
          onClick={toggleSidebar} 
          className="md:hidden p-1 rounded-md text-primary-200 hover:bg-primary-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          aria-label="Cerrar menú"
          aria-controls="sidebar"
          aria-expanded={isOpen}
        >
          <IconClose className="h-6 w-6" />
        </button>
      </div>
      <nav className="space-y-2">
        <NavItem to="/" icon={<Home />} onClick={handleMobileLinkClick}>Dashboard</NavItem>
        <NavItem to="/clients" icon={<Users />} onClick={handleMobileLinkClick}>Clientes</NavItem>
        <NavItem to="/pets" icon={<PawPrint />} onClick={handleMobileLinkClick}>Mascotas</NavItem>
        <NavItem to="/appointments" icon={<CalendarDays />} onClick={handleMobileLinkClick}>Turnos</NavItem>
        <NavItem to="/ventas" icon={<ShoppingCart />} onClick={handleMobileLinkClick}>Ventas</NavItem> {/* Renamed from Órdenes to Ventas, /orders to /ventas */}
        <NavItem to="/products" icon={<Package />} onClick={handleMobileLinkClick}>Productos</NavItem>
        <NavItem to="/expenses" icon={<CreditCard />} onClick={handleMobileLinkClick}>Gastos</NavItem> {/* Added Gastos NavItem */}
        <NavItem to="/statistics" icon={<BarChart3 />} onClick={handleMobileLinkClick}>Estadísticas</NavItem>
        <NavItem to="/settings" icon={<IconSettings />} onClick={handleMobileLinkClick}>Configuración</NavItem>
      </nav>
    </aside>
  );
};
