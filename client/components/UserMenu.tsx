import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { LogOut, ChevronDown, Moon, Sun, Zap } from 'lucide-react';

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Claro', icon: <Sun size={16} /> },
  { value: 'dark', label: 'Oscuro', icon: <Moon size={16} /> },
  { value: 'neon', label: 'Neón', icon: <Zap size={16} /> },
];

export const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  if (!user) return null;

  const localPart = user.email.split('@')[0];
  const displayName = localPart.charAt(0).toUpperCase() + localPart.slice(1);
  const initials = localPart.slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-surface border border-secondary-200 hover:border-secondary-300
                   rounded-[10px] pl-1.5 pr-2.5 py-1.5 transition-colors"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="user-avatar w-7 h-7 rounded-lg bg-[#0a2a27] text-[#5eead4] flex items-center justify-center text-[11.5px] font-extrabold flex-shrink-0">
          {initials}
        </span>
        <span className="hidden sm:flex flex-col leading-[1.2] items-start min-w-0">
          <strong className="text-[12.5px] text-secondary-900">{displayName}</strong>
          <span className="user-email text-[10.5px] text-secondary-500 truncate max-w-[160px]">{user.email}</span>
        </span>
        <ChevronDown size={14} className={`text-secondary-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg py-1 z-20">
            <div className="px-4 py-2 text-sm text-secondary-700 border-b border-secondary-200">
              <p className="font-medium">Conectado como:</p>
              <p className="text-xs text-secondary-500 truncate">{user.email}</p>
            </div>
            <div className="px-4 py-2 border-b border-secondary-200">
              <p className="text-xs font-medium text-secondary-500 mb-1.5">Tema</p>
              <div className="flex gap-1">
                {THEME_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded text-xs transition-colors ${
                      theme === option.value
                        ? 'bg-primary-600 text-white'
                        : 'text-secondary-600 hover:bg-secondary-100'
                    }`}
                    aria-pressed={theme === option.value}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 transition-colors"
            >
              <LogOut size={16} className="mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
};