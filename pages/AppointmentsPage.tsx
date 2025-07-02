import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Turno, TurnoForm, Cliente, Mascota, TipoEventoHistorial, EstadoTurno } from '../types';
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { ConsultationFormComponent } from '../components/forms/ConsultationFormComponent'; 
import { AppointmentCalendarView } from '../components/AppointmentCalendarView';
import { Plus, Edit3, Trash2, CalendarDays, CheckCircle, UserX, List, Eye } from 'lucide-react';

// Appointment Form Component
interface AppointmentFormProps {
  initialData?: Turno;
  onSave: (appointment: Turno) => void;
  onClose: () => void;
  preselectedClientId?: string;
  preselectedPetId?: string;
}

const AppointmentFormComponent: React.FC<AppointmentFormProps> = ({ initialData, onSave, onClose, preselectedClientId, preselectedPetId }) => {
  const { clients, getPetsByClientId, addAppointment, updateAppointment, getPetById } = useSupabaseData();
  
  const [formData, setFormData] = useState<TurnoForm>(() => {
    if (initialData) {
      return { cliente_id: initialData.cliente_id, mascota_id: initialData.mascota_id, fecha: initialData.fecha, hora: initialData.hora, motivo: initialData.motivo };
    }
    let determinedClientId = preselectedClientId || '';
    if (preselectedPetId && !preselectedClientId) { 
        const pet = getPetById(preselectedPetId);
        if (pet) determinedClientId = pet.id_cliente;
    }
    return { cliente_id: determinedClientId, mascota_id: preselectedPetId || '', fecha: new Date().toISOString().split('T')[0], hora: '09:00', motivo: '' };
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TurnoForm, string>>>({});
  const [availablePets, setAvailablePets] = useState<Mascota[]>([]);

  useEffect(() => {
    if (formData.cliente_id) {
      const clientPets = getPetsByClientId(formData.cliente_id);
      setAvailablePets(clientPets);
      if (!clientPets.find(p => p.id_mascota === formData.mascota_id)) {
        setFormData(prev => ({ ...prev, mascota_id: '' }));
      }
    } else {
      setAvailablePets([]);
      setFormData(prev => ({ ...prev, mascota_id: '' }));
    }
  }, [formData.cliente_id, getPetsByClientId, formData.mascota_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "cliente_id") { 
        setFormData(prev => ({ ...prev, mascota_id: '' })); 
    }
    if (errors[name as keyof TurnoForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TurnoForm, string>> = {};
    if (!formData.cliente_id) newErrors.cliente_id = 'Seleccione un cliente.';
    if (!formData.mascota_id) newErrors.mascota_id = 'Seleccione una mascota.';
    if (!formData.fecha) newErrors.fecha = 'La fecha es obligatoria.';
    if (!formData.hora) newErrors.hora = 'La hora es obligatoria.';
    if (!formData.motivo.trim()) newErrors.motivo = 'El motivo es obligatorio.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      if (initialData) {
        updateAppointment(initialData.id_turno, {...formData, estado: initialData.estado}); 
        onSave({ ...initialData, ...formData, estado: initialData.estado, lastModified: Date.now() });
      } else {
        const newAppointment = addAppointment(formData);
        onSave(newAppointment);
      }
    }
  };
  
  const clientOptions = clients.map(c => ({ value: c.id_cliente, label: c.nombre })).sort((a,b) => a.label.localeCompare(b.label));
  const petOptions = availablePets.map(p => ({ value: p.id_mascota, label: p.nombre })).sort((a,b) => a.label.localeCompare(b.label));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField 
        label="Cliente" 
        name="cliente_id" 
        as="searchable-select" 
        value={formData.cliente_id} 
        onChange={handleChange} 
        error={errors.cliente_id} 
        required 
        options={clientOptions} 
        placeholder="Buscar y seleccionar cliente..." 
      />
      
      <FormField 
        label="Mascota" 
        name="mascota_id" 
        as="searchable-select" 
        value={formData.mascota_id} 
        onChange={handleChange} 
        error={errors.mascota_id} 
        required 
        options={petOptions} 
        placeholder={availablePets.length > 0 ? "Buscar y seleccionar mascota..." : "No hay mascotas para este cliente"} 
        disabled={!formData.cliente_id || availablePets.length === 0} 
      />
      
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} error={errors.fecha} required />
        <FormField label="Hora" name="hora" type="time" value={formData.hora} onChange={handleChange} error={errors.hora} required />
      </div>
      <FormField label="Motivo de la Consulta" name="motivo" as="textarea" value={formData.motivo} onChange={handleChange} error={errors.motivo} required rows={3}/>
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary">{initialData ? 'Guardar Cambios' : 'Crear Turno'}</Button>
      </div>
    </form>
  );
};

export const AppointmentsPage: React.FC = () => {
  const { appointments, deleteAppointment, getClientById, getPetById, updateAppointment, addMedicalHistoryEvent } = useSupabaseData();
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Turno | undefined>(undefined);
  const [filter, setFilter] = useState<EstadoTurno | 'all'>(EstadoTurno.PENDIENTE);
  
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [selectedAppointmentForConsultation, setSelectedAppointmentForConsultation] = useState<Turno | undefined>(undefined);

  const [preselectedClientIdForForm, setPreselectedClientIdForForm] = useState<string | undefined>(undefined);
  const [preselectedPetIdForForm, setPreselectedPetIdForForm] = useState<string | undefined>(undefined);

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const currentAction = searchParams.get('action');
    const currentId = searchParams.get('id');

    if (currentAction === 'new') {
      const clientIdFromParams = searchParams.get('clientId');
      const petIdFromParams = searchParams.get('petId');
      
      setPreselectedClientIdForForm(clientIdFromParams || undefined);
      setPreselectedPetIdForForm(petIdFromParams || undefined);
      setEditingAppointment(undefined);
      setIsAppointmentModalOpen(true);
    } else if (currentAction === 'edit' && currentId) {
      const appointmentToEdit = appointments.find(a => a.id_turno === currentId);
      setEditingAppointment(appointmentToEdit);
      setPreselectedClientIdForForm(undefined); 
      setPreselectedPetIdForForm(undefined);   
      if (appointmentToEdit) {
        setIsAppointmentModalOpen(true);
      } else {
        navigate('/appointments', { replace: true });
        setIsAppointmentModalOpen(false); 
      }
    } else {
      if (isAppointmentModalOpen) {
        setIsAppointmentModalOpen(false);
      }
      setEditingAppointment(undefined);
      setPreselectedClientIdForForm(undefined);
      setPreselectedPetIdForForm(undefined);
    }
  }, [searchParams, appointments, navigate]);

  const handleOpenAppointmentModal = (appointment?: Turno) => {
    const params = new URLSearchParams(); 
    if (appointment) {
        params.set('action', 'edit');
        params.set('id', appointment.id_turno);
    } else {
        params.set('action', 'new');
        const currentClientId = searchParams.get('clientId'); 
        const currentPetId = searchParams.get('petId');
        if (currentClientId) params.set('clientId', currentClientId);
        if (currentPetId) params.set('petId', currentPetId);
    }
    navigate(`/appointments?${params.toString()}`, { replace: true });
  };

  const handleCloseAppointmentModal = () => {
    navigate('/appointments', { replace: true });
  };

  const handleSaveAppointment = (_appointment: Turno) => {
    handleCloseAppointmentModal();
  };

  const handleDeleteAppointment = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este turno? Esta acción no se puede deshacer.')) {
      deleteAppointment(id);
    }
  };
  
  const handleOpenConsultationModal = (appointment: Turno) => {
    setSelectedAppointmentForConsultation(appointment);
    setIsConsultationModalOpen(true);
  };

  const handleConsultationSave = (consultationAppointment: Turno) => {
    updateAppointment(consultationAppointment.id_turno, { estado: EstadoTurno.ATENDIDO });
    setIsConsultationModalOpen(false);
    setSelectedAppointmentForConsultation(undefined);
  };

  const handleConsultationClose = () => {
    setIsConsultationModalOpen(false);
    setSelectedAppointmentForConsultation(undefined);
  };

  const handleMarkAbsent = (appointment: Turno) => {
    if (window.confirm('¿Está seguro de marcar este turno como AUSENTE? Se registrará en el historial médico.')) {
      updateAppointment(appointment.id_turno, { estado: EstadoTurno.AUSENTE });
      addMedicalHistoryEvent(
        appointment.mascota_id, 
        TipoEventoHistorial.CONSULTA, 
        `Paciente Ausente para el turno. Motivo original: ${appointment.motivo}`,
        appointment.id_turno, 
        `${appointment.fecha} ${appointment.hora}` 
      );
    }
  };

  const handleCalendarDateSelect = (date: Date, _appointmentsOnDate: Turno[]) => {
    setSelectedDateFilter(date.toISOString().split('T')[0]);
    setViewMode('list'); 
  };

  const clearDateFilter = () => {
    setSelectedDateFilter(null);
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.fecha}T${a.hora}`).getTime();
    const dateB = new Date(`${b.fecha}T${b.hora}`).getTime();
    if (dateA !== dateB) return dateA - dateB;

    const statusOrder = { [EstadoTurno.PENDIENTE]: 1, [EstadoTurno.AUSENTE]: 2, [EstadoTurno.ATENDIDO]: 3, [EstadoTurno.CANCELADO]: 4 };
    return (statusOrder[a.estado] || 99) - (statusOrder[b.estado] || 99);
  });
  
  const filteredAppointments = sortedAppointments.filter(app => {
    let matchesFilter = true;
    if (filter !== 'all') {
      matchesFilter = app.estado === filter;
    }
    if (selectedDateFilter && matchesFilter) {
      matchesFilter = app.fecha === selectedDateFilter;
    }
    return matchesFilter;
  });

  const filterOptions: {value: EstadoTurno | 'all', label: string}[] = [
    {value: EstadoTurno.PENDIENTE, label: 'Pendientes'},
    {value: EstadoTurno.ATENDIDO, label: 'Atendidos'},
    {value: EstadoTurno.AUSENTE, label: 'Ausentes'},
    {value: EstadoTurno.CANCELADO, label: 'Cancelados'},
    {value: 'all', label: 'Todos'},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-secondary-800">Gestión de Turnos</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex space-x-1">
                <Button 
                    variant={viewMode === 'list' ? 'primary' : 'outline'}
                    onClick={() => setViewMode('list')} 
                    size="sm" 
                    leftIcon={<List size={16}/>}
                    className={viewMode === 'list' ? '' : 'border-secondary-300 text-secondary-600 hover:bg-secondary-50'}
                >
                    Lista
                </Button>
                <Button 
                    variant={viewMode === 'calendar' ? 'primary' : 'outline'}
                    onClick={() => { setViewMode('calendar'); setSelectedDateFilter(null);}} 
                    size="sm" 
                    leftIcon={<CalendarDays size={16}/>}
                    className={viewMode === 'calendar' ? '' : 'border-secondary-300 text-secondary-600 hover:bg-secondary-50'}
                >
                    Calendario
                </Button>
            </div>
            <Button onClick={() => handleOpenAppointmentModal()} leftIcon={<Plus />} size="sm">
            Nuevo Turno
            </Button>
        </div>
      </div>
    
      {viewMode === 'list' && (
        <>
        <div className="bg-white p-3 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex flex-wrap gap-1">
                {filterOptions.map(opt => (
                <Button
                    key={opt.value}
                    variant={filter === opt.value ? 'primary' : 'outline'}
                    onClick={() => setFilter(opt.value)}
                    size="sm"
                    className={filter === opt.value ? '' : 'border-secondary-300 text-secondary-600 hover:bg-secondary-50'}
                >
                    {opt.label}
                </Button>
                ))}
            </div>
            {selectedDateFilter && (
                <div className="flex items-center gap-2">
                    <p className="text-sm text-secondary-700">
                        Mostrando turnos para: <span className="font-semibold">{new Date(selectedDateFilter + 'T00:00:00').toLocaleDateString()}</span>
                    </p>
                    <Button onClick={clearDateFilter} size="sm" variant="ghost" className="text-primary-600 hover:text-primary-700">
                        Limpiar Filtro
                    </Button>
                </div>
            )}
        </div>
        <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
                <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Fecha y Hora</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Cliente</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Mascota</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Motivo</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Acciones</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
                {filteredAppointments.length > 0 ? filteredAppointments.map(app => {
                const client = getClientById(app.cliente_id);
                const pet = getPetById(app.mascota_id);
                
                let statusColorClass = '';
                const statusText = app.estado; 
                switch(app.estado) {
                    case EstadoTurno.PENDIENTE: 
                        statusColorClass = 'bg-warning-100 text-warning-800';
                        break;
                    case EstadoTurno.ATENDIDO: 
                        statusColorClass = 'bg-success-100 text-success-800';
                        break;
                    case EstadoTurno.AUSENTE: 
                        statusColorClass = 'bg-secondary-200 text-secondary-700';
                        break;
                    case EstadoTurno.CANCELADO:
                        statusColorClass = 'bg-error-100 text-error-800';
                        break;
                }

                return (
                    <tr key={app.id_turno} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-secondary-900">{new Date(app.fecha + 'T00:00:00').toLocaleDateString()}</div>
                          <div className="text-xs text-secondary-500">{app.hora}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-700">{client?.nombre || 'N/A'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-700">{pet?.nombre || 'N/A'}</td>
                      <td className="px-4 py-4 text-sm text-secondary-700 max-w-xs truncate" title={app.motivo}>{app.motivo}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorClass}`}>
                          {statusText}
                          </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-1">
                          {app.estado === EstadoTurno.PENDIENTE && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => handleOpenConsultationModal(app)} title="Atender Turno" className="text-success-600 hover:bg-success-50 p-1.5">
                                    <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleMarkAbsent(app)} title="Marcar Ausente" className="text-secondary-600 hover:bg-secondary-100 p-1.5">
                                    <UserX className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleOpenAppointmentModal(app)} title="Editar Turno" className="text-accent-600 hover:bg-accent-50 p-1.5" disabled={app.estado !== EstadoTurno.PENDIENTE}>
                                    <Edit3 className="h-4 w-4" />
                                </Button>
                              </>
                          )}
                           {app.estado === EstadoTurno.ATENDIDO && pet && (
                                <Button size="sm" variant="ghost" onClick={() => navigate(`/pets/${pet.id_mascota}/history`)} title="Ver Historial" className="text-blue-600 hover:bg-blue-50 p-1.5">
                                    <Eye className="h-4 w-4" />
                                </Button>
                           )}
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteAppointment(app.id_turno)} title="Eliminar Turno" className="text-error-600 hover:bg-error-50 p-1.5">
                              <Trash2 className="h-4 w-4" />
                          </Button>
                          </div>
                      </td>
                    </tr> 
                );
                }) : (
                <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-secondary-500">
                    <CalendarDays className="mx-auto h-10 w-10 text-secondary-400 mb-2" />
                    No hay turnos para mostrar con los filtros actuales.
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
        </>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-white p-4 rounded-lg shadow-lg">
            <AppointmentCalendarView 
                appointments={appointments} 
                onDateSelect={handleCalendarDateSelect} 
            />
        </div>
      )}

      {isAppointmentModalOpen && (
        <Modal 
            isOpen={isAppointmentModalOpen} 
            onClose={handleCloseAppointmentModal} 
            title={editingAppointment ? 'Editar Turno' : 'Nuevo Turno'}
        >
          <AppointmentFormComponent 
            initialData={editingAppointment} 
            onSave={handleSaveAppointment} 
            onClose={handleCloseAppointmentModal} 
            preselectedClientId={preselectedClientIdForForm}
            preselectedPetId={preselectedPetIdForForm}
          />
        </Modal>
      )}

      {isConsultationModalOpen && selectedAppointmentForConsultation && (
        <Modal 
            isOpen={isConsultationModalOpen} 
            onClose={handleConsultationClose} 
            title={`Registrar Consulta para: ${getPetById(selectedAppointmentForConsultation.mascota_id)?.nombre}`} 
            size="xl"
        >
          <ConsultationFormComponent 
            appointment={selectedAppointmentForConsultation} 
            onSave={() => handleConsultationSave(selectedAppointmentForConsultation)} 
            onClose={handleConsultationClose} 
          />
        </Modal>
      )}
    </div>
  );
};