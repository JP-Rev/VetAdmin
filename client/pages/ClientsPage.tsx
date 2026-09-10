import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Cliente, Mascota, ClienteForm, MascotaForm, Especie, SexoMascota } from '../types';
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { PawPrint, Users, ChevronDown, ChevronRight, FileText, MapPin, Phone, Mail } from 'lucide-react';
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
      ? {
          nombre: initialData.nombre,
          telefono: initialData.telefono,
          telefono_alt: initialData.telefono_alt,
          email: initialData.email,
          calle: initialData.calle,
          numero: initialData.numero,
          localidad: initialData.localidad,
        }
      : { nombre: '', telefono: '', telefono_alt: '', email: '', calle: '', numero: '', localidad: '' }
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
    const telOk = (t: string) => /^\+?[0-9\s\-()]{7,20}$/.test(t);
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio.';
    else if (!telOk(formData.telefono)) newErrors.telefono = 'Teléfono inválido.';
    // El segundo telefono es opcional, pero si se carga tiene que ser valido.
    if (formData.telefono_alt.trim() && !telOk(formData.telefono_alt)) {
      newErrors.telefono_alt = 'Teléfono inválido.';
    }
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

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Teléfono" name="telefono" type="tel" value={formData.telefono} onChange={handleChange} error={errors.telefono} required className="mb-0" />
        <FormField label="Teléfono alternativo" name="telefono_alt" type="tel" value={formData.telefono_alt} onChange={handleChange} error={errors.telefono_alt} placeholder="Opcional" className="mb-0" />
      </div>

      <FormField label="Email (Opcional)" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} />

      <fieldset className="border border-secondary-200 rounded-xl px-4 pt-3 pb-4">
        <legend className="px-1.5 text-[12.5px] font-semibold text-secondary-600">Domicilio (opcional)</legend>
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <FormField label="Calle" name="calle" value={formData.calle} onChange={handleChange} className="mb-0" />
          <FormField label="Número" name="numero" value={formData.numero} onChange={handleChange} className="mb-0" />
        </div>
        <FormField label="Localidad" name="localidad" value={formData.localidad} onChange={handleChange} className="mb-0 mt-4" />
      </fieldset>
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
    peso: '',
  };

  const [formData, setFormData] = useState<MascotaForm>(
    initialData
      ? {
          nombre: initialData.nombre,
          especie: initialData.especie,
          raza_id: initialData.raza_id,
          id_cliente: initialData.id_cliente,
          fecha_nacimiento: initialData.fecha_nacimiento,
          sexo: initialData.sexo,
          peso: '', // se carga como un pesaje nuevo, no se edita el anterior
        }
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
    // El peso es opcional, pero si se carga tiene que ser un numero positivo.
    if (formData.peso.trim()) {
      const n = Number(formData.peso.replace(',', '.'));
      if (!Number.isFinite(n) || n <= 0) newErrors.peso = 'Ingresá un peso válido en kg.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const payload = { ...formData, peso: formData.peso.trim().replace(',', '.') };
       if (initialData) {
        updatePet(initialData.id_mascota, payload);
        // `peso` no es un campo de la mascota: el contexto lo registra como pesaje.
        const { peso: _peso, ...datosMascota } = formData;
        onSave({ ...initialData, ...datosMascota, lastModified: Date.now() });
      } else {
        const newPet = addPet(payload); // formData already includes id_cliente
        onSave(newPet);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nombre Mascota" name="nombre" value={formData.nombre} onChange={handleChange} error={errors.nombre} required />
      <FormField label="Especie" name="especie" as="select" value={formData.especie} onChange={handleChange} error={errors.especie as string} required options={ESPECIES.map(e => ({ value: e, label: e }))} />
      <FormField label="Raza" name="raza_id" as="select" value={formData.raza_id} onChange={handleChange} error={errors.raza_id} required options={availableBreeds.map(r => ({ value: r.id_raza, label: r.nombre }))} placeholder="Seleccione una raza" />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Fecha de Nacimiento" name="fecha_nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleChange} error={errors.fecha_nacimiento} required className="mb-0" />
        <FormField label="Peso (kg)" name="peso" type="number" step="0.01" value={formData.peso} onChange={handleChange} error={errors.peso} placeholder="Opcional" className="mb-0" />
      </div>
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
  const {
    clients, getPetsByClientId, deleteClient, breeds, getMedicalHistoryByPetId, getClientById,
    getPesoActual,
  } = useSupabaseData();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | undefined>(undefined);
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

  // Desde acá sólo se dan de alta mascotas: editarlas es una acción de su ficha.
  const handleOpenPetModal = (clientId: string) => {
    setSelectedClientIdForPet(clientId);
    setIsPetModalOpen(true);
  };

  const handleClosePetModal = () => {
    setIsPetModalOpen(false);
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

  const filteredClients = clients.filter(client => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      client.nombre.toLowerCase().includes(q) ||
      (client.email && client.email.toLowerCase().includes(q)) ||
      client.telefono.includes(searchTerm) ||
      (client.telefono_alt && client.telefono_alt.includes(searchTerm)) ||
      (client.localidad && client.localidad.toLowerCase().includes(q)) ||
      (client.calle && client.calle.toLowerCase().includes(q))
    );
  }).sort((a,b) => a.nombre.localeCompare(b.nombre));

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
                <Th hide>Teléfono</Th>
                <Th hide>Email</Th>
                <Th hide>Mascotas</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => {
                const clientPets = getPetsByClientId(client.id_cliente);
                const isExpanded = expandedClientId === client.id_cliente;
                // Si el cliente todavia no tiene los campos separados, se cae
                // al texto libre anterior para no dejar de mostrar el dato.
                const domicilio =
                  [[client.calle, client.numero].filter(Boolean).join(' '), client.localidad]
                    .filter(Boolean).join(', ');
                return (
                  <React.Fragment key={client.id_cliente}>
                    <Tr onClick={() => toggleExpandClient(client.id_cliente)}>
                      <Td>
                        <span className="flex items-start gap-2">
                          <ChevronDown
                            size={15}
                            className={`text-secondary-400 flex-shrink-0 mt-0.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                          <span className="min-w-0">
                            <span className="block font-semibold text-secondary-900">{client.nombre}</span>
                            {/* Lo que en el celular no tiene columna propia viaja acá abajo.
                                Sin `truncate`: el nowrap agrandaría el ancho mínimo de la
                                columna y volvería a empujar las acciones fuera de pantalla. */}
                            <span className="sm:hidden block text-[11.5px] text-secondary-500">
                              {client.telefono || 'Sin teléfono'} · {clientPets.length}{' '}
                              {clientPets.length === 1 ? 'mascota' : 'mascotas'}
                            </span>
                          </span>
                        </span>
                      </Td>
                      <Td hide>
                        <span className="flex flex-col">
                          <span className="font-mono text-[12.5px]">{client.telefono || '—'}</span>
                          {client.telefono_alt && (
                            <span className="font-mono text-[11px] text-secondary-500" title="Teléfono alternativo">
                              {client.telefono_alt}
                            </span>
                          )}
                        </span>
                      </Td>
                      <Td hide className="text-secondary-600">{client.email || '—'}</Td>
                      <Td hide>
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
                        <td colSpan={5} className="px-3 sm:px-5 py-4 bg-secondary-50">
                          {/* Los datos de contacto que en el celular no entran como
                              columna se leen acá, sin desplazar la pantalla. */}
                          <ul className="sm:hidden flex flex-col gap-1.5 m-0 mb-3 p-0 list-none">
                            {client.telefono_alt && (
                              <li className="flex items-center gap-2 text-[12.5px] text-secondary-600">
                                <Phone size={14} className="text-secondary-500 flex-shrink-0" />
                                <span className="font-mono break-all">{client.telefono_alt}</span>
                                <span className="text-[11px] text-secondary-400">alt.</span>
                              </li>
                            )}
                            {client.email && (
                              <li className="flex items-center gap-2 text-[12.5px] text-secondary-600">
                                <Mail size={14} className="text-secondary-500 flex-shrink-0" />
                                <span className="break-all">{client.email}</span>
                              </li>
                            )}
                          </ul>
                          {domicilio && (
                            <p className="m-0 mb-3 flex items-start gap-2 text-[12.5px] text-secondary-600">
                              <MapPin size={14} className="text-secondary-500 flex-shrink-0 mt-0.5" />
                              <span className="min-w-0 break-words">{domicilio}</span>
                            </p>
                          )}
                          {clientPets.length > 0 ? (
                            <ul className="flex flex-col gap-2 m-0 p-0 list-none">
                              {clientPets.map(pet => {
                                const breed = breeds.find(b => b.id_raza === pet.raza_id);
                                const historyCount = getMedicalHistoryByPetId(pet.id_mascota).length;
                                const edad = getPetAge(pet.fecha_nacimiento);
                                const peso = getPesoActual(pet.id_mascota);
                                return (
                                  <li key={pet.id_mascota}>
                                    {/* La fila no despliega nada: lleva a la ficha de la mascota,
                                        que es donde viven el historial y todas las acciones. */}
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/pets/${pet.id_mascota}/history`)}
                                      title={`Abrir la ficha de ${pet.nombre}`}
                                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left bg-surface border
                                                 border-secondary-200 rounded-[10px] hover:bg-secondary-50
                                                 hover:border-secondary-300 transition-colors"
                                    >
                                      <span className="w-8 h-8 rounded-lg bg-secondary-100 text-secondary-600 flex items-center justify-center flex-shrink-0">
                                        <SpeciesIcon especie={pet.especie} size={16} />
                                      </span>
                                      <span className="flex-1 min-w-0 flex flex-col">
                                        <span className="text-[13px] font-semibold text-secondary-900 truncate">{pet.nombre}</span>
                                        {/* Sin `truncate`: dentro de una tabla el nowrap fija un ancho
                                            mínimo enorme y saca la fila de la pantalla del celular. */}
                                        <span className="text-[11.5px] text-secondary-500">
                                          {pet.especie} · {breed?.nombre || 'Raza desconocida'} · {pet.sexo}
                                          {edad && ` · ${edad.label}`}
                                          {peso && ` · ${peso.peso.toLocaleString('es-AR')} kg`}
                                        </span>
                                      </span>
                                      {historyCount > 0 && (
                                        <span
                                          title={`${historyCount} evento(s) en la historia clínica`}
                                          className="flex items-center gap-1 font-mono text-[10.5px] text-secondary-500 flex-shrink-0"
                                        >
                                          <FileText size={12} />{historyCount}
                                        </span>
                                      )}
                                      <ChevronRight size={15} className="text-secondary-400 flex-shrink-0" />
                                    </button>
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
        <Modal isOpen={isPetModalOpen} onClose={handleClosePetModal} title="Nueva Mascota">
          <PetFormComponent clientId={selectedClientIdForPet} onSave={handlePetSaved} onClose={handleClosePetModal} />
        </Modal>
      )}
    </div>
  );
};
