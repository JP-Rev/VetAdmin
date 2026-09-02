import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Venta, Cliente, Mascota, Producto, VentaFormValues, EstadoVenta, Pago, MetodoPago, ReceiptVentaProducto, DailyCashFlowReportDetails } from '../types'; 
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { PrintableReceipt } from '../components/PrintableReceipt';
import { Plus, ShoppingCart, Trash2, ChevronDown, DollarSign, CreditCard, Printer, TrendingUp, TrendingDown, BarChart3, XCircle, RotateCcw } from 'lucide-react';
import {
  DataCard, TableWrap, Th, Td, Tr, RowActions, IconAction, EmptyState,
} from '../components/common/ListLayout';

// Venta Form Component
interface VentaFormProps {
  onSave: (venta: Venta) => void; 
  onClose: () => void;
  preselectedClientId?: string;
  preselectedPetId?: string;
}

const VentaFormComponent: React.FC<VentaFormProps> = ({ onSave, onClose, preselectedClientId, preselectedPetId }) => { 
  const { clients, getPetsByClientId, products, addVenta, getPetById } = useSupabaseData(); 
  
  const [formData, setFormData] = useState<VentaFormValues>(() => {
    let determinedClientId = preselectedClientId || '';
    if (preselectedPetId && !preselectedClientId) { 
        const pet = getPetById(preselectedPetId);
        if (pet) determinedClientId = pet.id_cliente;
    }
    return {
      cliente_id: determinedClientId,
      mascota_id: preselectedPetId || '',
      productos: [],
    };
  });
  
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [availablePets, setAvailablePets] = useState<Mascota[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof VentaFormValues | 'productSelection' | 'form', string>>>({});

  useEffect(() => {
    if (formData.cliente_id) {
      const clientPets = getPetsByClientId(formData.cliente_id);
      setAvailablePets(clientPets);
      if (!clientPets.find(p => p.id_mascota === formData.mascota_id)) {
        setFormData(prev => ({ ...prev, mascota_id: '' }));
      }
    } else {
      setAvailablePets([]);
      setFormData(prev => ({ ...prev, mascota_id: '' }));
    }
  }, [formData.cliente_id, getPetsByClientId, formData.mascota_id]);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, cliente_id: e.target.value, mascota_id: '' }));
  };
  
  const handlePetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, mascota_id: e.target.value }));
  };

  const handleAddProductToVenta = () => { 
    if (!currentProduct || currentQuantity <= 0) {
      setErrors((prev) => ({...prev, productSelection: 'Seleccione un producto y cantidad válida.'}));
      return;
    }
    const productExists = formData.productos.find(p => p.producto_id === currentProduct);
    if (productExists) {
      setErrors((prev) => ({...prev, productSelection: 'Este producto ya está en la venta. Edítelo o elimínelo.'})); 
      return;
    }
    const productDetails = products.find(p => p.id_producto === currentProduct);
    if (productDetails && productDetails.stock < currentQuantity) {
      setErrors((prev) => ({...prev, productSelection: `Stock insuficiente para ${productDetails.nombre}. Disponible: ${productDetails.stock}`}));
      return;
    }

    setFormData(prev => ({
      ...prev,
      productos: [...prev.productos, { producto_id: currentProduct, cantidad: currentQuantity }],
    }));
    setCurrentProduct('');
    setCurrentQuantity(1);
    setErrors((prev) => ({...prev, productSelection: undefined}));
  };

  const handleRemoveProductFromVenta = (productId: string) => { 
    setFormData(prev => ({
      ...prev,
      productos: prev.productos.filter(p => p.producto_id !== productId),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VentaFormValues | 'form', string>> = {};
    if (!formData.cliente_id) newErrors.cliente_id = 'Seleccione un cliente.';
    if (formData.productos.length === 0) newErrors.productos = 'Agregue al menos un producto a la venta.'; 
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      try {
        const newVenta = addVenta(formData); 
        onSave(newVenta); 
      } catch (error: any) {
        setErrors({ form: error.message || "Error al crear la venta." }); 
      }
    }
  };

  const calculateTotal = () => {
    return formData.productos.reduce((sum, item) => {
      const product = products.find(p => p.id_producto === item.producto_id);
      return sum + (product ? product.precio * item.cantidad : 0);
    }, 0);
  };

  const clientOptions = clients.map(c => ({ value: c.id_cliente, label: c.nombre })).sort((a,b) => a.label.localeCompare(b.label));
  const petOptions = availablePets.map(p => ({ value: p.id_mascota, label: p.nombre })).sort((a,b) => a.label.localeCompare(b.label));
  const productOptions = products.filter(p => p.stock > 0).map(p => ({ 
    value: p.id_producto, 
    label: `${p.nombre} (Stock: ${p.stock}, $${p.precio.toFixed(2)})` 
  })).sort((a,b) => a.label.localeCompare(b.label));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField 
        label="Cliente" 
        name="cliente_id" 
        as="searchable-select" 
        value={formData.cliente_id} 
        onChange={handleClientChange} 
        error={errors.cliente_id} 
        required 
        options={clientOptions} 
        placeholder="Buscar y seleccionar cliente..." 
        disabled={!!preselectedClientId}
      />
      
      <FormField 
        label="Mascota (Opcional)" 
        name="mascota_id" 
        as="searchable-select" 
        value={formData.mascota_id || ''} 
        onChange={handlePetChange} 
        options={petOptions} 
        placeholder={availablePets.length > 0 ? "Buscar y seleccionar mascota..." : "No hay mascotas para este cliente"} 
        disabled={!formData.cliente_id || availablePets.length === 0 || !!preselectedPetId} 
      />

      <div className="border border-secondary-200 p-4 rounded-md space-y-3 bg-secondary-50">
        <h3 className="text-lg font-medium text-secondary-700">Agregar Productos</h3>
        <div className="flex items-end space-x-2">
          <div className="flex-grow">
            <FormField 
              label="Producto" 
              name="currentProduct" 
              as="searchable-select" 
              value={currentProduct} 
              onChange={(e) => setCurrentProduct(e.target.value)} 
              options={productOptions} 
              placeholder="Buscar y seleccionar producto..." 
              className="mb-0" 
            />
          </div>
          <div className="w-24">
            <FormField label="Cantidad" name="currentQuantity" type="number" value={currentQuantity} onChange={(e) => setCurrentQuantity(parseInt(e.target.value) || 1)} className="mb-0" inputClassName="text-sm" min="1" />
          </div>
          <Button type="button" onClick={handleAddProductToVenta} leftIcon={<Plus />} size="md" className="h-10 self-end">Agregar</Button> 
        </div>
        {errors.productSelection && <p className="text-xs text-error-600">{errors.productSelection}</p>}
      </div>
      
      {formData.productos.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-secondary-700">Productos en la Venta:</h4> 
          <ul className="divide-y divide-secondary-200 border border-secondary-200 rounded-md max-h-48 overflow-y-auto">
            {formData.productos.map(item => {
              const product = products.find(p => p.id_producto === item.producto_id);
              return (
                <li key={item.producto_id} className="p-2 flex justify-between items-center bg-surface hover:bg-secondary-50">
                  <div>
                    {product?.nombre} (x{item.cantidad})
                    <span className="text-xs text-secondary-500 ml-2">@ ${product?.precio.toFixed(2)} c/u</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveProductFromVenta(item.producto_id)} className="text-error-500 hover:bg-error-50 p-1"><Trash2 className="h-4 w-4"/></Button> 
                </li>
              );
            })}
          </ul>
           <p className="text-right font-semibold text-lg text-secondary-800">Total Estimado: ${calculateTotal().toFixed(2)}</p>
        </div>
      )}
      {errors.productos && <p className="text-xs text-error-500">{errors.productos}</p>}
      {errors.form && <p className="text-sm text-error-600 p-2 bg-error-50 rounded-md">{errors.form}</p>}

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary">Crear Venta</Button> 
      </div>
    </form>
  );
};

// Daily Financial Report Component
interface DailyFinancialReportProps {
  selectedDate: string;
  onClose: () => void;
}

const DailyFinancialReport: React.FC<DailyFinancialReportProps> = ({ selectedDate, onClose }) => {
  const { getDailyCashFlowReport } = useSupabaseData();
  const report = getDailyCashFlowReport(selectedDate);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-secondary-800 mb-2">
          Reporte Financiero Diario
        </h3>
        <p className="text-secondary-600">{formatDate(selectedDate)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ingresos */}
        <div className="bg-success-50 p-4 rounded-lg border border-success-200">
          <div className="flex items-center mb-3">
            <TrendingUp className="h-6 w-6 text-success-600 mr-2" />
            <h4 className="text-lg font-semibold text-success-800">Ingresos</h4>
          </div>
          {Object.keys(report.incomeByMethod).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(report.incomeByMethod).map(([method, amount]) => (
                <div key={method} className="flex justify-between text-sm">
                  <span className="text-success-700">{method}:</span>
                  <span className="font-medium text-success-800">${(amount || 0).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-success-300 pt-2 mt-3">
                <div className="flex justify-between font-bold text-success-800">
                  <span>Total Ingresos:</span>
                  <span>${report.totalIncome.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-success-600 text-sm">No hay ingresos registrados</p>
          )}
        </div>

        {/* Egresos */}
        <div className="bg-error-50 p-4 rounded-lg border border-error-200">
          <div className="flex items-center mb-3">
            <TrendingDown className="h-6 w-6 text-error-600 mr-2" />
            <h4 className="text-lg font-semibold text-error-800">Egresos</h4>
          </div>
          {Object.keys(report.expensesByCategory).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(report.expensesByCategory).map(([category, amount]) => (
                <div key={category} className="flex justify-between text-sm">
                  <span className="text-error-700 truncate pr-2" title={category}>{category}:</span>
                  <span className="font-medium text-error-800">${(amount || 0).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-error-300 pt-2 mt-3">
                <div className="flex justify-between font-bold text-error-800">
                  <span>Total Egresos:</span>
                  <span>${report.totalExpenses.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-error-600 text-sm">No hay egresos registrados</p>
          )}
        </div>
      </div>

      {/* Saldo Neto */}
      <div className={`p-4 rounded-lg border-2 ${report.netBalance >= 0 ? 'bg-primary-50 border-primary-300' : 'bg-warning-50 border-warning-300'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className={`h-6 w-6 mr-2 ${report.netBalance >= 0 ? 'text-primary-600' : 'text-warning-600'}`} />
            <span className={`text-lg font-semibold ${report.netBalance >= 0 ? 'text-primary-800' : 'text-warning-800'}`}>
              Saldo Neto:
            </span>
          </div>
          <span className={`text-2xl font-bold ${report.netBalance >= 0 ? 'text-primary-800' : 'text-warning-800'}`}>
            ${report.netBalance.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose} variant="primary">
          Cerrar
        </Button>
      </div>
    </div>
  );
};

// Main Ventas Page
export const Ventas: React.FC = () => { 
  const { ventas, getClientById, getPetById, products, updateVentaStatus, getPaymentsByVentaId, addPayment, printContent, getDailyCashFlowReport } = useSupabaseData(); 
  const [isVentaModalOpen, setIsVentaModalOpen] = useState(false); 
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isFinancialReportModalOpen, setIsFinancialReportModalOpen] = useState(false);
  const [selectedVentaForPayment, setSelectedVentaForPayment] = useState<Venta | undefined>(undefined); 
  const [expandedVentaId, setExpandedVentaId] = useState<string | null>(null); 
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [preselectedClientIdForForm, setPreselectedClientIdForForm] = useState<string | undefined>(undefined);
  const [preselectedPetIdForForm, setPreselectedPetIdForForm] = useState<string | undefined>(undefined);

  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [paymentMethod, setPaymentMethod] = useState<MetodoPago>(MetodoPago.EFECTIVO);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const currentAction = searchParams.get('action');
    const currentClientId = searchParams.get('clientId');
    const currentPetId = searchParams.get('petId');

    if (currentAction === 'new') {
      setPreselectedClientIdForForm(currentClientId || undefined);
      setPreselectedPetIdForForm(currentPetId || undefined);
      setIsVentaModalOpen(true);
    } else {
      if (isVentaModalOpen) {
        setIsVentaModalOpen(false);
      }
      setPreselectedClientIdForForm(undefined);
      setPreselectedPetIdForForm(undefined);
    }
  }, [searchParams, isVentaModalOpen]);

  const handleOpenVentaModal = () => {
    const params = new URLSearchParams();
    params.set('action', 'new');
    navigate(`/ventas?${params.toString()}`, { replace: true });
  };

  const handleCloseVentaModal = () => {
    navigate('/ventas', { replace: true });
  };

  const handleVentaSaved = () => {
    handleCloseVentaModal();
  };

  const handleOpenPaymentModal = (venta: Venta) => { 
    setSelectedVentaForPayment(venta); 
    const ventaPayments = getPaymentsByVentaId(venta.id_venta); 
    const totalCurrentlyPaid = ventaPayments.reduce((sum, p) => sum + p.monto, 0);
    const remainingAmount = venta.total - totalCurrentlyPaid;
    setPaymentAmount(remainingAmount > 0 ? parseFloat(remainingAmount.toFixed(2)) : 0);
    setPaymentMethod(MetodoPago.EFECTIVO);
    setIsPaymentModalOpen(true);
  };
  const handleClosePaymentModal = () => {
    setSelectedVentaForPayment(undefined); 
    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    setPaymentMethod(MetodoPago.EFECTIVO);
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(String(paymentAmount));
    if (selectedVentaForPayment && amount > 0) { 
      addPayment(selectedVentaForPayment.id_venta, amount, paymentMethod); 
      handleClosePaymentModal();
    } else {
      alert("Por favor, ingrese un monto válido.")
    }
  };

  const toggleExpandVenta = (ventaId: string) => { 
    setExpandedVentaId(expandedVentaId === ventaId ? null : ventaId); 
  };

  const handlePrintReceipt = (ventaToPrint: Venta) => {
    const client = getClientById(ventaToPrint.cliente_id);
    const pet = ventaToPrint.mascota_id ? getPetById(ventaToPrint.mascota_id) : undefined;
    
    const detailedProducts: ReceiptVentaProducto[] = ventaToPrint.productos.map(vp => {
      const pDetail = products.find(prod => prod.id_producto === vp.producto_id);
      return {
        ...vp,
        nombre: pDetail?.nombre || "Producto Desconocido",
      }
    });
    const filename = `Ticket-Venta-${ventaToPrint.id_venta.substring(0,8)}.pdf`;
    printContent(
      <PrintableReceipt 
        venta={ventaToPrint} 
        client={client} 
        pet={pet} 
        ventaProductos={detailedProducts}
      />,
      filename
    );
  };

  // Filter sales by selected date
  const filteredVentas = useMemo(() => {
    return ventas.filter(venta => {
      const ventaDate = venta.fecha.split('T')[0]; // Get YYYY-MM-DD part
      return ventaDate === selectedDate;
    }).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [ventas, selectedDate]);

  // Calculate daily totals
  const dailyReport = useMemo(() => {
    return getDailyCashFlowReport(selectedDate);
  }, [getDailyCashFlowReport, selectedDate]);

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.6px] text-secondary-900">Ventas</h1>
        <p className="mt-1 mb-0 text-sm text-secondary-600">Facturación del día y cobros.</p>
      </div>

      {/* Date Filter and Daily Report */}
      <div className="bg-surface p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <FormField
              label="Filtrar por fecha"
              name="selectedDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mb-0"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFinancialReportModalOpen(true)}
              leftIcon={<BarChart3 />}
              className="mt-6"
            >
              Ver Reporte Diario
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-success-50 p-3 rounded-lg border border-success-200">
              <p className="text-xs text-success-600 font-medium">Ingresos</p>
              <p className="text-lg font-bold text-success-800">${dailyReport.totalIncome.toFixed(2)}</p>
            </div>
            <div className="bg-error-50 p-3 rounded-lg border border-error-200">
              <p className="text-xs text-error-600 font-medium">Egresos</p>
              <p className="text-lg font-bold text-error-800">${dailyReport.totalExpenses.toFixed(2)}</p>
            </div>
            <div className={`p-3 rounded-lg border-2 ${dailyReport.netBalance >= 0 ? 'bg-primary-50 border-primary-300' : 'bg-warning-50 border-warning-300'}`}>
              <p className={`text-xs font-medium ${dailyReport.netBalance >= 0 ? 'text-primary-600' : 'text-warning-600'}`}>Saldo Neto</p>
              <p className={`text-lg font-bold ${dailyReport.netBalance >= 0 ? 'text-primary-800' : 'text-warning-800'}`}>
                ${dailyReport.netBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-secondary-600">
          <p>Mostrando {filteredVentas.length} venta(s) para {formatDateForDisplay(selectedDate)}</p>
        </div>
      </div>

      {isVentaModalOpen && ( 
        <Modal isOpen={isVentaModalOpen} onClose={handleCloseVentaModal} title="Crear Nueva Venta" size="lg"> 
          <VentaFormComponent 
            onSave={handleVentaSaved} 
            onClose={handleCloseVentaModal}
            preselectedClientId={preselectedClientIdForForm}
            preselectedPetId={preselectedPetIdForForm}
          /> 
        </Modal>
      )}

      {isPaymentModalOpen && selectedVentaForPayment && ( 
        <Modal isOpen={isPaymentModalOpen} onClose={handleClosePaymentModal} title={`Registrar Pago para Venta #${selectedVentaForPayment.id_venta.substring(0,8)}`}> 
            <form onSubmit={handleAddPayment} className="space-y-4">
                <p className="text-sm text-secondary-700">Cliente: <span className="font-semibold text-secondary-900">{getClientById(selectedVentaForPayment.cliente_id)?.nombre}</span></p>
                <p className="text-sm text-secondary-700">Total Venta: <span className="font-semibold text-secondary-900">${selectedVentaForPayment.total.toFixed(2)}</span></p> 
                <FormField label="Monto a Pagar" name="paymentAmount" type="number" value={String(paymentAmount)} onChange={(e) => setPaymentAmount(e.target.value)} required step="0.01" />
                <FormField label="Método de Pago" name="paymentMethod" as="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as MetodoPago)} required options={Object.values(MetodoPago).map(m => ({value: m, label: m}))} />
                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={handleClosePaymentModal}>Cancelar</Button>
                    <Button type="submit" variant="primary" leftIcon={<DollarSign/>}>Registrar Pago</Button>
                </div>
            </form>
        </Modal>
      )}

      {isFinancialReportModalOpen && (
        <Modal 
          isOpen={isFinancialReportModalOpen} 
          onClose={() => setIsFinancialReportModalOpen(false)} 
          title="Reporte Financiero Diario"
          size="lg"
        >
          <DailyFinancialReport 
            selectedDate={selectedDate}
            onClose={() => setIsFinancialReportModalOpen(false)}
          />
        </Modal>
      )}

      <DataCard
        title="Ventas"
        count={filteredVentas.length}
        filtered
        actionLabel="Nueva"
        onAction={handleOpenVentaModal}
      >
        {filteredVentas.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Venta</Th>
                <Th>Cliente</Th>
                <Th>Hora</Th>
                <Th>Total</Th>
                <Th>Estado</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filteredVentas.map(venta => {
                const client = getClientById(venta.cliente_id);
                const pet = venta.mascota_id ? getPetById(venta.mascota_id) : undefined;
                const isExpanded = expandedVentaId === venta.id_venta;
                const ventaPayments = getPaymentsByVentaId(venta.id_venta);
                const totalPaid = ventaPayments.reduce((sum, p) => sum + p.monto, 0);
                const saldo = venta.total - totalPaid;
                const badge: Record<string, string> = {
                  [EstadoVenta.PAGADA]: 'bg-primary-50 text-primary-700',
                  [EstadoVenta.PENDIENTE]: 'bg-warning-50 text-warning-700',
                  [EstadoVenta.CANCELADA]: 'bg-error-50 text-error-600',
                };

                return (
                  <React.Fragment key={venta.id_venta}>
                    <Tr onClick={() => toggleExpandVenta(venta.id_venta)}>
                      <Td>
                        <span className="flex items-center gap-2">
                          <ChevronDown
                            size={15}
                            className={`text-secondary-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                          <span className="font-mono text-[12.5px] font-semibold text-secondary-900">
                            #{venta.id_venta.slice(-6)}
                          </span>
                        </span>
                      </Td>
                      <Td>
                        <span className="flex flex-col">
                          <span className="text-secondary-900">{client?.nombre || '—'}</span>
                          {pet && <span className="text-[11.5px] text-secondary-500">{pet.nombre}</span>}
                        </span>
                      </Td>
                      <Td className="font-mono text-[12.5px] whitespace-nowrap">
                        {new Date(venta.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </Td>
                      <Td className="font-mono text-[12.5px] font-semibold">${venta.total.toFixed(2)}</Td>
                      <Td>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${badge[venta.estado] ?? ''}`}>
                          {venta.estado}
                        </span>
                      </Td>
                      <Td>
                        <RowActions>
                          {venta.estado === EstadoVenta.PENDIENTE && saldo > 0.001 && (
                            <IconAction label="Registrar pago" onClick={() => handleOpenPaymentModal(venta)}>
                              <CreditCard size={15} />
                            </IconAction>
                          )}
                          <IconAction label="Imprimir ticket" onClick={() => handlePrintReceipt(venta)}>
                            <Printer size={15} />
                          </IconAction>
                          {venta.estado === EstadoVenta.PENDIENTE && (
                            <IconAction label="Cancelar venta" variant="danger" onClick={() => updateVentaStatus(venta.id_venta, EstadoVenta.CANCELADA)}>
                              <XCircle size={15} />
                            </IconAction>
                          )}
                          {venta.estado === EstadoVenta.CANCELADA && (
                            <IconAction label="Reabrir venta" onClick={() => updateVentaStatus(venta.id_venta, EstadoVenta.PENDIENTE)}>
                              <RotateCcw size={15} />
                            </IconAction>
                          )}
                        </RowActions>
                      </Td>
                    </Tr>

                    {isExpanded && (
                      <tr className="border-b border-secondary-100">
                        <td colSpan={6} className="px-5 py-4 bg-secondary-50">
                          <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                              <p className="m-0 mb-2 font-mono text-[9.5px] tracking-[0.16em] uppercase text-secondary-500">Productos</p>
                              <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
                                {venta.productos.map(item => {
                                  const prod = products.find(p => p.id_producto === item.producto_id);
                                  return (
                                    <li key={item.producto_id} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                                      <span className="text-secondary-700 truncate">
                                        {prod?.nombre || 'Producto desconocido'} <span className="text-secondary-500">×{item.cantidad}</span>
                                      </span>
                                      <span className="font-mono text-secondary-900 flex-shrink-0">
                                        ${(item.precio_unitario * item.cantidad).toFixed(2)}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>

                            <div>
                              <p className="m-0 mb-2 font-mono text-[9.5px] tracking-[0.16em] uppercase text-secondary-500">Pagos</p>
                              {ventaPayments.length > 0 ? (
                                <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
                                  {ventaPayments.map(pago => (
                                    <li key={pago.id_pago} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                                      <span className="text-secondary-700">
                                        {pago.metodo} · {new Date(pago.fecha).toLocaleDateString('es-AR')}
                                      </span>
                                      <span className="font-mono text-secondary-900 flex-shrink-0">${pago.monto.toFixed(2)}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="m-0 text-[12.5px] text-secondary-500">Sin pagos registrados.</p>
                              )}

                              <div className="mt-3 pt-3 border-t border-secondary-200 flex flex-col gap-1">
                                <span className="flex items-baseline justify-between text-[12.5px]">
                                  <span className="text-secondary-600">Total pagado</span>
                                  <strong className="font-mono text-secondary-900">${totalPaid.toFixed(2)}</strong>
                                </span>
                                {saldo > 0.001 && (
                                  <span className="flex items-baseline justify-between text-[12.5px]">
                                    <span className="text-error-600">Saldo pendiente</span>
                                    <strong className="font-mono text-error-600">${saldo.toFixed(2)}</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </TableWrap>
        ) : (
          <EmptyState
            icon={<ShoppingCart size={24} />}
            title={`No hay ventas para ${formatDateForDisplay(selectedDate)}`}
            hint="Cambiá la fecha o registrá una venta nueva."
          />
        )}
      </DataCard>
    </div>
  );
};
