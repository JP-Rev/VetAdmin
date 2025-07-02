import React, { useState, useEffect } from 'react';
import { DailyCashFlowReportDetails, MetodoPago, CategoriaGasto } from '../../types';
import { useSupabaseData } from '../../contexts/SupabaseDataContext'; 
import { Button } from '../common/Button';
import { Modal } from '../Modal';
import { AppointmentCalendarView } from '../AppointmentCalendarView';
import { DollarSign, TrendingUp, TrendingDown, Landmark, CreditCard as CreditCardIcon, AlertCircle, Calendar, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const PaymentMethodIcon: React.FC<{ method: MetodoPago, className?: string }> = ({ method, className="h-4 w-4 mr-1.5" }) => {
  switch (method) {
    case MetodoPago.EFECTIVO:
      return <DollarSign className={`${className} text-success-500`} />;
    case MetodoPago.TRANSFERENCIA:
      return <Landmark className={`${className} text-blue-500`} />;
    case MetodoPago.TARJETA:
      return <CreditCardIcon className={`${className} text-purple-500`} />;
    default:
      return <DollarSign className={`${className} text-secondary-500`} />;
  }
};

// Daily Financial Report Component
interface DailyFinancialReportProps {
  selectedDate: string;
  onClose: () => void;
}

const DailyFinancialReport: React.FC<DailyFinancialReportProps> = ({ selectedDate, onClose }) => {
  const { getDailyCashFlowReport } = useSupabaseData();
  const navigate = useNavigate();
  const report = getDailyCashFlowReport(selectedDate);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleViewSales = () => {
    navigate(`/ventas?date=${selectedDate}`);
    onClose();
  };

  const handleViewExpenses = () => {
    navigate(`/expenses?date=${selectedDate}`);
    onClose();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-secondary-800 mb-2">
          Reporte Financiero Diario
        </h3>
        <p className="text-secondary-600">{formatDate(selectedDate)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ingresos */}
        <div className="bg-success-50 p-4 rounded-lg border border-success-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-success-600 mr-2" />
              <h4 className="text-lg font-semibold text-success-800">Ingresos</h4>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleViewSales}
              className="text-success-600 hover:bg-success-100"
            >
              Ver Ventas
            </Button>
          </div>
          {Object.keys(report.incomeByMethod).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(report.incomeByMethod).map(([method, amount]) => (
                <div key={method} className="flex justify-between text-sm">
                  <span className="text-success-700 flex items-center">
                    <PaymentMethodIcon method={method as MetodoPago} />
                    {method}:
                  </span>
                  <span className="font-medium text-success-800">${(amount || 0).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-success-300 pt-2 mt-3">
                <div className="flex justify-between font-bold text-success-800">
                  <span>Total Ingresos:</span>
                  <span>${report.totalIncome.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-success-600 text-sm">No hay ingresos registrados</p>
          )}
        </div>

        {/* Egresos */}
        <div className="bg-error-50 p-4 rounded-lg border border-error-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <TrendingDown className="h-6 w-6 text-error-600 mr-2" />
              <h4 className="text-lg font-semibold text-error-800">Egresos</h4>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleViewExpenses}
              className="text-error-600 hover:bg-error-100"
            >
              Ver Gastos
            </Button>
          </div>
          {Object.keys(report.expensesByCategory).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(report.expensesByCategory).map(([category, amount]) => (
                <div key={category} className="flex justify-between text-sm">
                  <span className="text-error-700 truncate pr-2" title={category}>{category}:</span>
                  <span className="font-medium text-error-800">${(amount || 0).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-error-300 pt-2 mt-3">
                <div className="flex justify-between font-bold text-error-800">
                  <span>Total Egresos:</span>
                  <span>${report.totalExpenses.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-error-600 text-sm">No hay egresos registrados</p>
          )}
        </div>
      </div>

      {/* Saldo Neto */}
      <div className={`p-4 rounded-lg border-2 ${report.netBalance >= 0 ? 'bg-primary-50 border-primary-300' : 'bg-warning-50 border-warning-300'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className={`h-6 w-6 mr-2 ${report.netBalance >= 0 ? 'text-primary-600' : 'text-warning-600'}`} />
            <span className={`text-lg font-semibold ${report.netBalance >= 0 ? 'text-primary-800' : 'text-warning-800'}`}>
              Saldo Neto:
            </span>
          </div>
          <span className={`text-2xl font-bold ${report.netBalance >= 0 ? 'text-primary-800' : 'text-warning-800'}`}>
            ${report.netBalance.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose} variant="primary">
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export const DailyCashFlow: React.FC = () => {
  const { getDailyCashFlowReport } = useSupabaseData();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [cashFlowReportData, setCashFlowReportData] = useState<DailyCashFlowReportDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);
  const [isDetailedReportModalOpen, setIsDetailedReportModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    try {
      const report = getDailyCashFlowReport(selectedDate);
      setCashFlowReportData(report);
    } catch (error) {
        console.error("Error fetching cash flow report for date:", selectedDate, error);
        setCashFlowReportData(null);
    }
    setIsLoading(false);
  }, [selectedDate, getDailyCashFlowReport]);

  const handleCalendarDateSelect = (date: Date) => {
    setSelectedDate(date.toISOString().split('T')[0]);
    setIsCalendarModalOpen(false);
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
  }

  return (
    <div className="bg-white p-5 shadow-lg rounded-lg h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-secondary-700 mb-1 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-primary-600"/>
            Flujo de Caja Diario
        </h3>
        <div className="flex items-center justify-between p-2 border border-secondary-200 rounded-md bg-secondary-50">
            <span className="text-sm text-secondary-700">
                Fecha: <span className="font-semibold">{formatDateForDisplay(selectedDate)}</span>
            </span>
            <div className="flex space-x-1">
              <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsCalendarModalOpen(true)} 
                  className="p-1.5 text-primary-600 hover:bg-primary-100"
                  title="Cambiar fecha"
              >
                  <Calendar size={18} />
              </Button>
              <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsDetailedReportModalOpen(true)} 
                  className="p-1.5 text-primary-600 hover:bg-primary-100"
                  title="Ver reporte detallado"
              >
                  <BarChart3 size={18} />
              </Button>
            </div>
        </div>
      </div>

      {isCalendarModalOpen && (
        <Modal 
            isOpen={isCalendarModalOpen} 
            onClose={() => setIsCalendarModalOpen(false)} 
            title="Seleccionar Fecha"
            size="md" 
        >
            <AppointmentCalendarView
                appointments={[]}
                onDateSelect={handleCalendarDateSelect}
            />
        </Modal>
      )}

      {isDetailedReportModalOpen && cashFlowReportData && (
        <Modal 
            isOpen={isDetailedReportModalOpen} 
            onClose={() => setIsDetailedReportModalOpen(false)} 
            title="Reporte Financiero Detallado"
            size="lg" 
        >
            <DailyFinancialReport
                selectedDate={selectedDate}
                onClose={() => setIsDetailedReportModalOpen(false)}
            />
        </Modal>
      )}
      
      {isLoading && <p className="text-center text-secondary-500 py-8">Cargando datos...</p>}
      
      {!isLoading && !cashFlowReportData && (
        <p className="text-center text-secondary-500 py-8 flex flex-col items-center">
            <AlertCircle size={30} className="mb-2 text-secondary-400"/>
            No se pudieron cargar los datos para la fecha seleccionada.
        </p>
      )}

      {!isLoading && cashFlowReportData && (
        <>
            <p className="text-xs text-secondary-500 mb-3 -mt-2">Mostrando reporte para: {formatDateForDisplay(cashFlowReportData.date)}</p>
            <div className="flex-grow space-y-4 overflow-y-auto pr-1 max-h-[calc(100vh-300px)] sm:max-h-[calc(100vh-350px)]">
            <div>
              <h4 className="text-sm font-semibold text-secondary-600 mb-2 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-success-600"/>Ingresos ({Object.keys(cashFlowReportData.incomeByMethod).length} métodos)
              </h4>
              <div className="space-y-1 pl-1 text-sm">
                {Object.entries(cashFlowReportData.incomeByMethod).map(([method, amount]) => (
                  <div key={method} className="flex justify-between items-center">
                    <span className="text-secondary-600 flex items-center">
                      <PaymentMethodIcon method={method as MetodoPago} />
                      {method}:
                    </span>
                    <span className="font-medium text-success-700">${(amount || 0).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-1 border-t border-dashed">
                  <span className="font-semibold text-secondary-700">Total Ingresos:</span>
                  <span className="font-bold text-success-600">${cashFlowReportData.totalIncome.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-secondary-600 mb-2 flex items-center">
                <TrendingDown className="h-5 w-5 mr-2 text-error-600"/>Egresos ({Object.keys(cashFlowReportData.expensesByCategory).length} categorías)
              </h4>
              <div className="space-y-1 pl-1 text-sm">
                {Object.keys(cashFlowReportData.expensesByCategory).length > 0 ? Object.entries(cashFlowReportData.expensesByCategory).map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-secondary-600 truncate pr-1" title={category as CategoriaGasto}>{category as CategoriaGasto}:</span>
                    <span className="font-medium text-error-700">${(amount || 0).toFixed(2)}</span>
                  </div>
                )) : <p className="text-xs text-secondary-500 italic">Sin egresos registrados.</p>}
                <div className="flex justify-between items-center pt-1 border-t border-dashed">
                  <span className="font-semibold text-secondary-700">Total Egresos:</span>
                  <span className="font-bold text-error-600">${cashFlowReportData.totalExpenses.toFixed(2)}</span>
                </div>
              </div>
            </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t mt-4">
            <span className="text-md font-bold text-secondary-800 flex items-center">Saldo Neto:</span>
            <span className={`font-bold text-xl ${cashFlowReportData.netBalance >= 0 ? 'text-primary-700' : 'text-error-700'}`}>
                ${cashFlowReportData.netBalance.toFixed(2)}
            </span>
            </div>
            {Object.keys(cashFlowReportData.incomeByMethod).length === 0 && Object.keys(cashFlowReportData.expensesByCategory).length === 0 && (
            <p className="text-xs text-center text-secondary-500 mt-3 italic flex items-center justify-center">
                <AlertCircle size={14} className="mr-1"/> No hay movimientos registrados para esta fecha.
            </p>
            )}
        </>
      )}
    </div>
  );
};