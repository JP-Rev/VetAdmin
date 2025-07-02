import React, { useState } from 'react';
import { Gasto, GastoForm, CategoriaGasto } from '../../types';
import { useSupabaseData } from '../../contexts/SupabaseDataContext';
import { Button } from '../common/Button';
import { FormField } from '../common/FormField';
import { CATEGORIAS_GASTO } from '../../constants';

interface ExpenseFormProps {
  initialData?: Gasto;
  onSave: (expense: Gasto) => void;
  onClose: () => void;
}

export const ExpenseFormComponent: React.FC<ExpenseFormProps> = ({ initialData, onSave, onClose }) => {
  const { addExpense, updateExpense } = useSupabaseData();
  const [formData, setFormData] = useState<GastoForm>(
    initialData
      ? { fecha: initialData.fecha, descripcion: initialData.descripcion, monto: initialData.monto, categoria: initialData.categoria }
      : { fecha: new Date().toISOString().split('T')[0], descripcion: '', monto: 0, categoria: CategoriaGasto.VARIOS }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof GastoForm, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const type = e.target.type;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value,
    }));

    if (errors[name as keyof GastoForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof GastoForm, string>> = {};
    if (!formData.fecha) newErrors.fecha = 'La fecha es obligatoria.';
    if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es obligatoria.';
    if (isNaN(Number(formData.monto)) || Number(formData.monto) <= 0) newErrors.monto = 'El monto debe ser un número mayor a cero.';
    if (!formData.categoria) newErrors.categoria = 'La categoría es obligatoria.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const processedFormData = {
        ...formData,
        monto: Number(formData.monto),
      };
      if (initialData) {
        updateExpense(initialData.id_gasto, processedFormData);
        onSave({ ...initialData, ...processedFormData, lastModified: Date.now() });
      } else {
        const newExpense = addExpense(processedFormData);
        onSave(newExpense);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} error={errors.fecha} required />
      <FormField label="Descripción" name="descripcion" as="textarea" value={formData.descripcion} onChange={handleChange} error={errors.descripcion} required rows={3} />
      <FormField label="Monto ($)" name="monto" type="number" value={String(formData.monto)} onChange={handleChange} error={errors.monto} required step="0.01" />
      <FormField 
        label="Categoría" 
        name="categoria" 
        as="select" 
        value={formData.categoria} 
        onChange={handleChange} 
        error={errors.categoria} 
        required 
        options={CATEGORIAS_GASTO.map(cat => ({ value: cat, label: cat }))}
      />
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary">{initialData ? 'Guardar Cambios' : 'Registrar Gasto'}</Button>
      </div>
    </form>
  );
};