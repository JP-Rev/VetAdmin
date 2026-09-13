import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginForm, leerTokenDeReset } from './LoginForm';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700 mb-2">Verificando autenticación</h2>
          <p className="text-secondary-500">Un momento por favor...</p>
        </div>
      </div>
    );
  }

  // Con un token de recuperación en la URL se muestra el formulario aunque la
  // sesión siga abierta: es el caso de quien pidió el link desde otro
  // dispositivo y abre el mail en el que ya tenía la sesión iniciada.
  if (!user || leerTokenDeReset()) {
    return <LoginForm />;
  }

  return <>{children}</>;
};