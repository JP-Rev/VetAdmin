import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Mascota } from '../types';
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FileText, PawPrint, Users, Plus, Search, ShoppingCart } from 'lucide-react';
import { SpeciesIcon } from '../lib/speciesIcon';
import { getPetAge } from '../lib/petAge';
import {
  FilterCard, DataCard, TableWrap, Th, Td, Tr, RowActions, IconAction, EditIcon, EmptyState,
} from '../components/common/ListLayout';
import { PetFormComponent } from './ClientsPage'; // Re-using PetFormComponent from ClientsPage


export const PetsPage: React.FC = () => {
  const { pets, clients, getClientById, getBreedById, getMedicalHistoryByPetId, getPesoActual } = useSupabaseData();
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Mascota | undefined>(undefined);
  const [selectedClientIdForNewPet, setSelectedClientIdForNewPet] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleOpenPetModal = (pet?: Mascota) => {
    if (pet) {
      // Editing existing pet
      setEditingPet(pet);
      setSelectedClientIdForNewPet('');
    } else {
      // Creating new pet
      setEditingPet(undefined);
      setSelectedClientIdForNewPet('');
      setClientSearchTerm(''); // Reset client search when opening modal
    }
    setIsPetModalOpen(true);
  };

  const handleClosePetModal = () => {
    setIsPetModalOpen(false);
    setEditingPet(undefined);
    setSelectedClientIdForNewPet('');
    setClientSearchTerm('');
  };

  const handlePetSaved = () => {
    handleClosePetModal();
  };

  const handleCreateSaleForPet = (pet: Mascota) => {
    // Navigate to sales page with pre-filled client and pet
    navigate(`/ventas?action=new&clientId=${pet.id_cliente}&petId=${pet.id_mascota}`);
  };

  const enrichedPets = useMemo(() => {
    return pets.map(pet => {
      const owner = getClientById(pet.id_cliente);
      const breed = getBreedById(pet.raza_id);
      return {
        ...pet,
        ownerName: owner?.nombre || 'Desconocido',
        ownerId: owner?.id_cliente,
        breedName: breed?.nombre || 'Desconocida',
      };
    });
  }, [pets, getClientById, getBreedById]);

  const filteredPets = useMemo(() => {
    return enrichedPets.filter(pet =>
      pet.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.especie.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => a.nombre.localeCompare(b.nombre));
  }, [enrichedPets, searchTerm]);

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.nombre.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.telefono.includes(clientSearchTerm) ||
      (client.email && client.email.toLowerCase().includes(clientSearchTerm.toLowerCase()))
    ).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [clients, clientSearchTerm]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.6px] text-secondary-900">Mascotas</h1>
        <p className="mt-1 mb-0 text-sm text-secondary-600">Fichas de todas las mascotas registradas.</p>
      </div>

      <FilterCard
        title="Filtros de mascotas"
        subtitle="Buscar por nombre, especie, raza o propietario"
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar mascota…"
      />

      {isPetModalOpen && (
        <Modal 
          isOpen={isPetModalOpen} 
          onClose={handleClosePetModal} 
          title={editingPet ? `Editar Mascota: ${editingPet.nombre}` : 'Nueva Mascota'}
          size="lg"
        >
          {editingPet ? (
            // Editing existing pet - use existing client ID
            <PetFormComponent 
              clientId={editingPet.id_cliente}
              initialData={editingPet} 
              onSave={handlePetSaved} 
              onClose={handleClosePetModal} 
            />
          ) : (
            // Creating new pet - need to select client first
            <div className="space-y-4">
              {!selectedClientIdForNewPet ? (
                // Step 1: Select client with search filter
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-secondary-800">Seleccionar Propietario</h3>
                  <p className="text-sm text-secondary-600">Busque y seleccione el cliente propietario de la nueva mascota:</p>
                  
                  {/* Search input for clients */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar cliente por nombre, teléfono o email..."
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  {clients.length > 0 ? (
                    <>
                      {filteredClients.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto border border-secondary-200 rounded-md">
                          {filteredClients.map(client => (
                            <div 
                              key={client.id_cliente}
                              className="p-3 hover:bg-primary-50 cursor-pointer border-b border-secondary-100 last:border-b-0 transition-colors"
                              onClick={() => setSelectedClientIdForNewPet(client.id_cliente)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-secondary-800">{client.nombre}</p>
                                  <p className="text-sm text-secondary-500">{client.telefono}</p>
                                  {client.email && <p className="text-xs text-secondary-400">{client.email}</p>}
                                </div>
                                <Button size="sm" variant="ghost" className="text-primary-600">
                                  Seleccionar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border border-secondary-200 rounded-md bg-secondary-50">
                          <Search className="mx-auto h-8 w-8 text-secondary-400 mb-2" />
                          <p className="text-secondary-600">No se encontraron clientes con "{clientSearchTerm}"</p>
                          <p className="text-sm text-secondary-500 mt-1">Intente con otros términos de búsqueda</p>
                        </div>
                      )}
                      
                      {clientSearchTerm && (
                        <div className="text-center pt-2">
                          <Button 
                            onClick={() => navigate('/clients/new')} 
                            leftIcon={<Plus />}
                            variant="outline"
                            size="sm"
                          >
                            Crear Nuevo Cliente
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-secondary-400 mb-2" />
                      <p className="text-secondary-600 mb-4">No hay clientes registrados.</p>
                      <Button 
                        onClick={() => navigate('/clients/new')} 
                        leftIcon={<Plus />}
                        variant="primary"
                      >
                        Crear Primer Cliente
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex justify-end pt-4">
                    <Button type="button" variant="secondary" onClick={handleClosePetModal}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                // Step 2: Create pet for selected client
                <div className="space-y-4">
                  <div className="p-3 bg-primary-50 border border-primary-200 rounded-md">
                    <p className="text-sm text-primary-700">
                      <strong>Propietario seleccionado:</strong> {getClientById(selectedClientIdForNewPet)?.nombre}
                    </p>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setSelectedClientIdForNewPet('')}
                      className="text-primary-600 hover:text-primary-700 mt-1 p-0"
                    >
                      Cambiar propietario
                    </Button>
                  </div>
                  
                  <PetFormComponent 
                    clientId={selectedClientIdForNewPet}
                    onSave={handlePetSaved} 
                    onClose={handleClosePetModal} 
                  />
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      <DataCard
        title="Mascotas"
        count={filteredPets.length}
        filtered={searchTerm.trim().length > 0}
        actionLabel="Nueva"
        onAction={() => handleOpenPetModal()}
      >
        {filteredPets.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Mascota</Th>
                <Th>Especie</Th>
                <Th>Raza</Th>
                <Th>Edad</Th>
                <Th>Peso</Th>
                <Th>Propietario</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filteredPets.map(pet => {
                const historyCount = getMedicalHistoryByPetId(pet.id_mascota).length;
                const edad = getPetAge(pet.fecha_nacimiento);
                return (
                  <Tr key={pet.id_mascota}>
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-secondary-100 text-secondary-600 flex items-center justify-center flex-shrink-0">
                          <SpeciesIcon especie={pet.especie} size={16} />
                        </span>
                        <span className="font-semibold text-secondary-900">{pet.nombre}</span>
                      </span>
                    </Td>
                    <Td className="text-secondary-600">{pet.especie}</Td>
                    <Td className="text-secondary-600">{pet.breedName}</Td>
                    <Td>
                      {edad ? (
                        <span
                          className="font-mono text-[12.5px] text-secondary-700 whitespace-nowrap"
                          title={`Nacimiento: ${new Date(pet.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-AR')}`}
                        >
                          {edad.short}
                        </span>
                      ) : (
                        <span className="text-secondary-400">—</span>
                      )}
                    </Td>
                    <Td className="font-mono text-[12.5px] whitespace-nowrap">
                      {(() => {
                        const p = getPesoActual(pet.id_mascota);
                        return p ? `${p.peso.toLocaleString('es-AR')} kg` : <span className="text-secondary-400">—</span>;
                      })()}
                    </Td>
                    <Td>
                      {pet.ownerId ? (
                        <Link to={`/clients/${pet.ownerId}`} className="text-primary-700 hover:underline font-medium">
                          {pet.ownerName}
                        </Link>
                      ) : (
                        <span className="text-secondary-500">{pet.ownerName}</span>
                      )}
                    </Td>
                    <Td>
                      <RowActions>
                        <Link to={`/pets/${pet.id_mascota}/history`} title={`Historial médico (${historyCount})`}>
                          <span className="relative w-[34px] h-[34px] rounded-[9px] border border-secondary-200 text-secondary-600
                                           hover:bg-secondary-100 hover:text-secondary-900 flex items-center justify-center transition-colors">
                            <FileText size={15} />
                            {historyCount > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary-700 text-white
                                               font-mono text-[9px] font-bold flex items-center justify-center">
                                {historyCount}
                              </span>
                            )}
                          </span>
                        </Link>
                        <IconAction label="Crear venta para esta mascota" onClick={() => handleCreateSaleForPet(pet)}>
                          <ShoppingCart size={15} />
                        </IconAction>
                        <IconAction label="Editar mascota" onClick={() => handleOpenPetModal(pet)}>
                          <EditIcon />
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
            icon={<PawPrint size={24} />}
            title={searchTerm ? 'Sin resultados' : 'No hay mascotas'}
            hint={searchTerm ? 'Probá con otros términos de búsqueda.' : 'Agregá la primera mascota con el botón Nueva.'}
          />
        )}
      </DataCard>
    </div>
  );
};
