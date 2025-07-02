import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Routes, Route, Navigate, useLocation, NavLink } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SupabaseDataProvider, useSupabaseData } from './contexts/SupabaseDataContext';
import { Sidebar } from './components/Sidebar';
import { UserMenu } from './components/UserMenu';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { PetsPage } from './pages/PetsPage'; 
import { AppointmentsPage } from './pages/AppointmentsPage';
import { ProductsPage } from './pages/ProductsPage';
import { Ventas } from './pages/VentasPage'; 
import { MedicalHistoryPage } from './pages/MedicalHistoryPage';
import { StatisticsPage } from './pages/StatisticsPage'; 
import { SettingsPage } from './pages/SettingsPage'; 
import { ExpensesPage } from './pages/ExpensesPage'; 
import { APP_TITLE } from './constants';
import { Menu as IconMenu, AlertCircle, Loader2 } from 'lucide-react';

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
          
          <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out md:ml-64`}>
            <header className="md:hidden sticky top-0 z-30 bg-primary-600 text-white p-3 shadow-md flex items-center justify-between">
               <div className="flex items-center">
                 <button 
                  onClick={toggleSidebar} 
                  className="mr-3 p-2 rounded-md hover:bg-primary-700 focus:outline-none focus:bg-primary-500"
                  aria-label="Abrir menú"
                  aria-expanded={isSidebarOpen}
                  aria-controls="sidebar"
                >
                  <IconMenu className="h-6 w-6" />
                </button>
                <NavLink to="/" className="text-lg font-bold">{APP_TITLE}</NavLink>
               </div>
               <UserMenu />
            </header>

            {/* Desktop header with user menu */}
            <header className="hidden md:block sticky top-0 z-30 bg-primary-600 text-white px-6 py-3 shadow-md">
              <div className="flex justify-between items-center">
                <h1 className="text-lg font-bold">{APP_TITLE}</h1>
                <UserMenu />
              </div>
            </header>

            <main className="flex-grow p-4 sm:p-6"> 
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/clients/new" element={<ClientsPage />} />
                <Route path="/clients/:clientId/edit" element={<ClientsPage />} />
                <Route path="/clients/:clientId" element={<ClientsPage />} />
                
                <Route path="/pets" element={<PetsPage />} /> 
                <Route path="/pets/:petId/history" element={<MedicalHistoryPage />} />

                <Route path="/appointments" element={<AppointmentsPage />} />
                
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/ventas" element={<Ventas />} /> 

                <Route path="/statistics" element={<StatisticsPage />} /> 
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/expenses" element={<ExpensesPage />} /> 
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <footer className="bg-white text-center text-sm text-secondary-600 p-4 border-t border-secondary-200">
              {APP_TITLE} &copy; {new Date().getFullYear()} - Veterinary Management PWA
            </footer>
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
          ReactDOM.createPortal(
            <div className="printable-area">{printableContentForPortal}</div>,
            document.getElementById('print-root')!
          )
        }
    </>
  );
};

const AppWrapper: React.FC = () => (
  <HashRouter>
    <AuthProvider>
      <ProtectedRoute>
        <SupabaseDataProvider>
          <AppContent />
        </SupabaseDataProvider>
      </ProtectedRoute>
    </AuthProvider>
  </HashRouter>
);

export default AppWrapper;