import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Cliente, Mascota, ClienteForm, MascotaForm, Especie, SexoMascota } from '../types';
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { PawPrint, Users, CalendarDays, ChevronDown, FileText } from 'lucide-react';
import { ESPECIES } from '../constants';
import { SpeciesIcon } from '../lib/speciesIcon';
import { getPetAge } from '../lib/petAge';
import {
  FilterCard, DataCard, TableWrap, Th, Td, Tr, RowActions, IconAction, EditIcon, DeleteIcon, EmptyState,
} from '../components/common/ListLayout';

// Client Form Component
interface ClientFormProps {
  initialData?: Cliente;
  onSave: (client: Cliente) => void;
  onClose: () => void;
}

const ClientFormComponent: React.FC<ClientFormProps> = ({ initialData, onSave, onClose }) => {
  const [formData, setFormData] = useState<ClienteForm>(
    initialData
      ? { nombre: initialData.nombre, telefono: initialData.telefono, email: initialData.email, domicilio: initialData.domicilio }
      : { nombre: '', telefono: '', email: '', domicilio: '' }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ClienteForm, string>>>({});
  const { addClient, updateClient } = useSupabaseData();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof ClienteForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ClienteForm, string>> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio.';
    else if (!/^\+?[0-9\s-()]{7,20}$/.test(formData.telefono)) newErrors.telefono = 'Teléfono inválido.';
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      if (initialData) {
        updateClient(initialData.id_cliente, formData);
        onSave({ ...initialData, ...formData, lastModified: Date.now() });
      } else {
        const newClient = addClient(formData);
        onSave(newClient);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nombre Completo" name="nombre" value={formData.nombre} onChange={handleChange} error={errors.nombre} required />
      <FormField label="Teléfono" name="telefono" type="tel" value={formData.telefono} onChange={handleChange} error={errors.telefono} required />
      <FormField label="Email (Opcional)" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} />
      <FormField label="Domicilio (Opcional)" name="domicilio" as="textarea" value={formData.domicilio} onChange={handleChange} error={errors.domicilio} />
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary">{initialData ? 'Guardar Cambios' : 'Crear Cliente'}</Button>
      </div>
    </form>
  );
};


// Pet Form Component - Exported for reuse
export interface PetFormProps {
  clientId: string;
  initialData?: Mascota;
  onSave: (pet: Mascota) => void;
  onClose: () => void;
}
export const PetFormComponent: React.FC<PetFormProps> = ({ clientId, initialData, onSave, onClose }) => {
  const { addPet, updatePet, breeds } = useSupabaseData();
  const initialFormState: MascotaForm = {
    nombre: '',
    especie: Especie.PERRO,
    raza_id: '',
    id_cliente: clientId,
    fecha_nacimiento: '',
    sexo: SexoMascota.MACHO,
  };

  const [formData, setFormData] = useState<MascotaForm>(
    initialData
      ? { nombre: initialData.nombre, especie: initialData.especie, raza_id: initialData.raza_id, id_cliente: initialData.id_cliente, fecha_nacimiento: initialData.fecha_nacimiento, sexo: initialData.sexo }
      : { ...initialFormState, id_cliente: clientId } // Ensure clientId is set for new pets
  );
  const [errors, setErrors] = useState<Partial<Record<keyof MascotaForm, string>>>({});

  const availableBreeds = useMemo(() => breeds.filter(r => r.especie === formData.especie), [breeds, formData.especie]);

  useEffect(() => { 
    if (!availableBreeds.find(r => r.id_raza === formData.raza_id)) {
      setFormData(prev => ({...prev, raza_id: availableBreeds[0]?.id_raza || ''}));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.especie, availableBreeds]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
     if (errors[name as keyof MascotaForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof MascotaForm, string>> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    if (!formData.especie) newErrors.especie = 'La especie es obligatoria.';
    if (!formData.raza_id) newErrors.raza_id = 'La raza es obligatoria.';
    if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = 'Fecha de nacimiento obligatoria.';
    if (!formData.id_cliente) newErrors.id_cliente = 'El cliente es obligatorio.'; // Should always be set by prop
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
       if (initialData) {
        updatePet(initialData.id_mascota, formData);
        onSave({ ...initialData, ...formData, lastModified: Date.now() });
      } else {
        const newPet = addPet(formData); // formData already includes id_cliente
        onSave(newPet);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nombre Mascota" name="nombre" value={formData.nombre} onChange={handleChange} error={errors.nombre} required />
      <FormField label="Especie" name="especie" as="select" value={formData.especie} onChange={handleChange} error={errors.especie as string} required options={ESPECIES.map(e => ({ value: e, label: e }))} />
      <FormField label="Raza" name="raza_id" as="select" value={formData.raza_id} onChange={handleChange} error={errors.raza_id} required options={availableBreeds.map(r => ({ value: r.id_raza, label: r.nombre }))} placeholder="Seleccione una raza" />
      <FormField label="Fecha de Nacimiento" name="fecha_nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleChange} error={errors.fecha_nacimiento} required />
      <FormField label="Sexo" name="sexo" as="select" value={formData.sexo} onChange={handleChange} required options={Object.values(SexoMascota).map(s => ({ value: s, label: s }))} />
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary">{initialData ? 'Guardar Cambios' : 'Registrar Mascota'}</Button>
      </div>
    </form>
  );
};


// Main Clients Page
export const ClientsPage: React.FC = () => {
  const { clients, getPetsByClientId, deleteClient, breeds, getMedicalHistoryByPetId, getClientById } = useSupabaseData();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | undefined>(undefined);
  const [editingPet, setEditingPet] = useState<Mascota | undefined>(undefined);
  const [selectedClientIdForPet, setSelectedClientIdForPet] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { clientId: routeClientId } = useParams<{ clientId?: string }>(); 

  useEffect(() => {
    if (routeClientId) { 
      if (routeClientId === 'new') {
        setEditingClient(undefined);
        setIsClientModalOpen(true);
      } else if (routeClientId.endsWith('/edit')) {
        const id = routeClientId.replace('/edit', '');
        const clientToEdit = getClientById(id);
        setEditingClient(clientToEdit);
        if (clientToEdit) setIsClientModalOpen(true); else navigate('/clients', {replace: true});
      } else if (getClientById(routeClientId)) {
        setExpandedClientId(routeClientId); 
      }
    }
  }, [routeClientId, getClientById, navigate]);


  const handleOpenClientModal = (client?: Cliente) => {
    setEditingClient(client);
    setIsClientModalOpen(true);
    navigate(client ? `/clients/${client.id_cliente}/edit` : '/clients/new', { replace: true });
  };

  const handleCloseClientModal = () => {
    setIsClientModalOpen(false);
    setEditingClient(undefined);
    if(routeClientId === 'new' || routeClientId?.endsWith('/edit')) {
        navigate('/clients', { replace: true }); 
    }
  };
  
  const handleClientSaved = () => {
    handleCloseClientModal();
  };

  const handleOpenPetModal = (clientId: string, pet?: Mascota) => {
    setSelectedClientIdForPet(clientId);
    setEditingPet(pet);
    setIsPetModalOpen(true);
  };

  const handleClosePetModal = () => {
    setIsPetModalOpen(false);
    setEditingPet(undefined);
    setSelectedClientIdForPet(undefined);
  };

  const handlePetSaved = () => {
    handleClosePetModal();
  };

  const handleDeleteClient = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este cliente y todas sus mascotas y datos asociados?')) {
      deleteClient(id);
      if (expandedClientId === id) {
        setExpandedClientId(null);
      }
    }
  };

  const filteredClients = clients.filter(client =>
    client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    client.telefono.includes(searchTerm)
  ).sort((a,b) => a.nombre.localeCompare(b.nombre));

  const toggleExpandClient = (id: string) => {
    const newExpandedId = expandedClientId === id ? null : id;
    setExpandedClientId(newExpandedId);
    if (newExpandedId) {
        navigate(`/clients/${newExpandedId}`, {replace: true});
    } else if (routeClientId && routeClientId === id) {
        navigate('/clients', {replace: true});
    }
  };
  
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.6px] text-secondary-900">Clientes</h1>
        <p className="mt-1 mb-0 text-sm text-secondary-600">Fichas de clientes y sus mascotas.</p>
      </div>

      <FilterCard
        title="Filtros de clientes"
        subtitle="Buscar por nombre, email o teléfono"
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar cliente…"
      />

      <DataCard
        title="Clientes"
        count={filteredClients.length}
        filtered={searchTerm.trim().length > 0}
        actionLabel="Nuevo"
        onAction={() => handleOpenClientModal()}
      >
        {filteredClients.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Cliente</Th>
                <Th>Teléfono</Th>
                <Th>Email</Th>
                <Th>Mascotas</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => {
                const clientPets = getPetsByClientId(client.id_cliente);
                const isExpanded = expandedClientId === client.id_cliente;
                return (
                  <React.Fragment key={client.id_cliente}>
                    <Tr onClick={() => toggleExpandClient(client.id_cliente)}>
                      <Td>
                        <span className="flex items-center gap-2">
                          <ChevronDown
                            size={15}
                            className={`text-secondary-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                          <span className="font-semibold text-secondary-900">{client.nombre}</span>
                        </span>
                      </Td>
                      <Td className="font-mono text-[12.5px]">{client.telefono || '—'}</Td>
                      <Td className="text-secondary-600">{client.email || '—'}</Td>
                      <Td>
                        <span className="font-mono text-[11.5px] font-semibold bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
                          {clientPets.length}
                        </span>
                      </Td>
                      <Td>
                        <RowActions>
                          <IconAction label="Agregar mascota" onClick={() => handleOpenPetModal(client.id_cliente)}>
                            <PawPrint size={15} />
                          </IconAction>
                          <IconAction label="Editar cliente" onClick={() => handleOpenClientModal(client)}>
                            <EditIcon />
                          </IconAction>
                          <IconAction label="Eliminar cliente" variant="danger" onClick={() => handleDeleteClient(client.id_cliente)}>
                            <DeleteIcon />
                          </IconAction>
                        </RowActions>
                      </Td>
                    </Tr>

                    {isExpanded && (
                      <tr className="border-b border-secondary-100">
                        <td colSpan={5} className="px-5 py-4 bg-secondary-50">
                          {clientPets.length > 0 ? (
                            <ul className="flex flex-col gap-2 m-0 p-0 list-none">
                              {clientPets.map(pet => {
                                const breed = breeds.find(b => b.id_raza === pet.raza_id);
                                const historyCount = getMedicalHistoryByPetId(pet.id_mascota).length;
                                const edad = getPetAge(pet.fecha_nacimiento);
                                return (
                                  <li
                                    key={pet.id_mascota}
                                    className="flex flex-wrap items-center gap-3 bg-surface border border-secondary-200 rounded-[10px] px-3.5 py-2.5"
                                  >
                                    <span className="w-8 h-8 rounded-lg bg-secondary-100 text-secondary-600 flex items-center justify-center flex-shrink-0">
                                      <SpeciesIcon especie={pet.especie} size={16} />
                                    </span>
                                    <span className="flex-1 min-w-0 flex flex-col">
                                      <span className="text-[13px] font-semibold text-secondary-900 truncate">{pet.nombre}</span>
                                      <span className="text-[11.5px] text-secondary-500 truncate">
                                        {pet.especie} · {breed?.nombre || 'Raza desconocida'} · {pet.sexo}
                                        {edad && ` · ${edad.label}`}
                                      </span>
                                    </span>
                                    <RowActions>
                                      <Link to={`/pets/${pet.id_mascota}/history`} title={`Historial médico (${historyCount})`}>
                                        <span className="w-[34px] h-[34px] rounded-[9px] border border-secondary-200 text-secondary-600
                                                         hover:bg-secondary-100 hover:text-secondary-900 flex items-center justify-center transition-colors">
                                          <FileText size={15} />
                                        </span>
                                      </Link>
                                      <Link to={`/appointments?action=new&clientId=${client.id_cliente}&petId=${pet.id_mascota}`} title="Nuevo turno">
                                        <span className="w-[34px] h-[34px] rounded-[9px] border border-secondary-200 text-secondary-600
                                                         hover:bg-secondary-100 hover:text-secondary-900 flex items-center justify-center transition-colors">
                                          <CalendarDays size={15} />
                                        </span>
                                      </Link>
                                      <IconAction label="Editar mascota" onClick={() => handleOpenPetModal(client.id_cliente, pet)}>
                                        <EditIcon />
                                      </IconAction>
                                    </RowActions>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="m-0 text-[13px] text-secondary-500">
                              Este cliente todavía no tiene mascotas registradas.
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </TableWrap>
        ) : (
          <EmptyState
            icon={<Users size={24} />}
            title={searchTerm ? 'Sin resultados' : 'No hay clientes'}
            hint={searchTerm ? 'Probá con otros términos de búsqueda.' : 'Empezá agregando un cliente con el botón Nuevo.'}
          />
        )}
      </DataCard>

      {isClientModalOpen && (
        <Modal isOpen={isClientModalOpen} onClose={handleCloseClientModal} title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}>
          <ClientFormComponent initialData={editingClient} onSave={handleClientSaved} onClose={handleCloseClientModal} />
        </Modal>
      )}

      {isPetModalOpen && selectedClientIdForPet && (
        <Modal isOpen={isPetModalOpen} onClose={handleClosePetModal} title={editingPet ? 'Editar Mascota' : 'Nueva Mascota'}>
          <PetFormComponent clientId={selectedClientIdForPet} initialData={editingPet} onSave={handlePetSaved} onClose={handleClosePetModal} />
        </Modal>
      )}
    </div>
  );
};
