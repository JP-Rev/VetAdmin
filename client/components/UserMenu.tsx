import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { LogOut, User, ChevronDown, Moon, Sun, Zap } from 'lucide-react';

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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-white transition-colors p-2 rounded-md hover:bg-primary-700"
      >
        <span className="user-avatar flex items-center justify-center h-8 w-8 rounded-full">
          <User size={20} />
        </span>
        <span className="user-email hidden sm:block text-sm">{user.email}</span>
        <ChevronDown size={16} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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