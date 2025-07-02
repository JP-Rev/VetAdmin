import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Venta, Cliente, Mascota, Producto, VentaFormValues, EstadoVenta, Pago, MetodoPago, ReceiptVentaProducto, DailyCashFlowReportDetails } from '../types'; 
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { PrintableReceipt } from '../components/PrintableReceipt';
import { Plus, ShoppingCart, Trash2, ChevronDown, DollarSign, CreditCard, Printer, Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

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
                <li key={item.producto_id} className="p-2 flex justify-between items-center bg-white hover:bg-secondary-50">
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

  const sortedVentas = [...ventas].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); 
  
  const animationStyle = {
    maxHeight: '1000px',
    overflow: 'hidden',
    transition: 'max-height 0.5s ease-in-out, padding-top 0.5s ease-in-out, padding-bottom 0.5s ease-in-out, opacity 0.5s ease-in-out',
  };
  const collapsedStyle = {
    maxHeight: '0',
    paddingTop: '0',
    paddingBottom: '0',
    opacity: 0,
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-secondary-800">Gestión de Ventas</h1> 
        <Button onClick={handleOpenVentaModal} leftIcon={<Plus />}>
          Nueva Venta 
        </Button>
      </div>

      {/* Date Filter and Daily Report */}
      <div className="bg-white p-4 rounded-lg shadow-md">
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

      <div className="space-y-4">
        {filteredVentas.length > 0 ? filteredVentas.map(venta => { 
          const client = getClientById(venta.cliente_id);
          const pet = venta.mascota_id ? getPetById(venta.mascota_id) : undefined;
          const isExpanded = expandedVentaId === venta.id_venta; 
          const ventaPayments = getPaymentsByVentaId(venta.id_venta); 
          const totalPaid = ventaPayments.reduce((sum, p) => sum + p.monto, 0);
          
          let statusColorClass = '';
          switch (venta.estado) { 
            case EstadoVenta.PAGADA: statusColorClass = 'bg-success-100 text-success-800'; break; 
            case EstadoVenta.PENDIENTE: statusColorClass = 'bg-warning-100 text-warning-800'; break; 
            case EstadoVenta.CANCELADA: statusColorClass = 'bg-error-100 text-error-800'; break; 
          }

          return (
            <div key={venta.id_venta} className="bg-white shadow-lg rounded-lg overflow-hidden"> 
              <div className="p-4 sm:p-5 cursor-pointer hover:bg-secondary-50 transition-colors duration-150" onClick={() => toggleExpandVenta(venta.id_venta)}> 
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-primary-700">Venta #{venta.id_venta.substring(0,8)}</h2> 
                    <p className="text-sm text-secondary-600">{client?.nombre} {pet ? `- ${pet.nombre}` : ''}</p>
                    <p className="text-xs text-secondary-500">Fecha: {new Date(venta.fecha).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-secondary-800">${venta.total.toFixed(2)}</p>
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorClass}`}>
                      {venta.estado} 
                    </span>
                  </div>
                  <ChevronDown className={`h-6 w-6 text-secondary-500 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} ml-auto sm:ml-2`} />
                </div>
              </div>

              <div style={isExpanded ? animationStyle : { ...animationStyle, ...collapsedStyle }}>
                <div className="border-t border-secondary-200 p-4 sm:p-5 bg-secondary-50 space-y-3">
                  <h4 className="font-medium text-secondary-700">Productos:</h4>
                  <ul className="list-disc list-inside pl-2 text-sm text-secondary-600 max-h-40 overflow-y-auto">
                    {venta.productos.map(item => { 
                      const productDetails = products.find(p => p.id_producto === item.producto_id);
                      return (
                        <li key={item.producto_id}>
                          {productDetails?.nombre || 'Producto Desconocido'} (x{item.cantidad}) - ${ (item.precio_unitario * item.cantidad).toFixed(2)}
                        </li>
                      );
                    })}
                  </ul>
                  <h4 className="font-medium text-secondary-700 mt-2">Pagos:</h4>
                   {ventaPayments.length > 0 ? ( 
                        <ul className="list-disc list-inside pl-2 text-sm text-secondary-600">
                            {ventaPayments.map(p => ( 
                                <li key={p.id_pago}>${p.monto.toFixed(2)} ({p.metodo}) - {new Date(p.fecha).toLocaleDateString()}</li>
                            ))}
                        </ul>
                   ) : <p className="text-sm text-secondary-500">No hay pagos registrados.</p>}
                   <p className="text-sm font-semibold text-secondary-800">Total Pagado: ${totalPaid.toFixed(2)}</p>
                   {venta.total - totalPaid > 0.001 && <p className="text-sm text-error-600 font-semibold">Saldo Pendiente: ${(venta.total - totalPaid).toFixed(2)}</p>} 

                  <div className="flex flex-wrap gap-2 pt-2">
                    {venta.estado === EstadoVenta.PENDIENTE && (venta.total - totalPaid > 0.001) && ( 
                      <Button size="sm" variant="primary" onClick={() => handleOpenPaymentModal(venta)} leftIcon={<CreditCard />}>Registrar Pago</Button> 
                    )}
                    {venta.estado === EstadoVenta.PENDIENTE && ( 
                      <Button size="sm" variant="danger" onClick={() => updateVentaStatus(venta.id_venta, EstadoVenta.CANCELADA)}>Cancelar Venta</Button> 
                    )}
                     {venta.estado === EstadoVenta.CANCELADA && ( 
                      <Button size="sm" variant="secondary" onClick={() => updateVentaStatus(venta.id_venta, EstadoVenta.PENDIENTE)}>Reabrir Venta</Button> 
                    )}
                    <Button size="sm" variant="outline" onClick={() => handlePrintReceipt(venta)} leftIcon={<Printer />}>Imprimir Ticket</Button>
                  </div>
                </div>
              </div>
            </div>
          )
        }) : (
          <div className="text-center py-10 bg-white rounded-lg shadow">
            <ShoppingCart className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-secondary-900">
              {selectedDate === new Date().toISOString().split('T')[0] 
                ? "No hay ventas hoy" 
                : `No hay ventas para ${formatDateForDisplay(selectedDate)}`}
            </h3>
            <p className="mt-1 text-sm text-secondary-500">
              {selectedDate === new Date().toISOString().split('T')[0] 
                ? "Comience por crear una nueva venta." 
                : "Seleccione otra fecha o cree una nueva venta."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};