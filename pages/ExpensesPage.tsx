
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Gasto } from '../types';
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { ExpenseFormComponent } from '../components/forms/ExpenseFormComponent';
import { Plus, Edit3, Trash2, CreditCard as CreditCardIcon } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { expenses, deleteExpense } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Gasto | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenModal = (expense?: Gasto) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(undefined);
  };

  const handleSaveExpense = () => {
    handleCloseModal();
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este gasto? Esta acción no se puede deshacer.')) {
      deleteExpense(id);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(expense =>
        expense.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [expenses, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-secondary-800">Gestión de Gastos</h1>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus />} size="md">
          Nuevo Gasto
        </Button>
      </div>

      <div className="bg-white p-4 shadow rounded-lg">
        <FormField
          label=""
          name="searchExpenses"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar gastos por descripción o categoría..."
          inputClassName="text-sm"
          className="mb-0"
        />
      </div>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}>
          <ExpenseFormComponent initialData={editingExpense} onSave={handleSaveExpense} onClose={handleCloseModal} />
        </Modal>
      )}

      <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Fecha</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Descripción</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Monto</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Categoría</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {filteredExpenses.length > 0 ? filteredExpenses.map(expense => (
              <tr key={expense.id_gasto} className="hover:bg-secondary-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700">{new Date(expense.fecha + 'T00:00:00').toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-secondary-900 max-w-md truncate" title={expense.descripcion}>{expense.descripcion}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 font-medium">${expense.monto.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{expense.categoria}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => handleOpenModal(expense)} title="Editar Gasto" className="text-accent-600 hover:bg-accent-50 p-1.5">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteExpense(expense.id_gasto)} title="Eliminar Gasto" className="text-error-600 hover:bg-error-50 p-1.5">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-secondary-500">
                  <CreditCardIcon className="mx-auto h-10 w-10 text-secondary-400 mb-2" />
                  {searchTerm ? "No hay gastos que coincidan con la búsqueda." : "No hay gastos registrados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
