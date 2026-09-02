import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Turno, TurnoForm, Cliente, Mascota, TipoEventoHistorial, EstadoTurno } from '../types';
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { ConsultationFormComponent } from '../components/forms/ConsultationFormComponent'; 
import { AppointmentCalendarView } from '../components/AppointmentCalendarView';
import { CalendarDays, CheckCircle, UserX, List } from 'lucide-react';
import { SpeciesIcon } from '../lib/speciesIcon';
import {
  Card, DataCard, TableWrap, Th, Td, Tr, RowActions, IconAction, EditIcon, DeleteIcon, ViewIcon, EmptyState,
} from '../components/common/ListLayout';

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

  const hayFiltro = filter !== EstadoTurno.PENDIENTE || selectedDateFilter !== null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.6px] text-secondary-900">Turnos</h1>
          <p className="mt-1 mb-0 text-sm text-secondary-600">Agenda de la clínica.</p>
        </div>
        {/* Lista / Calendario: segmentado, para que se lea como dos vistas de lo mismo */}
        <div className="flex bg-surface border border-secondary-200 rounded-[11px] p-1 gap-0.5">
          <button
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-colors ${
              viewMode === 'list' ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-100'
            }`}
          >
            <List size={15} />Lista
          </button>
          <button
            onClick={() => { setViewMode('calendar'); setSelectedDateFilter(null); }}
            aria-pressed={viewMode === 'calendar'}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-colors ${
              viewMode === 'calendar' ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-100'
            }`}
          >
            <CalendarDays size={15} />Calendario
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <>
          <Card className="px-5 py-[18px]">
            <div className="flex items-start justify-between gap-4 mb-3.5">
              <div>
                <h2 className="m-0 text-[16.5px] font-bold tracking-[-0.3px] text-secondary-900">Filtros de turnos</h2>
                <p className="mt-0.5 mb-0 text-[12.5px] text-secondary-500">Filtrar por estado del turno</p>
              </div>
              {selectedDateFilter && (
                <button
                  onClick={clearDateFilter}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[9px] border border-secondary-200
                             text-[12.5px] font-semibold text-secondary-600 hover:bg-secondary-100 transition-colors flex-shrink-0"
                >
                  {new Date(selectedDateFilter + 'T00:00:00').toLocaleDateString('es-AR')} · Limpiar
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  aria-pressed={filter === opt.value}
                  className={`px-3 py-2 rounded-[9px] text-[12.5px] font-semibold transition-colors border ${
                    filter === opt.value
                      ? 'bg-primary-50 border-primary-200 text-primary-700'
                      : 'bg-surface border-secondary-200 text-secondary-600 hover:bg-secondary-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Card>

          <DataCard
            title="Turnos"
            count={filteredAppointments.length}
            filtered={hayFiltro}
            actionLabel="Nuevo"
            onAction={() => handleOpenAppointmentModal()}
          >
            {filteredAppointments.length > 0 ? (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Fecha y hora</Th>
                    <Th>Cliente</Th>
                    <Th>Mascota</Th>
                    <Th>Motivo</Th>
                    <Th>Estado</Th>
                    <Th className="text-right">Acciones</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map(app => {
                    const client = getClientById(app.cliente_id);
                    const pet = getPetById(app.mascota_id);
                    const badge: Record<string, string> = {
                      [EstadoTurno.PENDIENTE]: 'bg-warning-50 text-warning-700',
                      [EstadoTurno.ATENDIDO]: 'bg-primary-50 text-primary-700',
                      [EstadoTurno.AUSENTE]: 'bg-secondary-100 text-secondary-600',
                      [EstadoTurno.CANCELADO]: 'bg-error-50 text-error-600',
                    };

                    return (
                      <Tr key={app.id_turno}>
                        <Td className="whitespace-nowrap">
                          <span className="flex flex-col">
                            <span className="font-mono text-[12.5px] text-secondary-900">
                              {new Date(app.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                            </span>
                            <span className="font-mono text-[11.5px] text-primary-700 font-semibold">{app.hora}</span>
                          </span>
                        </Td>
                        <Td className="text-secondary-700">{client?.nombre || '—'}</Td>
                        <Td>
                          <span className="flex items-center gap-2">
                            <SpeciesIcon especie={pet?.especie} size={15} className="text-secondary-500 flex-shrink-0" />
                            <span className="text-secondary-700">{pet?.nombre || '—'}</span>
                          </span>
                        </Td>
                        <Td className="max-w-xs truncate text-secondary-700">{app.motivo}</Td>
                        <Td>
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${badge[app.estado] ?? badge[EstadoTurno.PENDIENTE]}`}>
                            {app.estado}
                          </span>
                        </Td>
                        <Td>
                          <RowActions>
                            {app.estado === EstadoTurno.PENDIENTE && (
                              <>
                                <IconAction label="Atender turno" onClick={() => handleOpenConsultationModal(app)}>
                                  <CheckCircle size={15} />
                                </IconAction>
                                <IconAction label="Marcar ausente" onClick={() => handleMarkAbsent(app)}>
                                  <UserX size={15} />
                                </IconAction>
                                <IconAction label="Editar turno" onClick={() => handleOpenAppointmentModal(app)}>
                                  <EditIcon />
                                </IconAction>
                              </>
                            )}
                            {app.estado === EstadoTurno.ATENDIDO && pet && (
                              <IconAction label="Ver historial médico" onClick={() => navigate(`/pets/${pet.id_mascota}/history`)}>
                                <ViewIcon />
                              </IconAction>
                            )}
                            <IconAction label="Eliminar turno" variant="danger" onClick={() => handleDeleteAppointment(app.id_turno)}>
                              <DeleteIcon />
                            </IconAction>
                          </RowActions>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            ) : (
              <EmptyState
                icon={<CalendarDays size={24} />}
                title="No hay turnos"
                hint="Ningún turno coincide con los filtros actuales."
              />
            )}
          </DataCard>
        </>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-surface p-4 rounded-lg shadow-lg">
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
            title="Atender turno"
            size="3xl"
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