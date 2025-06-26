import React from 'react';
import { Link } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Turno, EstadoVenta } from '../types'; 
import { Button } from '../components/common/Button';
import { DailyCashFlow } from '../components/Dashboard/DailyCashFlow'; 
import { CalendarDays, Users, PawPrint, ShoppingCart, Plus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  linkTo?: string;
  colorClasses?: string; 
  footerLinkText?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, linkTo, colorClasses = "bg-primary-100 text-primary-600", footerLinkText = "Ver más" }) => (
  <div className="bg-white overflow-hidden shadow-lg rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-md p-3 ${colorClasses}`}>
          {icon}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-secondary-500 truncate">{title}</dt>
            <dd className="text-2xl font-semibold text-secondary-900">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
    {linkTo && (
      <div className="bg-secondary-50 px-5 py-3">
        <div className="text-sm">
          <Link to={linkTo} className="font-medium text-primary-600 hover:text-primary-500">
            {footerLinkText} &rarr;
          </Link>
        </div>
      </div>
    )}
  </div>
);

const UpcomingAppointmentItem: React.FC<{ appointment: Turno }> = ({ appointment }) => {
  const { getClientById, getPetById } = useSupabaseData();
  const client = getClientById(appointment.cliente_id);
  const pet = getPetById(appointment.mascota_id);

  return (
    <li className="py-3 px-1 hover:bg-secondary-50 rounded-md transition-colors duration-150">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <CalendarDays className="h-7 w-7 text-primary-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary-700 truncate">{appointment.motivo}</p>
          <p className="text-sm text-secondary-500 truncate">
            {client?.nombre || 'Cliente Desconocido'} - {pet?.nombre || 'Mascota Desconocida'} ({pet?.especie || 'N/A'})
          </p>
        </div>
        <div className="text-sm text-secondary-600 text-right">
            <p>{new Date(appointment.fecha).toLocaleDateString()}</p>
            <p>{appointment.hora}</p>
        </div>
      </div>
    </li>
  );
};

export const DashboardPage: React.FC = () => {
  const { clients, pets, getUpcomingAppointments, ventas } = useSupabaseData(); 
  const upcomingAppointments = getUpcomingAppointments().slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-secondary-800">Dashboard Veterinario</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Clientes Activos" value={clients.length} icon={<Users className="h-6 w-6"/>} linkTo="/clients" colorClasses="bg-accent-100 text-accent-700" />
        <StatCard title="Mascotas Registradas" value={pets.length} icon={<PawPrint className="h-6 w-6"/>} linkTo="/pets" colorClasses="bg-success-100 text-success-700" />
        <StatCard title="Turnos Próximos" value={getUpcomingAppointments().length} icon={<CalendarDays className="h-6 w-6"/>} linkTo="/appointments" colorClasses="bg-warning-100 text-warning-700" />
        <StatCard title="Ventas Pendientes" value={ventas.filter(v => v.estado === EstadoVenta.PENDIENTE).length} icon={<ShoppingCart className="h-6 w-6"/>} linkTo="/ventas" colorClasses="bg-error-100 text-error-700" /> 
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-lg h-full"> 
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-secondary-700">Próximos Turnos ({upcomingAppointments.length})</h2>
                    <Link to="/appointments?action=new">
                    <Button variant="ghost" size="sm" leftIcon={<Plus />}>
                        Nuevo Turno
                    </Button>
                    </Link>
                </div>
                {upcomingAppointments.length > 0 ? (
                    <ul className="divide-y divide-secondary-200 max-h-96 overflow-y-auto pr-2">
                    {upcomingAppointments.map(app => (
                        <UpcomingAppointmentItem key={app.id_turno} appointment={app} />
                    ))}
                    </ul>
                ) : (
                    <div className="text-center py-8">
                        <CalendarDays className="h-16 w-16 text-secondary-300 mx-auto mb-2"/>
                        <p className="text-secondary-500">No hay turnos próximos agendados.</p>
                    </div>
                )}
            </div>
        </div>

        <div className="lg:col-span-1">
          <DailyCashFlow />
        </div>
      </div>
    </div>
  );
};