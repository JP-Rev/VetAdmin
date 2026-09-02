import React, { useState } from 'react';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Producto, ProductoForm } from '../types';
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { Package, AlertTriangle } from 'lucide-react';
import {
  FilterCard, DataCard, TableWrap, Th, Td, Tr, RowActions, IconAction, EditIcon, DeleteIcon, EmptyState,
} from '../components/common/ListLayout';

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
  const { products, deleteProduct, getProductCategoryById } = useSupabaseData();
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
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.6px] text-secondary-900">Productos</h1>
        <p className="mt-1 mb-0 text-sm text-secondary-600">Inventario y precios.</p>
      </div>

      <FilterCard
        title="Filtros de productos"
        subtitle="Buscar por nombre o categoría"
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar producto…"
      />

      <DataCard
        title="Productos"
        count={filteredProducts.length}
        filtered={searchTerm.trim().length > 0}
        actionLabel="Nuevo"
        onAction={() => handleOpenModal()}
      >
        {filteredProducts.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Producto</Th>
                <Th>Categoría</Th>
                <Th>Stock</Th>
                <Th>Precio</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                let stockClass = 'text-success-700';
                if (product.stock <= lowStockThreshold) stockClass = 'text-error-600 font-semibold';
                else if (product.stock <= warningStockThreshold) stockClass = 'text-warning-700 font-semibold';

                const categoryName = product.categoria_id
                  ? getProductCategoryById(product.categoria_id)?.nombre || product.categoria
                  : product.categoria;

                return (
                  <Tr key={product.id_producto}>
                    <Td className="font-semibold text-secondary-900">{product.nombre}</Td>
                    <Td className="text-secondary-600">{categoryName || '—'}</Td>
                    <Td>
                      <span className={`inline-flex items-center gap-1.5 font-mono text-[12.5px] ${stockClass}`}>
                        {product.stock <= warningStockThreshold && <AlertTriangle size={13} />}
                        {product.stock} u.
                      </span>
                    </Td>
                    <Td className="font-mono text-[12.5px]">${product.precio.toFixed(2)}</Td>
                    <Td>
                      <RowActions>
                        <IconAction label="Editar producto" onClick={() => handleOpenModal(product)}>
                          <EditIcon />
                        </IconAction>
                        <IconAction label="Eliminar producto" variant="danger" onClick={() => handleDeleteProduct(product.id_producto)}>
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
            icon={<Package size={24} />}
            title={searchTerm ? 'Sin resultados' : 'No hay productos'}
            hint={searchTerm ? 'Probá con otros términos de búsqueda.' : 'Agregá tu primer producto con el botón Nuevo.'}
          />
        )}
      </DataCard>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}>
          <ProductFormComponent initialData={editingProduct} onSave={handleSaveProduct} onClose={handleCloseModal} />
        </Modal>
      )}
    </div>
  );
};
