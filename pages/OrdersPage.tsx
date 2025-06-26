import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Venta, Cliente, Mascota, Producto, VentaFormValues, EstadoVenta, Pago, MetodoPago } from '../types'; // Renamed types
import { Modal } from '../components/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { Plus, ShoppingCart, Trash2, ChevronDown, DollarSign, CreditCard } from 'lucide-react';

// Venta Form Component (Renamed from OrderFormComponent)
interface VentaFormProps {
  onSave: (venta: Venta) => void; // Renamed from order: Orden
  onClose: () => void;
}

const VentaFormComponent: React.FC<VentaFormProps> = ({ onSave, onClose }) => { // Renamed from OrderFormComponent
  const { clients, getPetsByClientId, products, addVenta } = useData(); // Renamed from addOrder
  const [formData, setFormData] = useState<VentaFormValues>({
    cliente_id: '',
    mascota_id: '',
    productos: [],
  });
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [availablePets, setAvailablePets] = useState<Mascota[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof VentaFormValues | 'productSelection' | 'form', string>>>({});

  useEffect(() => {
    if (formData.cliente_id) {
      setAvailablePets(getPetsByClientId(formData.cliente_id));
    } else {
      setAvailablePets([]);
      setFormData(prev => ({...prev, mascota_id: ''}));
    }
  }, [formData.cliente_id, getPetsByClientId]);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, cliente_id: e.target.value, mascota_id: '' }));
  };
  
  const handlePetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, mascota_id: e.target.value }));
  };

  const handleAddProductToVenta = () => { // Renamed from handleAddProductToOrder
    if (!currentProduct || currentQuantity <= 0) {
      setErrors((prev) => ({...prev, productSelection: 'Seleccione un producto y cantidad válida.'}));
      return;
    }
    const productExists = formData.productos.find(p => p.producto_id === currentProduct);
    if (productExists) {
      setErrors((prev) => ({...prev, productSelection: 'Este producto ya está en la venta. Edítelo o elimínelo.'})); // Renamed "órden" to "venta"
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

  const handleRemoveProductFromVenta = (productId: string) => { // Renamed from handleRemoveProductFromOrder
    setFormData(prev => ({
      ...prev,
      productos: prev.productos.filter(p => p.producto_id !== productId),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VentaFormValues | 'form', string>> = {};
    if (!formData.cliente_id) newErrors.cliente_id = 'Seleccione un cliente.';
    if (formData.productos.length === 0) newErrors.productos = 'Agregue al menos un producto a la venta.'; // Renamed "órden" to "venta"
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      try {
        const newVenta = addVenta(formData); // Renamed from newOrder, addOrder
        onSave(newVenta); // Renamed from newOrder
      } catch (error: any) {
        setErrors({ form: error.message || "Error al crear la venta." }); // Renamed "órden" to "venta"
      }
    }
  };

  const calculateTotal = () => {
    return formData.productos.reduce((sum, item) => {
      const product = products.find(p => p.id_producto === item.producto_id);
      return sum + (product ? product.precio * item.cantidad : 0);
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Cliente" name="cliente_id" as="select" value={formData.cliente_id} onChange={handleClientChange} error={errors.cliente_id} required options={clients.map(c => ({ value: c.id_cliente, label: c.nombre }))} placeholder="Seleccione un cliente" />
      <FormField label="Mascota (Opcional)" name="mascota_id" as="select" value={formData.mascota_id || ''} onChange={handlePetChange} options={availablePets.map(p => ({ value: p.id_mascota, label: p.nombre }))} placeholder="Seleccione una mascota" disabled={!formData.cliente_id || availablePets.length === 0} />

      <div className="border border-secondary-200 p-4 rounded-md space-y-3 bg-secondary-50">
        <h3 className="text-lg font-medium text-secondary-700">Agregar Productos</h3>
        <div className="flex items-end space-x-2">
          <div className="flex-grow">
            <FormField label="Producto" name="currentProduct" as="select" value={currentProduct} onChange={(e) => setCurrentProduct(e.target.value)} options={products.filter(p => p.stock > 0).map(p => ({ value: p.id_producto, label: `${p.nombre} (Stock: ${p.stock}, $: ${p.precio.toFixed(2)})` }))} placeholder="Seleccione producto" className="mb-0" />
          </div>
          <div className="w-24">
            <FormField label="Cantidad" name="currentQuantity" type="number" value={currentQuantity} onChange={(e) => setCurrentQuantity(parseInt(e.target.value) || 1)} className="mb-0" inputClassName="text-sm" min="1" />
          </div>
          <Button type="button" onClick={handleAddProductToVenta} leftIcon={<Plus />} size="md" className="h-10 self-end">Agregar</Button> {/* Renamed from handleAddProductToOrder */}
        </div>
        {errors.productSelection && <p className="text-xs text-error-600">{errors.productSelection}</p>}
      </div>
      
      {formData.productos.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-secondary-700">Productos en la Venta:</h4> {/* Renamed "Órden" to "Venta" */}
          <ul className="divide-y divide-secondary-200 border border-secondary-200 rounded-md max-h-48 overflow-y-auto">
            {formData.productos.map(item => {
              const product = products.find(p => p.id_producto === item.producto_id);
              return (
                <li key={item.producto_id} className="p-2 flex justify-between items-center bg-white hover:bg-secondary-50">
                  <div>
                    {product?.nombre} (x{item.cantidad})
                    <span className="text-xs text-secondary-500 ml-2">@ ${product?.precio.toFixed(2)} c/u</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveProductFromVenta(item.producto_id)} className="text-error-500 hover:bg-error-50 p-1"><Trash2 className="h-4 w-4"/></Button> {/* Renamed from handleRemoveProductFromOrder */}
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
        <Button type="submit" variant="primary">Crear Venta</Button> {/* Renamed "Órden" to "Venta" */}
      </div>
    </form>
  );
};

// Main Ventas Page (Renamed from OrdersPage)
export const VentasPage: React.FC = () => { // Renamed from OrdersPage
  const { ventas, getClientById, getPetById, products, updateVentaStatus, getPaymentsByVentaId, addPayment } = useData(); // Renamed from orders, updateOrderStatus, getPaymentsByOrderId
  const [isVentaModalOpen, setIsVentaModalOpen] = useState(false); // Renamed from isOrderModalOpen
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedVentaForPayment, setSelectedVentaForPayment] = useState<Venta | undefined>(undefined); // Renamed from selectedOrderForPayment
  const [expandedVentaId, setExpandedVentaId] = useState<string | null>(null); // Renamed from expandedOrderId

  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [paymentMethod, setPaymentMethod] = useState<MetodoPago>(MetodoPago.EFECTIVO);


  const handleOpenVentaModal = () => setIsVentaModalOpen(true); // Renamed from handleOpenOrderModal
  const handleCloseVentaModal = () => setIsVentaModalOpen(false); // Renamed from handleCloseOrderModal
  const handleVentaSaved = () => handleCloseVentaModal(); // Renamed from handleOrderSaved

  const handleOpenPaymentModal = (venta: Venta) => { // Renamed from order: Orden
    setSelectedVentaForPayment(venta); // Renamed from setSelectedOrderForPayment
    const ventaPayments = getPaymentsByVentaId(venta.id_venta); // Renamed from orderPayments, getPaymentsByOrderId, venta.id_order
    const totalCurrentlyPaid = ventaPayments.reduce((sum, p) => sum + p.monto, 0);
    const remainingAmount = venta.total - totalCurrentlyPaid;
    setPaymentAmount(remainingAmount > 0 ? parseFloat(remainingAmount.toFixed(2)) : 0);
    setPaymentMethod(MetodoPago.EFECTIVO);
    setIsPaymentModalOpen(true);
  };
  const handleClosePaymentModal = () => {
    setSelectedVentaForPayment(undefined); // Renamed from setSelectedOrderForPayment
    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    setPaymentMethod(MetodoPago.EFECTIVO);
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(String(paymentAmount));
    if (selectedVentaForPayment && amount > 0) { // Renamed from selectedOrderForPayment
      addPayment(selectedVentaForPayment.id_venta, amount, paymentMethod); // Renamed from selectedOrderForPayment.id_order
      handleClosePaymentModal();
    } else {
      alert("Por favor, ingrese un monto válido.")
    }
  };


  const toggleExpandVenta = (ventaId: string) => { // Renamed from toggleExpandOrder, orderId
    setExpandedVentaId(expandedVentaId === ventaId ? null : ventaId); // Renamed from expandedOrderId
  };

  const sortedVentas = [...ventas].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); // Renamed from sortedOrders, orders
  
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-secondary-800">Gestión de Ventas</h1> {/* Renamed "Órdenes" to "Ventas" */}
        <Button onClick={handleOpenVentaModal} leftIcon={<Plus />}>
          Nueva Venta {/* Renamed "Órden" to "Venta" */}
        </Button>
      </div>

      {isVentaModalOpen && ( // Renamed from isOrderModalOpen
        <Modal isOpen={isVentaModalOpen} onClose={handleCloseVentaModal} title="Crear Nueva Venta" size="lg"> {/* Renamed "Órden" to "Venta" */}
          <VentaFormComponent onSave={handleVentaSaved} onClose={handleCloseVentaModal} /> {/* Renamed from OrderFormComponent, handleOrderSaved */}
        </Modal>
      )}

      {isPaymentModalOpen && selectedVentaForPayment && ( // Renamed from selectedOrderForPayment
        <Modal isOpen={isPaymentModalOpen} onClose={handleClosePaymentModal} title={`Registrar Pago para Venta #${selectedVentaForPayment.id_venta.substring(0,8)}`}> {/* Renamed "Órden" to "Venta", id_order */}
            <form onSubmit={handleAddPayment} className="space-y-4">
                <p className="text-sm text-secondary-700">Cliente: <span className="font-semibold text-secondary-900">{getClientById(selectedVentaForPayment.cliente_id)?.nombre}</span></p>
                <p className="text-sm text-secondary-700">Total Venta: <span className="font-semibold text-secondary-900">${selectedVentaForPayment.total.toFixed(2)}</span></p> {/* Renamed "Órden" to "Venta" */}
                <FormField label="Monto a Pagar" name="paymentAmount" type="number" value={String(paymentAmount)} onChange={(e) => setPaymentAmount(e.target.value)} required />
                <FormField label="Método de Pago" name="paymentMethod" as="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as MetodoPago)} required options={Object.values(MetodoPago).map(m => ({value: m, label: m}))} />
                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={handleClosePaymentModal}>Cancelar</Button>
                    <Button type="submit" variant="primary" leftIcon={<DollarSign/>}>Registrar Pago</Button>
                </div>
            </form>
        </Modal>
      )}

      <div className="space-y-4">
        {sortedVentas.length > 0 ? sortedVentas.map(venta => { // Renamed from sortedOrders, venta from order
          const client = getClientById(venta.cliente_id);
          const pet = venta.mascota_id ? getPetById(venta.mascota_id) : undefined;
          const isExpanded = expandedVentaId === venta.id_venta; // Renamed from expandedOrderId, venta.id_order
          const ventaPayments = getPaymentsByVentaId(venta.id_venta); // Renamed from orderPayments, getPaymentsByOrderId, venta.id_order
          const totalPaid = ventaPayments.reduce((sum, p) => sum + p.monto, 0);
          
          let statusColorClass = '';
          switch (venta.estado) { // Renamed from order.estado
            case EstadoVenta.PAGADA: statusColorClass = 'bg-success-100 text-success-800'; break; // Renamed from EstadoOrden
            case EstadoVenta.PENDIENTE: statusColorClass = 'bg-warning-100 text-warning-800'; break; // Renamed from EstadoOrden
            case EstadoVenta.CANCELADA: statusColorClass = 'bg-error-100 text-error-800'; break; // Renamed from EstadoOrden
          }

          return (
            <div key={venta.id_venta} className="bg-white shadow-lg rounded-lg overflow-hidden"> {/* Renamed from venta.id_order */}
              <div className="p-4 sm:p-5 cursor-pointer hover:bg-secondary-50 transition-colors duration-150" onClick={() => toggleExpandVenta(venta.id_venta)}> {/* Renamed from toggleExpandOrder, venta.id_order */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-primary-700">Venta #{venta.id_venta.substring(0,8)}</h2> {/* Renamed "Órden" to "Venta", venta.id_order */}
                    <p className="text-sm text-secondary-600">{client?.nombre} {pet ? `- ${pet.nombre}` : ''}</p>
                    <p className="text-xs text-secondary-500">Fecha: {new Date(venta.fecha).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-secondary-800">${venta.total.toFixed(2)}</p>
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorClass}`}>
                      {venta.estado} {/* Renamed from order.estado */}
                    </span>
                  </div>
                  <ChevronDown className={`h-6 w-6 text-secondary-500 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} ml-auto sm:ml-2`} />
                </div>
              </div>

              <div style={isExpanded ? animationStyle : { ...animationStyle, ...collapsedStyle }}>
                <div className="border-t border-secondary-200 p-4 sm:p-5 bg-secondary-50 space-y-3">
                  <h4 className="font-medium text-secondary-700">Productos:</h4>
                  <ul className="list-disc list-inside pl-2 text-sm text-secondary-600 max-h-40 overflow-y-auto">
                    {venta.productos.map(item => { // Renamed from order.productos
                      const productDetails = products.find(p => p.id_producto === item.producto_id);
                      return (
                        <li key={item.producto_id}>
                          {productDetails?.nombre || 'Producto Desconocido'} (x{item.cantidad}) - ${ (item.precio_unitario * item.cantidad).toFixed(2)}
                        </li>
                      );
                    })}
                  </ul>
                  <h4 className="font-medium text-secondary-700 mt-2">Pagos:</h4>
                   {ventaPayments.length > 0 ? ( // Renamed from orderPayments
                        <ul className="list-disc list-inside pl-2 text-sm text-secondary-600">
                            {ventaPayments.map(p => ( // Renamed from orderPayments
                                <li key={p.id_pago}>${p.monto.toFixed(2)} ({p.metodo}) - {new Date(p.fecha).toLocaleDateString()}</li>
                            ))}
                        </ul>
                   ) : <p className="text-sm text-secondary-500">No hay pagos registrados.</p>}
                   <p className="text-sm font-semibold text-secondary-800">Total Pagado: ${totalPaid.toFixed(2)}</p>
                   {venta.total - totalPaid > 0.001 && <p className="text-sm text-error-600 font-semibold">Saldo Pendiente: ${(venta.total - totalPaid).toFixed(2)}</p>} {/* Renamed from order.total */}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {venta.estado === EstadoVenta.PENDIENTE && (venta.total - totalPaid > 0.001) && ( // Renamed from order.estado, EstadoOrden
                      <Button size="sm" variant="primary" onClick={() => handleOpenPaymentModal(venta)} leftIcon={<CreditCard />}>Registrar Pago</Button> // Renamed from order
                    )}
                    {venta.estado === EstadoVenta.PENDIENTE && ( // Renamed from order.estado, EstadoOrden
                      <Button size="sm" variant="danger" onClick={() => updateVentaStatus(venta.id_venta, EstadoVenta.CANCELADA)}>Cancelar Venta</Button> // Renamed from updateOrderStatus, venta.id_order, EstadoOrden, "Órden" to "Venta"
                    )}
                     {venta.estado === EstadoVenta.CANCELADA && ( // Renamed from order.estado, EstadoOrden
                      <Button size="sm" variant="secondary" onClick={() => updateVentaStatus(venta.id_venta, EstadoVenta.PENDIENTE)}>Reabrir Venta</Button> // Renamed from updateOrderStatus, venta.id_order, EstadoOrden, "Órden" to "Venta"
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        }) : (
          <div className="text-center py-10 bg-white rounded-lg shadow">
            <ShoppingCart className="mx-auto h-12 w-12 text-secondary-400" />
            <h3 className="mt-2 text-sm font-medium text-secondary-900">No hay ventas</h3> {/* Renamed "órdenes" to "ventas" */}
            <p className="mt-1 text-sm text-secondary-500">Comience por crear una nueva venta.</p> {/* Renamed "órden" to "venta" */}
          </div>
        )}
      </div>
    </div>
  );
};
