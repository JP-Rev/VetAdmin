import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Mascota } from '../types';
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { Edit3, FileText, PawPrint, Users, Plus, Search, ShoppingCart } from 'lucide-react';
import { PetFormComponent } from './ClientsPage'; // Re-using PetFormComponent from ClientsPage


export const PetsPage: React.FC = () => {
  const { pets, clients, getClientById, getBreedById, getMedicalHistoryByPetId } = useSupabaseData();
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-secondary-800">Listado General de Mascotas</h1>
        <Button onClick={() => handleOpenPetModal()} leftIcon={<Plus />}>
          Nueva Mascota
        </Button>
      </div>

      <div className="bg-white p-4 shadow rounded-lg">
        <FormField
          label=""
          name="searchPets"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar mascotas por nombre, especie, raza o propietario..."
          inputClassName="text-sm"
          className="mb-0"
        />
      </div>

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

      <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Nombre Mascota</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Especie</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Raza</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Propietario</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {filteredPets.length > 0 ? filteredPets.map(pet => {
              const petHistoryCount = getMedicalHistoryByPetId(pet.id_mascota).length;
              return (
                <tr key={pet.id_mascota} className="hover:bg-secondary-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-primary-700">{pet.nombre}</div>
                    <div className="text-xs text-secondary-500">ID: {pet.id_mascota.substring(0,8)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700">{pet.especie}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700">{pet.breedName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700">
                    {pet.ownerId ? (
                       <Link to={`/clients/${pet.ownerId}`} className="hover:underline text-primary-600">
                         {pet.ownerName}
                       </Link>
                    ) : (
                        <span>{pet.ownerName}</span>
                    )}                   
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleOpenPetModal(pet)} 
                        title="Editar Mascota" 
                        className="text-accent-600 hover:bg-accent-50 p-1.5"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Link to={`/pets/${pet.id_mascota}/history`} title="Ver Historial Médico">
                        <Button size="sm" variant="ghost" className="p-1.5 text-blue-600 hover:bg-blue-50">
                          <FileText className="h-4 w-4"/>
                           <span className="ml-1 text-xs">({petHistoryCount})</span>
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleCreateSaleForPet(pet)} 
                        title="Crear Venta para esta Mascota" 
                        className="text-success-600 hover:bg-success-50 p-1.5"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-secondary-500">
                  <PawPrint className="mx-auto h-10 w-10 text-secondary-400 mb-2" />
                  {searchTerm ? "No hay mascotas que coincidan con la búsqueda." : "No hay mascotas registradas."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
       {filteredPets.length === 0 && !searchTerm && pets.length === 0 && (
         <div className="text-center py-10 bg-white rounded-lg shadow mt-4">
            <PawPrint className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-secondary-900">¡Agregue su primera mascota!</h3>
            <p className="mt-1 text-sm text-secondary-500">
                Use el botón "Nueva Mascota" para comenzar a registrar mascotas en el sistema.
            </p>
          </div>
       )}
    </div>
  );
};