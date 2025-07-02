import React, { useState, useMemo } from 'react';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Raza, RazaForm, Enfermedad, EnfermedadForm, Cirugia, CirugiaForm, Especie, CategoriaProducto, CategoriaProductoForm } from '../types';
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { Plus, Edit3, Trash2, Settings as IconSettings, PawPrint, Bug, Activity, Package } from 'lucide-react';
import { ESPECIES } from '../constants';

// Breed Form
interface BreedFormProps {
  initialData?: Raza;
  onSave: (breed: Raza) => void;
  onClose: () => void;
}
const BreedFormComponent: React.FC<BreedFormProps> = ({ initialData, onSave, onClose }) => {
  const { addBreed, updateBreed } = useSupabaseData();
  const [formData, setFormData] = useState<RazaForm>(
    initialData 
    ? { nombre: initialData.nombre, especie: initialData.especie }
    : { nombre: '', especie: Especie.PERRO }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof RazaForm, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as Especie }));
    if (errors[name as keyof RazaForm]) setErrors(prev => ({...prev, [name]: undefined}));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof RazaForm, string>> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    if (!formData.especie) newErrors.especie = 'La especie es obligatoria.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      if (initialData) {
        updateBreed(initialData.id_raza, formData);
        onSave({ ...initialData, ...formData });
      } else {
        const newBreed = addBreed(formData);
        onSave(newBreed);
      }
    }
  };

  const especieOptions = ESPECIES.map(e => ({ value: e, label: e }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nombre de la Raza" name="nombre" value={formData.nombre} onChange={handleChange} error={errors.nombre} required />
      <FormField 
        label="Especie" 
        name="especie" 
        as="searchable-select" 
        value={formData.especie} 
        onChange={handleChange} 
        error={errors.especie} 
        required 
        options={especieOptions} 
        placeholder="Seleccionar especie..."
      />
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit">{initialData ? 'Guardar Cambios' : 'Crear Raza'}</Button>
      </div>
    </form>
  );
};

// Disease Form
interface DiseaseFormProps {
  initialData?: Enfermedad;
  onSave: (disease: Enfermedad) => void;
  onClose: () => void;
}
const DiseaseFormComponent: React.FC<DiseaseFormProps> = ({ initialData, onSave, onClose }) => {
  const { addDisease, updateDisease } = useSupabaseData();
  const [formData, setFormData] = useState<EnfermedadForm>(
    initialData
    ? { nombre: initialData.nombre, descripcion: initialData.descripcion, especie_afectada: initialData.especie_afectada }
    : { nombre: '', descripcion: '', especie_afectada: undefined }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof EnfermedadForm, string>>>({});

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === "" && name === "especie_afectada" ? undefined : value as Especie }));
    if (errors[name as keyof EnfermedadForm]) setErrors(prev => ({...prev, [name]: undefined}));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof EnfermedadForm, string>> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es obligatoria.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      if (initialData) {
        updateDisease(initialData.id_enfermedad, formData);
        onSave({ ...initialData, ...formData });
      } else {
        const newDisease = addDisease(formData);
        onSave(newDisease);
      }
    }
  };
  
  const especieOptions = [{ value: "", label: "No específica / Todas" }, ...ESPECIES.map(e => ({ value: e, label: e }))];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nombre de la Enfermedad" name="nombre" value={formData.nombre} onChange={handleChange} error={errors.nombre} required />
      <FormField label="Descripción" name="descripcion" as="textarea" value={formData.descripcion} onChange={handleChange} error={errors.descripcion} required rows={3}/>
      <FormField 
        label="Especie Principalmente Afectada (Opcional)" 
        name="especie_afectada" 
        as="searchable-select" 
        value={formData.especie_afectada || ''} 
        onChange={handleChange} 
        options={especieOptions} 
        error={errors.especie_afectada} 
        placeholder="Seleccionar especie afectada..."
      />
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit">{initialData ? 'Guardar Cambios' : 'Crear Enfermedad'}</Button>
      </div>
    </form>
  );
};

// Surgery Form
interface SurgeryFormProps {
  initialData?: Cirugia;
  onSave: (surgery: Cirugia) => void;
  onClose: () => void;
}
const SurgeryFormComponent: React.FC<SurgeryFormProps> = ({ initialData, onSave, onClose }) => {
  const { addSurgery, updateSurgery } = useSupabaseData();
  const [formData, setFormData] = useState<CirugiaForm>(
    initialData
    ? { tipo: initialData.tipo, descripcion: initialData.descripcion, duracion_estimada_min: initialData.duracion_estimada_min, costo_estimado: initialData.costo_estimado }
    : { tipo: '', descripcion: '', duracion_estimada_min: 30, costo_estimado: 50 }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof CirugiaForm, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
     if (errors[name as keyof CirugiaForm]) setErrors(prev => ({...prev, [name]: undefined}));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof CirugiaForm, string>> = {};
    if (!formData.tipo.trim()) newErrors.tipo = 'El tipo/nombre de cirugía es obligatorio.';
    if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es obligatoria.';
    if (isNaN(formData.duracion_estimada_min) || formData.duracion_estimada_min <= 0) newErrors.duracion_estimada_min = 'La duración debe ser un número positivo.';
    if (isNaN(formData.costo_estimado) || formData.costo_estimado < 0) newErrors.costo_estimado = 'El costo debe ser un número no negativo.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const processedFormData = {
        ...formData,
        duracion_estimada_min: Number(formData.duracion_estimada_min),
        costo_estimado: Number(formData.costo_estimado)
      };
      if (initialData) {
        updateSurgery(initialData.id_cirugia, processedFormData);
        onSave({ ...initialData, ...processedFormData });
      } else {
        const newSurgery = addSurgery(processedFormData);
        onSave(newSurgery);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Tipo/Nombre de Cirugía" name="tipo" value={formData.tipo} onChange={handleChange} error={errors.tipo} required />
      <FormField label="Descripción" name="descripcion" as="textarea" value={formData.descripcion} onChange={handleChange} error={errors.descripcion} required rows={3}/>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Duración Estimada (min)" name="duracion_estimada_min" type="number" value={String(formData.duracion_estimada_min)} onChange={handleChange} error={errors.duracion_estimada_min} required />
        <FormField label="Costo Estimado ($)" name="costo_estimado" type="number" value={String(formData.costo_estimado)} onChange={handleChange} error={errors.costo_estimado} required step="0.01" />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit">{initialData ? 'Guardar Cambios' : 'Crear Tipo de Cirugía'}</Button>
      </div>
    </form>
  );
};

// Product Category Form
interface ProductCategoryFormProps {
  initialData?: CategoriaProducto;
  onSave: (category: CategoriaProducto) => void;
  onClose: () => void;
}
const ProductCategoryFormComponent: React.FC<ProductCategoryFormProps> = ({ initialData, onSave, onClose }) => {
  const { addProductCategory, updateProductCategory } = useSupabaseData();
  const [formData, setFormData] = useState<CategoriaProductoForm>(
    initialData
    ? { nombre: initialData.nombre, descripcion: initialData.descripcion, activa: initialData.activa }
    : { nombre: '', descripcion: '', activa: true }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof CategoriaProductoForm, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
    if (errors[name as keyof CategoriaProductoForm]) setErrors(prev => ({...prev, [name]: undefined}));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof CategoriaProductoForm, string>> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      if (initialData) {
        updateProductCategory(initialData.id_categoria, formData);
        onSave({ ...initialData, ...formData });
      } else {
        const newCategory = addProductCategory(formData);
        onSave(newCategory);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nombre de la Categoría" name="nombre" value={formData.nombre} onChange={handleChange} error={errors.nombre} required />
      <FormField label="Descripción (Opcional)" name="descripcion" as="textarea" value={formData.descripcion} onChange={handleChange} rows={2}/>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="activa"
          name="activa"
          checked={formData.activa}
          onChange={handleChange}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
        />
        <label htmlFor="activa" className="text-sm font-medium text-secondary-700">
          Categoría activa (disponible para nuevos productos)
        </label>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit">{initialData ? 'Guardar Cambios' : 'Crear Categoría'}</Button>
      </div>
    </form>
  );
};

export const SettingsPage: React.FC = () => {
  const { breeds, deleteBreed, diseases, deleteDisease, surgeries, deleteSurgery, productCategories, deleteProductCategory } = useSupabaseData();
  const [activeTab, setActiveTab] = useState<'breeds' | 'diseases' | 'surgeries' | 'productCategories'>('breeds');
  
  const [isBreedModalOpen, setIsBreedModalOpen] = useState(false);
  const [editingBreed, setEditingBreed] = useState<Raza | undefined>(undefined);

  const [isDiseaseModalOpen, setIsDiseaseModalOpen] = useState(false);
  const [editingDisease, setEditingDisease] = useState<Enfermedad | undefined>(undefined);
  
  const [isSurgeryModalOpen, setIsSurgeryModalOpen] = useState(false);
  const [editingSurgery, setEditingSurgery] = useState<Cirugia | undefined>(undefined);

  const [isProductCategoryModalOpen, setIsProductCategoryModalOpen] = useState(false);
  const [editingProductCategory, setEditingProductCategory] = useState<CategoriaProducto | undefined>(undefined);

  const sortedBreeds = useMemo(() => [...breeds].sort((a, b) => a.nombre.localeCompare(b.nombre)), [breeds]);
  const sortedDiseases = useMemo(() => [...diseases].sort((a, b) => a.nombre.localeCompare(b.nombre)), [diseases]);
  const sortedSurgeries = useMemo(() => [...surgeries].sort((a, b) => a.tipo.localeCompare(b.tipo)), [surgeries]);
  const sortedProductCategories = useMemo(() => [...productCategories].sort((a, b) => a.nombre.localeCompare(b.nombre)), [productCategories]);

  // Breed Modal Handlers
  const handleOpenBreedModal = (breed?: Raza) => { setEditingBreed(breed); setIsBreedModalOpen(true); };
  const handleCloseBreedModal = () => { setEditingBreed(undefined); setIsBreedModalOpen(false); };
  const handleBreedSaved = () => handleCloseBreedModal();
  const handleDeleteBreed = (id: string) => { if (window.confirm('¿Seguro que desea eliminar esta raza?')) deleteBreed(id); };

  // Disease Modal Handlers
  const handleOpenDiseaseModal = (disease?: Enfermedad) => { setEditingDisease(disease); setIsDiseaseModalOpen(true); };
  const handleCloseDiseaseModal = () => { setEditingDisease(undefined); setIsDiseaseModalOpen(false); };
  const handleDiseaseSaved = () => handleCloseDiseaseModal();
  const handleDeleteDisease = (id: string) => { if (window.confirm('¿Seguro que desea eliminar esta enfermedad?')) deleteDisease(id); };

  // Surgery Modal Handlers
  const handleOpenSurgeryModal = (surgery?: Cirugia) => { setEditingSurgery(surgery); setIsSurgeryModalOpen(true); };
  const handleCloseSurgeryModal = () => { setEditingSurgery(undefined); setIsSurgeryModalOpen(false); };
  const handleSurgerySaved = () => handleCloseSurgeryModal();
  const handleDeleteSurgery = (id: string) => { if (window.confirm('¿Seguro que desea eliminar este tipo de cirugía?')) deleteSurgery(id); };

  // Product Category Modal Handlers
  const handleOpenProductCategoryModal = (category?: CategoriaProducto) => { setEditingProductCategory(category); setIsProductCategoryModalOpen(true); };
  const handleCloseProductCategoryModal = () => { setEditingProductCategory(undefined); setIsProductCategoryModalOpen(false); };
  const handleProductCategorySaved = () => handleCloseProductCategoryModal();
  const handleDeleteProductCategory = (id: string) => { if (window.confirm('¿Seguro que desea eliminar esta categoría? Los productos que la usen mantendrán el nombre pero perderán la referencia.')) deleteProductCategory(id); };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'breeds':
        return (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-secondary-700">Gestión de Razas</h2>
              <Button onClick={() => handleOpenBreedModal()} leftIcon={<Plus />}>Nueva Raza</Button>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Especie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {sortedBreeds.map(breed => (
                    <tr key={breed.id_raza} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-800">{breed.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{breed.especie}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleOpenBreedModal(breed)} className="text-accent-600 p-1.5"><Edit3 size={16}/></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteBreed(breed.id_raza)} className="text-error-600 p-1.5"><Trash2 size={16}/></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedBreeds.length === 0 && <p className="p-4 text-center text-secondary-500">No hay razas configuradas.</p>}
            </div>
          </section>
        );
      case 'diseases':
        return (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-secondary-700">Gestión de Enfermedades</h2>
              <Button onClick={() => handleOpenDiseaseModal()} leftIcon={<Plus />}>Nueva Enfermedad</Button>
            </div>
             <div className="bg-white shadow-md rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Especie Afectada</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {sortedDiseases.map(disease => (
                    <tr key={disease.id_enfermedad} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-800">{disease.nombre}</td>
                      <td className="px-6 py-4 text-sm text-secondary-600 max-w-md truncate" title={disease.descripcion}>{disease.descripcion}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{disease.especie_afectada || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleOpenDiseaseModal(disease)} className="text-accent-600 p-1.5"><Edit3 size={16}/></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteDisease(disease.id_enfermedad)} className="text-error-600 p-1.5"><Trash2 size={16}/></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedDiseases.length === 0 && <p className="p-4 text-center text-secondary-500">No hay enfermedades configuradas.</p>}
            </div>
          </section>
        );
      case 'surgeries':
        return (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-secondary-700">Gestión de Tipos de Cirugía</h2>
              <Button onClick={() => handleOpenSurgeryModal()} leftIcon={<Plus />}>Nuevo Tipo Cirugía</Button>
            </div>
             <div className="bg-white shadow-md rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Tipo/Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Duración (min)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Costo Est. ($)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {sortedSurgeries.map(surgery => (
                    <tr key={surgery.id_cirugia} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-800">{surgery.tipo}</td>
                      <td className="px-6 py-4 text-sm text-secondary-600 max-w-sm truncate" title={surgery.descripcion}>{surgery.descripcion}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{surgery.duracion_estimada_min}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{surgery.costo_estimado.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleOpenSurgeryModal(surgery)} className="text-accent-600 p-1.5"><Edit3 size={16}/></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteSurgery(surgery.id_cirugia)} className="text-error-600 p-1.5"><Trash2 size={16}/></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedSurgeries.length === 0 && <p className="p-4 text-center text-secondary-500">No hay tipos de cirugía configurados.</p>}
            </div>
          </section>
        );
      case 'productCategories':
        return (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-secondary-700">Gestión de Categorías de Productos</h2>
              <Button onClick={() => handleOpenProductCategoryModal()} leftIcon={<Plus />}>Nueva Categoría</Button>
            </div>
             <div className="bg-white shadow-md rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {sortedProductCategories.map(category => (
                    <tr key={category.id_categoria} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-800 font-medium">{category.nombre}</td>
                      <td className="px-6 py-4 text-sm text-secondary-600 max-w-md truncate" title={category.descripcion}>{category.descripcion || 'Sin descripción'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${category.activa ? 'bg-success-100 text-success-800' : 'bg-secondary-100 text-secondary-800'}`}>
                          {category.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleOpenProductCategoryModal(category)} className="text-accent-600 p-1.5"><Edit3 size={16}/></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteProductCategory(category.id_categoria)} className="text-error-600 p-1.5"><Trash2 size={16}/></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedProductCategories.length === 0 && <p className="p-4 text-center text-secondary-500">No hay categorías de productos configuradas.</p>}
            </div>
          </section>
        );
      default: return null;
    }
  };

  const tabs = [
    { key: 'breeds', label: 'Razas', icon: <PawPrint size={18} /> },
    { key: 'diseases', label: 'Enfermedades', icon: <Bug size={18} /> },
    { key: 'surgeries', label: 'Tipos de Cirugía', icon: <Activity size={18} /> },
    { key: 'productCategories', label: 'Categorías de Productos', icon: <Package size={18} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <IconSettings className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-secondary-800">Configuración del Sistema</h1>
      </div>

      <div className="flex border-b border-secondary-300 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'breeds' | 'diseases' | 'surgeries' | 'productCategories')}
            className={`flex items-center space-x-2 px-4 py-3 -mb-px text-sm font-medium focus:outline-none transition-colors duration-150 whitespace-nowrap
              ${activeTab === tab.key 
                ? 'border-b-2 border-primary-600 text-primary-600' 
                : 'border-b-2 border-transparent text-secondary-500 hover:text-primary-500 hover:border-primary-300'}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {renderTabContent()}

      {isBreedModalOpen && <Modal isOpen={isBreedModalOpen} onClose={handleCloseBreedModal} title={editingBreed ? 'Editar Raza' : 'Nueva Raza'}><BreedFormComponent initialData={editingBreed} onSave={handleBreedSaved} onClose={handleCloseBreedModal} /></Modal>}
      {isDiseaseModalOpen && <Modal isOpen={isDiseaseModalOpen} onClose={handleCloseDiseaseModal} title={editingDisease ? 'Editar Enfermedad' : 'Nueva Enfermedad'}><DiseaseFormComponent initialData={editingDisease} onSave={handleDiseaseSaved} onClose={handleCloseDiseaseModal} /></Modal>}
      {isSurgeryModalOpen && <Modal isOpen={isSurgeryModalOpen} onClose={handleCloseSurgeryModal} title={editingSurgery ? 'Editar Tipo de Cirugía' : 'Nuevo Tipo de Cirugía'}><SurgeryFormComponent initialData={editingSurgery} onSave={handleSurgerySaved} onClose={handleCloseSurgeryModal} /></Modal>}
      {isProductCategoryModalOpen && <Modal isOpen={isProductCategoryModalOpen} onClose={handleCloseProductCategoryModal} title={editingProductCategory ? 'Editar Categoría de Producto' : 'Nueva Categoría de Producto'}><ProductCategoryFormComponent initialData={editingProductCategory} onSave={handleProductCategorySaved} onClose={handleCloseProductCategoryModal} /></Modal>}
    </div>
  );
};