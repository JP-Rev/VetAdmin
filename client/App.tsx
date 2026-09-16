import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, Permiso, rutaInicial } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SupabaseDataProvider, useSupabaseData } from './contexts/SupabaseDataContext';
import { Sidebar } from './components/Sidebar';
import { AppHeader } from './components/AppHeader';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { PetsPage } from './pages/PetsPage'; 
import { AppointmentsPage } from './pages/AppointmentsPage';
import { ProductsPage } from './pages/ProductsPage';
import { Ventas } from './pages/VentasPage'; 
import { MedicalHistoryPage } from './pages/MedicalHistoryPage';
import { SettingsPage } from './pages/SettingsPage'; 
import { ExpensesPage } from './pages/ExpensesPage'; 
import { AlertCircle, Loader2 } from 'lucide-react';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-secondary-100 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-secondary-700 mb-2">Cargando VetAdmin</h2>
      <p className="text-secondary-500">Conectando con la base de datos...</p>
    </div>
  </div>
);

const ErrorScreen: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="min-h-screen bg-secondary-100 flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-6">
      <AlertCircle className="h-12 w-12 text-error-600 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-secondary-700 mb-2">Error de Conexión</h2>
      <p className="text-secondary-600 mb-4">{error}</p>
      <button 
        onClick={onRetry}
        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors"
      >
        Reintentar
      </button>
    </div>
  </div>
);

/**
 * A donde va alguien que entra a "/" o a una ruta que no le corresponde: la
 * primera pantalla que si tiene. Un usuario sin General no puede aterrizar en
 * el dashboard.
 */
const useInicio = (): string => {
  const { user } = useAuth();
  return rutaInicial(user?.permisos ?? []);
};

const Inicio: React.FC = () => <Navigate to={useInicio()} replace />;

/** Ruta de un modulo: sin el permiso, redirige en vez de mostrar la pantalla. */
const ConPermiso: React.FC<{ permiso: Permiso; children: React.ReactNode }> = ({ permiso, children }) => {
  const { puede } = useAuth();
  const inicio = useInicio();
  if (!puede(permiso)) return <Navigate to={inicio} replace />;
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { printableContentForPortal, loading, error, refreshData } = useSupabaseData();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  useEffect(() => {
    const beforePrint = () => document.body.classList.add('printing');
    const afterPrint = () => document.body.classList.remove('printing');

    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);

    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={refreshData} />;
  }
  
  return (
    <>
        <ScrollToTop />
        <div className="min-h-screen bg-secondary-100 flex"> 
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          
          <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out md:ml-[252px]`}>
            <AppHeader toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

            <main className="flex-grow px-4 py-5 sm:px-8 sm:py-6">
              <Routes>
                <Route path="/" element={<ConPermiso permiso="general"><DashboardPage /></ConPermiso>} />
                <Route path="/clients" element={<ConPermiso permiso="general"><ClientsPage /></ConPermiso>} />
                <Route path="/clients/new" element={<ConPermiso permiso="general"><ClientsPage /></ConPermiso>} />
                <Route path="/clients/:clientId/edit" element={<ConPermiso permiso="general"><ClientsPage /></ConPermiso>} />
                <Route path="/clients/:clientId" element={<ConPermiso permiso="general"><ClientsPage /></ConPermiso>} />

                <Route path="/pets" element={<ConPermiso permiso="general"><PetsPage /></ConPermiso>} />
                <Route path="/pets/:petId/history" element={<ConPermiso permiso="general"><MedicalHistoryPage /></ConPermiso>} />

                <Route path="/appointments" element={<ConPermiso permiso="general"><AppointmentsPage /></ConPermiso>} />

                <Route path="/products" element={<ConPermiso permiso="comercial"><ProductsPage /></ConPermiso>} />
                <Route path="/ventas" element={<ConPermiso permiso="comercial"><Ventas /></ConPermiso>} />
                <Route path="/expenses" element={<ConPermiso permiso="comercial"><ExpensesPage /></ConPermiso>} />

                {/* Los catálogos no piden permiso; las dos secciones que sí lo
                    piden las resuelve SettingsPage segun la ruta. */}
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/:seccion" element={<SettingsPage />} />

                <Route path="*" element={<Inicio />} />
              </Routes>
            </main>

            {/* La atribución a Frodosoft vive en el pie del sidebar, visible en toda la app. */}
          </div>

          {isSidebarOpen && (
            <div 
              className="md:hidden fixed inset-0 z-30 bg-black bg-opacity-50" 
              onClick={toggleSidebar}
              aria-hidden="true"
            ></div>
          )}
        </div>
        {printableContentForPortal && 
          // Contenedor neutro: si llevara `printable-area`, sus reglas
          // alcanzarian por descendencia al documento de adentro y le pisarian
          // el formato. Cada componente imprimible declara su propia clase.
          ReactDOM.createPortal(printableContentForPortal, document.getElementById('print-root')!)
        }
    </>
  );
};

const AppWrapper: React.FC = () => (
  <ThemeProvider>
    <HashRouter>
      <AuthProvider>
        <ProtectedRoute>
          <SupabaseDataProvider>
            <AppContent />
          </SupabaseDataProvider>
        </ProtectedRoute>
      </AuthProvider>
    </HashRouter>
  </ThemeProvider>
);

export default AppWrapper;