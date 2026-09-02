import React, { useState, useMemo } from 'react';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Gasto } from '../types';
import { Modal } from '../components/Modal';
import { ExpenseFormComponent } from '../components/forms/ExpenseFormComponent';
import { CreditCard as CreditCardIcon, Calendar } from 'lucide-react';
import {
  FilterCard, DataCard, TableWrap, Th, Td, Tr, RowActions, IconAction, EditIcon, DeleteIcon, EmptyState,
} from '../components/common/ListLayout';

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

  const hayFiltro = searchTerm.trim().length > 0 || selectedDate !== '';

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.6px] text-secondary-900">Gastos</h1>
        <p className="mt-1 mb-0 text-sm text-secondary-600">Egresos de la clínica.</p>
      </div>

      <FilterCard
        title="Filtros de gastos"
        subtitle="Buscar por descripción o categoría, y filtrar por fecha"
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar gasto…"
      >
        <div className="flex items-end gap-2 flex-shrink-0">
          <label className="flex flex-col">
            <span className="text-[12.5px] font-semibold text-secondary-700 mb-1.5">Fecha</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-surface border border-secondary-200 rounded-[10px] px-3 py-2.5 text-[13.5px]
                         text-secondary-900 outline-none focus:border-secondary-300 transition-colors"
            />
          </label>
          {selectedDate && (
            <button
              onClick={clearDateFilter}
              className="h-[42px] px-3 rounded-[10px] border border-secondary-200 text-[12.5px] font-semibold
                         text-secondary-600 hover:bg-secondary-100 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </FilterCard>

      {selectedDate && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-warning-50 border border-warning-200 rounded-[12px]">
          <span className="flex items-center gap-2 text-[13px] text-warning-800">
            <Calendar size={16} />
            {formatDateForDisplay(selectedDate)}: {filteredExpenses.filter(e => e.fecha === selectedDate).length} gasto(s)
          </span>
          <strong className="font-mono text-[15px] text-warning-800">Total: ${dailyTotal.toFixed(2)}</strong>
        </div>
      )}

      <DataCard
        title="Gastos"
        count={filteredExpenses.length}
        filtered={hayFiltro}
        actionLabel="Nuevo"
        onAction={() => handleOpenModal()}
      >
        {filteredExpenses.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Fecha</Th>
                <Th>Descripción</Th>
                <Th>Categoría</Th>
                <Th>Monto</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(expense => (
                <Tr key={expense.id_gasto}>
                  <Td className="font-mono text-[12.5px] whitespace-nowrap">
                    {new Date(expense.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                  </Td>
                  <Td className="font-medium text-secondary-900 max-w-md truncate" >{expense.descripcion}</Td>
                  <Td className="text-secondary-600">{expense.categoria}</Td>
                  <Td className="font-mono text-[12.5px] font-semibold">${expense.monto.toFixed(2)}</Td>
                  <Td>
                    <RowActions>
                      <IconAction label="Editar gasto" onClick={() => handleOpenModal(expense)}>
                        <EditIcon />
                      </IconAction>
                      <IconAction label="Eliminar gasto" variant="danger" onClick={() => handleDeleteExpense(expense.id_gasto)}>
                        <DeleteIcon />
                      </IconAction>
                    </RowActions>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <EmptyState
            icon={<CreditCardIcon size={24} />}
            title={hayFiltro ? 'Sin resultados' : 'No hay gastos'}
            hint={hayFiltro ? 'Probá con otros filtros.' : 'Registrá tu primer gasto con el botón Nuevo.'}
          />
        )}
      </DataCard>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}>
          <ExpenseFormComponent initialData={editingExpense} onSave={handleSaveExpense} onClose={handleCloseModal} />
        </Modal>
      )}
    </div>
  );
};
