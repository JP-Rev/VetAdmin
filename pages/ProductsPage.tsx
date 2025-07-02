import React, { useState } from 'react';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Producto, ProductoForm } from '../types';
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { Plus, Edit3, Trash2, Package, AlertTriangle } from 'lucide-react';

// Product Form Component
interface ProductFormProps {
  initialData?: Producto;
  onSave: (product: Producto) => void;
  onClose: () => void;
}

const ProductFormComponent: React.FC<ProductFormProps> = ({ initialData, onSave, onClose }) => {
  const { addProduct, updateProduct, productCategories } = useSupabaseData();
  const [formData, setFormData] = useState<ProductoForm>(
    initialData
      ? { 
          nombre: initialData.nombre, 
          stock: initialData.stock, 
          precio: initialData.precio, 
          categoria: initialData.categoria,
          categoria_id: initialData.categoria_id || ''
        }
      : { nombre: '', stock: 0, precio: 0, categoria: '', categoria_id: '' }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ProductoForm, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const type = e.target.type;

    if (name === 'categoria_id') {
      const selectedCategory = productCategories.find(cat => cat.id_categoria === value);
      setFormData(prev => ({ 
        ...prev, 
        categoria_id: value,
        categoria: selectedCategory?.nombre || ''
      }));
    } else {
      setFormData(prev => ({ 
          ...prev, 
          [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value 
      }));
    }

    if (errors[name as keyof ProductoForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProductoForm, string>> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    if (isNaN(Number(formData.stock)) || Number(formData.stock) < 0) newErrors.stock = 'El stock debe ser un número no negativo.';
    if (isNaN(Number(formData.precio)) || Number(formData.precio) <= 0) newErrors.precio = 'El precio debe ser un número mayor a cero.';
    if (!formData.categoria_id) newErrors.categoria_id = 'La categoría es obligatoria.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
        const processedFormData = {
            ...formData,
            stock: Number(formData.stock),
            precio: Number(formData.precio)
        };
      if (initialData) {
        updateProduct(initialData.id_producto, processedFormData);
        onSave({ ...initialData, ...processedFormData, lastModified: Date.now() });
      } else {
        const newProduct = addProduct(processedFormData);
        onSave(newProduct);
      }
    }
  };

  const activeCategoriesOptions = productCategories
    .filter(cat => cat.activa)
    .map(cat => ({ value: cat.id_categoria, label: cat.nombre }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nombre del Producto" name="nombre" value={formData.nombre} onChange={handleChange} error={errors.nombre} required />
      <FormField 
        label="Categoría" 
        name="categoria_id" 
        as="searchable-select" 
        value={formData.categoria_id || ''} 
        onChange={handleChange} 
        error={errors.categoria_id} 
        required 
        options={activeCategoriesOptions}
        placeholder="Buscar y seleccionar categoría..."
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Stock Actual" name="stock" type="number" value={String(formData.stock)} onChange={handleChange} error={errors.stock} required />
        <FormField label="Precio Unitario ($)" name="precio" type="number" value={String(formData.precio)} onChange={handleChange} error={errors.precio} required step="0.01" />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary">{initialData ? 'Guardar Cambios' : 'Crear Producto'}</Button>
      </div>
    </form>
  );
};

// Main Products Page
export const ProductsPage: React.FC = () => {
  const { products, deleteProduct, productCategories, getProductCategoryById } = useSupabaseData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenModal = (product?: Producto) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };

  const handleSaveProduct = () => {
    handleCloseModal();
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este producto? No se podrá vender más pero podría afectar órdenes pasadas.')) {
      deleteProduct(id);
    }
  };
  
  const filteredProducts = products.filter(product => {
    const categoryName = product.categoria_id 
      ? getProductCategoryById(product.categoria_id)?.nombre || product.categoria
      : product.categoria;
    
    return product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
           categoryName.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a,b) => a.nombre.localeCompare(b.nombre));

  const lowStockThreshold = 5;
  const warningStockThreshold = 10;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-secondary-800">Gestión de Productos</h1>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus />}>
          Nuevo Producto
        </Button>
      </div>

       <div className="bg-white p-4 shadow rounded-lg">
        <FormField
            label=""
            name="searchProducts"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos por nombre o categoría..."
            inputClassName="text-sm"
            className="mb-0"
        />
      </div>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}>
          <ProductFormComponent initialData={editingProduct} onSave={handleSaveProduct} onClose={handleCloseModal} />
        </Modal>
      )}

      <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Nombre</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Categoría</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Stock</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Precio</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {filteredProducts.length > 0 ? filteredProducts.map(product => {
              let stockColorClass = 'text-success-700';
              if (product.stock <= lowStockThreshold) {
                stockColorClass = 'text-error-700 font-semibold';
              } else if (product.stock <= warningStockThreshold) {
                stockColorClass = 'text-warning-700 font-semibold';
              }

              const categoryName = product.categoria_id 
                ? getProductCategoryById(product.categoria_id)?.nombre || product.categoria
                : product.categoria;

              return (
              <tr key={product.id_producto} className="hover:bg-secondary-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{product.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{categoryName}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${stockColorClass}`}>
                    {product.stock} unidades
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">${product.precio.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => handleOpenModal(product)} title="Editar Producto" className="text-accent-600 hover:bg-accent-50 p-1.5">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteProduct(product.id_producto)} title="Eliminar Producto" className="text-error-600 hover:bg-error-50 p-1.5">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          }) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-secondary-500">
                    <Package className="mx-auto h-10 w-10 text-secondary-400 mb-2" />
                    No hay productos registrados o que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
       {filteredProducts.some(p => p.stock <= lowStockThreshold) && 
        <div className="mt-4 p-3 bg-error-50 border-l-4 border-error-400 text-error-700 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0"/>
            <p><span className="font-bold">Alerta de Stock Bajo:</span> Algunos productos tienen stock crítico (≤ {lowStockThreshold} unidades).</p>
        </div>
      }
       {filteredProducts.some(p => p.stock > lowStockThreshold && p.stock <= warningStockThreshold) && 
        !filteredProducts.some(p => p.stock <= lowStockThreshold) && 
        <div className="mt-4 p-3 bg-warning-50 border-l-4 border-warning-400 text-warning-700 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0"/>
            <p><span className="font-bold">Advertencia de Stock:</span> Algunos productos tienen stock moderado (entre {lowStockThreshold + 1} y {warningStockThreshold} unidades).</p>
        </div>
      }
    </div>
  );
};