
import React, { useState } from 'react';
import { Turno, EstadoTurno } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AppointmentCalendarViewProps {
  appointments: Turno[];
  onDateSelect: (date: Date, appointmentsOnDate: Turno[]) => void;
}

export const AppointmentCalendarView: React.FC<AppointmentCalendarViewProps> = ({ appointments, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Adjust start date to the beginning of the week (Sunday)
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // Adjust end date to the end of the week (Saturday)
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days: Date[] = [];
  let day = new Date(startDate);
  while (day <= endDate) {
    days.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const appointmentsByDate: { [key: string]: Turno[] } = {};
  appointments.forEach(app => {
    const dateKey = app.fecha; // YYYY-MM-DD
    if (!appointmentsByDate[dateKey]) {
      appointmentsByDate[dateKey] = [];
    }
    appointmentsByDate[dateKey].push(app);
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getIndicatorColor = (appDateKey: string): string => {
    const appsOnDate = appointmentsByDate[appDateKey] || [];
    if (appsOnDate.some(a => a.estado === EstadoTurno.PENDIENTE)) return 'bg-warning-500';
    if (appsOnDate.some(a => a.estado === EstadoTurno.AUSENTE)) return 'bg-secondary-400'; // Changed from gray for better visibility
    if (appsOnDate.some(a => a.estado === EstadoTurno.ATENDIDO)) return 'bg-success-500';
    if (appsOnDate.some(a => a.estado === EstadoTurno.CANCELADO)) return 'bg-error-500';
    return 'bg-transparent'; // No appointments, or all are in a state not explicitly colored
  };

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <button 
            onClick={handlePrevMonth} 
            className="p-2 rounded-full hover:bg-secondary-100 text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500" 
            aria-label="Mes anterior"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg sm:text-xl font-semibold text-secondary-700 text-center">
          {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
        </h2>
        <button 
            onClick={handleNextMonth} 
            className="p-2 rounded-full hover:bg-secondary-100 text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500" 
            aria-label="Mes siguiente"
        >
          <ChevronRight size={24} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px border-t border-l border-secondary-200 bg-secondary-200">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dayName => (
          <div key={dayName} className="py-2 text-center text-xs font-medium text-secondary-600 bg-secondary-100 border-b border-r border-secondary-200">
            {dayName}
          </div>
        ))}
        {days.map((d, index) => {
          const dateKey = d.toISOString().split('T')[0];
          const appsOnThisDate = appointmentsByDate[dateKey] || [];
          const isToday = d.toDateString() === new Date().toDateString();
          const isCurrentMonth = d.getMonth() === currentDate.getMonth();

          return (
            <div
              key={dateKey + '-' + index}
              className={`p-1.5 sm:p-2 h-20 sm:h-24 flex flex-col items-start cursor-pointer transition-colors duration-150 relative
                          border-b border-r border-secondary-200
                          ${isCurrentMonth ? 'bg-white hover:bg-primary-50' : 'bg-secondary-50 text-secondary-400 hover:bg-secondary-100'}
                          ${isToday && isCurrentMonth ? 'ring-2 ring-primary-500 z-10' : ''}`}
              onClick={() => onDateSelect(d, appsOnThisDate)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onDateSelect(d, appsOnThisDate);}}
              aria-label={`Ver turnos para ${d.toLocaleDateString('es-ES')}`}
            >
              <span className={`text-xs sm:text-sm font-medium ${isCurrentMonth ? 'text-secondary-700' : 'text-secondary-400'}`}>{d.getDate()}</span>
              {appsOnThisDate.length > 0 && isCurrentMonth && (
                <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 flex flex-col items-center">
                    <div className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${getIndicatorColor(dateKey)}`} title={`${appsOnThisDate.length} turno(s)`}></div>
                    {appsOnThisDate.length > 0 && <span className="text-xs text-primary-600 font-semibold mt-0.5">{appsOnThisDate.length}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
