import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiGet, apiPost, ApiError } from '../lib/api';

/** Módulos a los que puede entrar un usuario. Espejo de server/src/permisos.js. */
export type Permiso = 'general' | 'comercial' | 'usuarios' | 'clinica';

export const PERMISOS: { id: Permiso; label: string; detalle: string }[] = [
  { id: 'general', label: 'General', detalle: 'Dashboard, clientes, mascotas y turnos' },
  { id: 'comercial', label: 'Comercial', detalle: 'Ventas, productos y gastos' },
  { id: 'usuarios', label: 'Usuarios', detalle: 'Dar de alta y baja usuarios y sus permisos' },
  { id: 'clinica', label: 'Datos de la veterinaria', detalle: 'Nombre, dirección y contacto de la clínica' },
];

/**
 * Pantalla a la que entra alguien recién logueado, y a la que se lo manda si
 * pide una ruta que no le corresponde. El dashboard es el destino normal; las
 * alternativas son para quien no tiene el módulo General.
 */
export const rutaInicial = (permisos: Permiso[]): string => {
  if (permisos.includes('general')) return '/';
  if (permisos.includes('comercial')) return '/ventas';
  if (permisos.includes('usuarios')) return '/settings/usuarios';
  if (permisos.includes('clinica')) return '/settings/clinica';
  return '/settings/razas';
};

interface AuthUser {
  id: string;
  email: string;
  /** Admin = puede escribir en el módulo Usuarios. Sin esto, sólo mirar. */
  esAdmin: boolean;
  permisos: Permiso[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  /** true si el usuario tiene ese módulo. Los catálogos no piden permiso. */
  puede: (permiso: Permiso) => boolean;
  esAdmin: boolean;
  /** Devuelve el usuario además del error: quien llama necesita sus permisos
   *  para saber a qué pantalla mandarlo, y el estado del contexto todavía no
   *  se actualizó cuando la promesa resuelve. */
  signIn: (email: string, password: string) => Promise<{ error: any; user?: AuthUser }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ user: AuthUser | null }>('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { user } = await apiPost<{ user: AuthUser }>('/auth/login', { email, password });
      setUser(user);
      return { error: null, user };
    } catch (err) {
      return { error: err instanceof ApiError ? err : new Error('No se pudo iniciar sesión') };
    }
  };

  const signOut = async () => {
    await apiPost('/auth/logout');
    setUser(null);
  };

  const puede = (permiso: Permiso) => Boolean(user?.permisos?.includes(permiso));

  const value = {
    user,
    loading,
    puede,
    esAdmin: Boolean(user?.esAdmin),
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
