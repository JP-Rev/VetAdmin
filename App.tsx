
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM for Portal
import { HashRouter, Routes, Route, Navigate, useLocation, NavLink } from 'react-router-dom';
import { DataProvider, useData } from './contexts/DataContext'; // useData import
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { PetsPage } from './pages/PetsPage'; 
import { AppointmentsPage } from './pages/AppointmentsPage';
import { ProductsPage } from './pages/ProductsPage';
import { VentasPage } from './pages/VentasPage'; 
import { MedicalHistoryPage } from './pages/MedicalHistoryPage';
import { StatisticsPage } from './pages/StatisticsPage'; 
import { SettingsPage } from './pages/SettingsPage'; 
import { ExpensesPage } from './pages/ExpensesPage'; 
import { APP_TITLE } from './constants';
import { Menu as IconMenu } from 'lucide-react'; 

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AppContent: React.FC = () => { // Renamed from App to AppContent
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { printableContentForPortal } = useData(); // Get printable content from context

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Effect to add/remove class from body when printing to help with styles
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
  
  return (
    <>
        <ScrollToTop />
        <div className="min-h-screen bg-secondary-100 flex"> 
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          
          <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out md:ml-64`}>
            <header className="md:hidden sticky top-0 z-30 bg-primary-600 text-white p-3 shadow-md flex items-center">
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
                <Route path="/ventas" element={<VentasPage />} /> 

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
    <DataProvider> {/* DataProvider now wraps AppContent */}
      <AppContent />
    </DataProvider>
  </HashRouter>
);

export default AppWrapper;
