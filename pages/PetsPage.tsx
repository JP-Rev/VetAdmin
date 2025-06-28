import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Mascota } from '../types';
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { Edit3, FileText, PawPrint, Users } from 'lucide-react';
import { PetFormComponent } from './ClientsPage'; // Re-using PetFormComponent from ClientsPage


export const PetsPage: React.FC = () => {
  const { pets, getClientById, getBreedById, getMedicalHistoryByPetId } = useSupabaseData();
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Mascota | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleOpenPetModal = (pet: Mascota) => {
    setEditingPet(pet);
    setIsPetModalOpen(true);
  };

  const handleClosePetModal = () => {
    setIsPetModalOpen(false);
    setEditingPet(undefined);
  };

  const handlePetSaved = () => {
    handleClosePetModal();
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


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-secondary-800">Listado General de Mascotas</h1>
        {/* Button to add pet could be added here, but would require client selection logic first.
            For now, users are guided to add pets via the Client's page if no pets exist.
        */}
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

      {isPetModalOpen && editingPet && (
        <Modal isOpen={isPetModalOpen} onClose={handleClosePetModal} title={`Editar Mascota: ${editingPet.nombre}`}>
          <PetFormComponent 
            clientId={editingPet.id_cliente} // clientId is from the pet being edited
            initialData={editingPet} 
            onSave={handlePetSaved} 
            onClose={handleClosePetModal} 
          />
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
            <Users className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-secondary-900">Comience agregando mascotas</h3>
            <p className="mt-1 text-sm text-secondary-500">
                Para agregar una nueva mascota, primero asegúrese de tener un cliente. Diríjase a la sección de {' '}
                <Link to="/clients" className="text-primary-600 hover:underline font-semibold">Clientes</Link>,
                seleccione o cree un cliente, y luego utilice la opción "Agregar Mascota\" dentro de los detalles del cliente.
            </p>
          </div>
       )}
    </div>
  );
};