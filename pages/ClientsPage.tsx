import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Cliente, Mascota, ClienteForm, MascotaForm, Especie, SexoMascota } from '../types';
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { Plus, Edit3, Trash2, PawPrint, Users, CalendarDays, ChevronDown, FileText } from 'lucide-react';
import { RAZAS_PREDEFINIDAS, ESPECIES } from '../constants';

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
  
  const animationStyle = {
    maxHeight: '1000px',
    overflow: 'hidden',
    transition: 'max-height 0.5s ease-in-out, padding-top 0.5s ease-in-out, padding-bottom 0.5s ease-in-out, opacity 0.5s ease-in-out',
  };
  const collapsedStyle = {
    maxHeight: '0',
    paddingTop: '0',
    paddingBottom: '0',
    opacity: 0,
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-secondary-800">Gestión de Clientes</h1>
        <Button onClick={() => handleOpenClientModal()} leftIcon={<Plus />}>
          Nuevo Cliente
        </Button>
      </div>

      <div className="bg-white p-4 shadow rounded-lg">
        <FormField
          label=""
          name="searchClient"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar clientes por nombre, email o teléfono..."
          inputClassName="text-sm"
          className="mb-0" // remove bottom margin from FormField wrapper
        />
      </div>


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

      <div className="space-y-4">
        {filteredClients.length > 0 ? filteredClients.map(client => {
          const clientPets = getPetsByClientId(client.id_cliente);
          const isExpanded = expandedClientId === client.id_cliente;
          return (
            <div key={client.id_cliente} className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-4 sm:p-5 cursor-pointer hover:bg-secondary-50 transition-colors duration-150" onClick={() => toggleExpandClient(client.id_cliente)}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-primary-700">{client.nombre}</h2>
                    <p className="text-sm text-secondary-600">{client.email || 'Sin email'} - {client.telefono}</p>
                    <p className="text-xs text-secondary-500">ID: {client.id_cliente.substring(0,8)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                     <span className="text-sm text-secondary-500 mr-2">{clientPets.length} mascota(s)</span>
                    <ChevronDown className={`h-6 w-6 text-secondary-500 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>

              <div style={isExpanded ? animationStyle : {...animationStyle, ...collapsedStyle}}>
                <div className="border-t border-secondary-200 p-4 sm:p-5 bg-secondary-50 space-y-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleOpenClientModal(client);}} leftIcon={<Edit3 />}>Editar Cliente</Button>
                      <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id_cliente);}} leftIcon={<Trash2 />}>Eliminar Cliente</Button>
                      <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); handleOpenPetModal(client.id_cliente);}} leftIcon={<PawPrint />}>Agregar Mascota</Button>
                  </div>
                  
                  <h3 className="text-md font-semibold text-secondary-700">Mascotas de {client.nombre}:</h3>
                  {clientPets.length > 0 ? (
                    <ul className="space-y-3">
                      {clientPets.map(pet => {
                        const breed = breeds.find(b => b.id_raza === pet.raza_id);
                        const petHistoryCount = getMedicalHistoryByPetId(pet.id_mascota).length;
                        return (
                          <li key={pet.id_mascota} className="p-3 bg-white rounded-md shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                              <p className="font-medium text-primary-600">{pet.nombre} <span className="text-xs text-secondary-500">({pet.especie} - {breed?.nombre || 'Raza Desconocida'})</span></p>
                              <p className="text-sm text-secondary-500">Nac: {new Date(pet.fecha_nacimiento).toLocaleDateString()} - Sexo: {pet.sexo}</p>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2 mt-2 sm:mt-0 flex-wrap">
                                <Link to={`/pets/${pet.id_mascota}/history`} title="Ver Historial Médico">
                                    <Button size="sm" variant="ghost" className="p-1.5 text-blue-600 hover:bg-blue-50">
                                      <FileText className="h-5 w-5"/>
                                      <span className="ml-1 text-xs">({petHistoryCount})</span>
                                    </Button>
                                </Link>
                                <Button size="sm" variant="ghost" className="p-1.5 text-accent-600 hover:bg-accent-50" onClick={(e) => { e.stopPropagation(); handleOpenPetModal(client.id_cliente, pet); }} title="Editar Mascota">
                                  <Edit3 className="h-5 w-5"/>
                                </Button>
                                <Link to={`/appointments?action=new&clientId=${client.id_cliente}&petId=${pet.id_mascota}`} title="Nuevo Turno">
                                  <Button size="sm" variant="ghost" className="p-1.5 text-success-600 hover:bg-success-50">
                                      <CalendarDays className="h-5 w-5"/>
                                  </Button>
                                </Link>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-secondary-500">Este cliente aún no tiene mascotas registradas.</p>
                  )}
                </div>
              </div>
            </div>
          )
        }) : (
          <div className="text-center py-10 bg-white rounded-lg shadow">
            <Users className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-secondary-900">No hay clientes</h3>
            <p className="mt-1 text-sm text-secondary-500">Comience por agregar un nuevo cliente.</p>
            {searchTerm && <p className="mt-1 text-sm text-secondary-500">Intente con otros términos de búsqueda.</p>}
          </div>
        )}
      </div>
    </div>
  );
};