import React, { useState, useMemo } from 'react';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Gasto } from '../types';
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { ExpenseFormComponent } from '../components/forms/ExpenseFormComponent';
import { Plus, Edit3, Trash2, CreditCard as CreditCardIcon, Calendar } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { expenses, deleteExpense } = useSupabaseData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Gasto | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');

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
      .filter(expense => {
        const matchesSearch = expense.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            expense.categoria.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDate = !selectedDate || expense.fecha === selectedDate;
        
        return matchesSearch && matchesDate;
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [expenses, searchTerm, selectedDate]);

  const dailyTotal = useMemo(() => {
    if (!selectedDate) return 0;
    return filteredExpenses
      .filter(expense => expense.fecha === selectedDate)
      .reduce((sum, expense) => sum + expense.monto, 0);
  }, [filteredExpenses, selectedDate]);

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const clearDateFilter = () => {
    setSelectedDate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-secondary-800">Gestión de Gastos</h1>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus />} size="md">
          Nuevo Gasto
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 shadow rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label=""
            name="searchExpenses"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar gastos por descripción o categoría..."
            inputClassName="text-sm"
            className="mb-0"
          />
          <div className="flex items-end space-x-2">
            <FormField
              label="Filtrar por fecha"
              name="selectedDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mb-0 flex-grow"
            />
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateFilter}
                className="text-primary-600 hover:text-primary-700 h-10"
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>
        
        {selectedDate && (
          <div className="flex items-center justify-between p-3 bg-error-50 border border-error-200 rounded-md">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-error-600 mr-2" />
              <span className="text-sm text-error-700">
                Gastos para {formatDateForDisplay(selectedDate)}: {filteredExpenses.filter(e => e.fecha === selectedDate).length} gasto(s)
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-error-800">
                Total: ${dailyTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}
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
                  {searchTerm || selectedDate 
                    ? "No hay gastos que coincidan con los filtros aplicados." 
                    : "No hay gastos registrados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!selectedDate && filteredExpenses.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-center">
            <p className="text-sm text-secondary-600">
              Total de gastos mostrados: <span className="font-semibold text-secondary-800">${filteredExpenses.reduce((sum, expense) => sum + expense.monto, 0).toFixed(2)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};