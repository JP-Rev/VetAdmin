

import React, { createContext, useContext, ReactNode, useState } from 'react'; // Added useState
import useLocalStorage from '../hooks/useLocalStorage';
import html2canvas from 'html2canvas'; // Import html2canvas
import jsPDF from 'jspdf'; // Import jsPDF

import {
  Cliente, Mascota, Turno, Producto, Venta, Pago, HistorialMedico, Raza, Enfermedad, Cirugia, Gasto,
  MascotaEnfermedad, MascotaCirugia, ClienteForm, MascotaForm, TurnoForm, ProductoForm,
  VentaFormValues, EstadoVenta, MetodoPago, TipoEventoHistorial, Especie, RazaForm, EnfermedadForm, CirugiaForm, GastoForm, CategoriaGasto, EstadoTurno,
  DailyCashFlowReportDetails, AttachmentFile // Import the new type
} from '../types';
import { RAZAS_PREDEFINIDAS, PRODUCTOS_INICIALES, ENFERMEDADES_INICIALES, CIRUGIAS_INICIALES } from '../constants';


interface DataContextType {
  clients: Cliente[];
  pets: Mascota[];
  appointments: Turno[];
  products: Producto[];
  ventas: Venta[]; 
  payments: Pago[];
  medicalHistory: HistorialMedico[];
  breeds: Raza[];
  diseases: Enfermedad[];
  surgeries: Cirugia[];
  petDiseases: MascotaEnfermedad[];
  petSurgeries: MascotaCirugia[];
  expenses: Gasto[];

  addClient: (clientData: ClienteForm) => Cliente;
  updateClient: (clientId: string, clientData: Partial<ClienteForm>) => void;
  deleteClient: (clientId: string) => void;
  getClientById: (clientId: string) => Cliente | undefined;

  addPet: (petData: MascotaForm) => Mascota;
  updatePet: (petId: string, petData: Partial<MascotaForm>) => void;
  deletePet: (petId: string) => void;
  getPetsByClientId: (clientId: string) => Mascota[];
  getPetById: (petId: string) => Mascota | undefined;

  addAppointment: (appointmentData: TurnoForm) => Turno;
  updateAppointment: (appointmentId: string, appointmentData: Partial<TurnoForm & { estado: EstadoTurno }>) => void;
  deleteAppointment: (appointmentId: string) => void;
  getAppointmentsByPetId: (petId: string) => Turno[];
  getUpcomingAppointments: () => Turno[];
  
  addProduct: (productData: ProductoForm) => Producto;
  updateProduct: (productId: string, productData: Partial<ProductoForm>) => void;
  deleteProduct: (productId: string) => void;
  getProductById: (productId: string) => Producto | undefined;
  updateStock: (productId: string, quantityChange: number) => void;
  
  addVenta: (ventaData: VentaFormValues) => Venta; 
  updateVentaStatus: (ventaId: string, status: EstadoVenta) => void; 
  getVentaById: (ventaId: string) => Venta | undefined; 

  addPayment: (ventaId: string, amount: number, method: MetodoPago) => Pago; 
  getPaymentsByVentaId: (ventaId: string) => Pago[]; 

  addMedicalHistoryEvent: (
    petId: string, 
    type: TipoEventoHistorial, 
    description: string, 
    referenceId?: string, 
    eventDateTime?: string,
    attachments?: AttachmentFile[] // Added attachments parameter
  ) => HistorialMedico;
  getMedicalHistoryByPetId: (petId: string) => HistorialMedico[];
  deleteMedicalHistoryEvent: (eventId: string) => void; 
  updateMedicalHistoryEvent: (eventId: string, updatedData: Partial<Pick<HistorialMedico, 'fecha' | 'descripcion' | 'attachments'>>) => void; // Added update function
  
  addBreed: (breedData: RazaForm) => Raza;
  updateBreed: (breedId: string, breedData: Partial<RazaForm>) => void;
  deleteBreed: (breedId: string) => void;
  getBreedById: (breedId: string) => Raza | undefined;

  addDisease: (diseaseData: EnfermedadForm) => Enfermedad;
  updateDisease: (diseaseId: string, diseaseData: Partial<EnfermedadForm>) => void;
  deleteDisease: (diseaseId: string) => void;

  addSurgery: (surgeryData: CirugiaForm) => Cirugia;
  updateSurgery: (surgeryId: string, surgeryData: Partial<CirugiaForm>) => void;
  deleteSurgery: (surgeryId: string) => void;

  recordPetDisease: (petId: string, diseaseId: string, date: string, notes: string, customEventDateTime?: string) => MascotaEnfermedad;
  recordPetSurgery: (petId: string, surgeryId: string, date: string, notes: string, cost?: number, customEventDateTime?: string) => MascotaCirugia;

  addExpense: (expenseData: GastoForm) => Gasto;
  updateExpense: (expenseId: string, expenseData: Partial<GastoForm>) => void;
  deleteExpense: (expenseId: string) => void;

  getDailyCashFlowReport: (targetDate: string) => DailyCashFlowReportDetails; 
  printContent: (content: React.ReactNode, filename?: string) => void; 
  printableContentForPortal: ReactNode | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const getISODateString = (dateInput: Date | string): string => {
  if (typeof dateInput === 'string') {
    // Check if it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
    }
    // Otherwise, assume it's an ISO string or other date string and try to parse
    return new Date(dateInput).toISOString().split('T')[0];
  }
  return dateInput.toISOString().split('T')[0];
};

const sortAppointments = (appointments: Turno[]): Turno[] => {
  return appointments.sort((a, b) => {
    const dateA = new Date(`${a.fecha}T${a.hora}`).getTime();
    const dateB = new Date(`${b.fecha}T${b.hora}`).getTime();
    if (dateA !== dateB) return dateA - dateB;
    const statusOrder = { [EstadoTurno.PENDIENTE]: 1, [EstadoTurno.AUSENTE]: 2, [EstadoTurno.ATENDIDO]: 3, [EstadoTurno.CANCELADO]: 4 };
    return (statusOrder[a.estado] || 99) - (statusOrder[b.estado] || 99);
  });
};


export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useLocalStorage<Cliente[]>('vetadmin_clients', []);
  const [pets, setPets] = useLocalStorage<Mascota[]>('vetadmin_pets', []);
  const [appointments, setAppointments] = useLocalStorage<Turno[]>('vetadmin_appointments', []);
  const [products, setProducts] = useLocalStorage<Producto[]>('vetadmin_products', PRODUCTOS_INICIALES);
  const [ventas, setVentas] = useLocalStorage<Venta[]>('vetadmin_ventas', []); 
  const [payments, setPayments] = useLocalStorage<Pago[]>('vetadmin_payments', []);
  const [medicalHistory, setMedicalHistory] = useLocalStorage<HistorialMedico[]>('vetadmin_medicalhistory', []);
  const [breeds, setBreeds] = useLocalStorage<Raza[]>('vetadmin_breeds', RAZAS_PREDEFINIDAS);
  const [diseases, setDiseases] = useLocalStorage<Enfermedad[]>('vetadmin_diseases', ENFERMEDADES_INICIALES);
  const [surgeries, setSurgeries] = useLocalStorage<Cirugia[]>('vetadmin_surgeries', CIRUGIAS_INICIALES);
  const [petDiseases, setPetDiseases] = useLocalStorage<MascotaEnfermedad[]>('vetadmin_petdiseases', []);
  const [petSurgeries, setPetSurgeries] = useLocalStorage<MascotaCirugia[]>('vetadmin_petsurgeries', []);
  const [expenses, setExpenses] = useLocalStorage<Gasto[]>('vetadmin_expenses', []);
  
  const [printableContentForPortal, setPrintableContentForPortal] = useState<ReactNode | null>(null);

  // Client Operations
  const addClient = (clientData: ClienteForm) => {
    const newClient: Cliente = { ...clientData, id_cliente: generateId(), lastModified: Date.now() };
    setClients(prev => [...prev, newClient]);
    return newClient;
  };
  const updateClient = (clientId: string, clientData: Partial<ClienteForm>) => {
    setClients(prev => prev.map(c => c.id_cliente === clientId ? { ...c, ...clientData, lastModified: Date.now() } : c));
  };
  const deleteClient = (clientId: string) => {
    setClients(prev => prev.filter(c => c.id_cliente !== clientId));
    setPets(prevPets => prevPets.filter(p => p.id_cliente !== clientId));
    setAppointments(prevAppointments => prevAppointments.filter(a => a.cliente_id !== clientId));
    setVentas(prevVentas => prevVentas.filter(o => o.cliente_id !== clientId)); 
  };
  const getClientById = (clientId: string) => clients.find(c => c.id_cliente === clientId);

  // Pet Operations
  const addPet = (petData: MascotaForm) => {
    const newPet: Mascota = { ...petData, id_mascota: generateId(), lastModified: Date.now() };
    setPets(prev => [...prev, newPet]);
    return newPet;
  };
  const updatePet = (petId: string, petData: Partial<MascotaForm>) => {
    setPets(prev => prev.map(p => p.id_mascota === petId ? { ...p, ...petData, lastModified: Date.now() } : p));
  };
  const deletePet = (petId: string) => {
    setPets(prev => prev.filter(p => p.id_mascota !== petId));
    setAppointments(prevAppointments => prevAppointments.filter(a => a.mascota_id !== petId));
    setMedicalHistory(prevHistory => prevHistory.filter(mh => mh.mascota_id !== petId));
    setVentas(prevVentas => prevVentas.map(o => o.mascota_id === petId ? {...o, mascota_id: undefined} : o)); 
  };
  const getPetsByClientId = (clientId: string) => pets.filter(p => p.id_cliente === clientId);
  const getPetById = (petId: string) => pets.find(p => p.id_mascota === petId);

  // Appointment Operations
  const addAppointment = (appointmentData: TurnoForm) => {
    const newAppointment: Turno = { ...appointmentData, id_turno: generateId(), estado: EstadoTurno.PENDIENTE, lastModified: Date.now() };
    setAppointments(prev => sortAppointments([...prev, newAppointment]));
    return newAppointment;
  };
   const updateAppointment = (appointmentId: string, appointmentData: Partial<TurnoForm & { estado: EstadoTurno }>) => {
    setAppointments(prev => sortAppointments(prev.map(a => a.id_turno === appointmentId ? { ...a, ...appointmentData, lastModified: Date.now() } : a)));
  };
  const deleteAppointment = (appointmentId: string) => {
    setAppointments(prev => prev.filter(a => a.id_turno !== appointmentId));
  };
  const getAppointmentsByPetId = (petId: string) => appointments.filter(a => a.mascota_id === petId);
  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments
      .filter(a => a.estado === EstadoTurno.PENDIENTE && new Date(a.fecha + 'T' + a.hora) >= new Date(now.setHours(0,0,0,0))) 
      .sort((a,b) => new Date(a.fecha + 'T' + a.hora).getTime() - new Date(b.fecha + 'T' + b.hora).getTime());
  };

  // Product Operations
  const addProduct = (productData: ProductoForm) => {
    const newProduct: Producto = { ...productData, id_producto: generateId(), lastModified: Date.now() };
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  };
  const updateProduct = (productId: string, productData: Partial<ProductoForm>) => {
    setProducts(prev => prev.map(p => p.id_producto === productId ? { ...p, ...productData, lastModified: Date.now() } : p));
  };
  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id_producto !== productId));
  };
  const getProductById = (productId: string) => products.find(p => p.id_producto === productId);
  const updateStock = (productId: string, quantityChange: number) => { 
    setProducts(prev => prev.map(p => p.id_producto === productId ? { ...p, stock: p.stock + quantityChange, lastModified: Date.now() } : p));
  };

  // Venta Operations
  const addVenta = (ventaData: VentaFormValues) => { 
    let total = 0;
    const ventaProducts = ventaData.productos.map(item => { 
        const product = getProductById(item.producto_id);
        if (!product) throw new Error("Producto no encontrado");
        if (product.stock < item.cantidad) throw new Error(`Stock insuficiente para ${product.nombre}`);
        total += product.precio * item.cantidad;
        return { producto_id: item.producto_id, cantidad: item.cantidad, precio_unitario: product.precio };
    });

    ventaProducts.forEach(item => updateStock(item.producto_id, -item.cantidad));

    const newVenta: Venta = { 
        id_venta: generateId(), 
        fecha: new Date().toISOString(),
        cliente_id: ventaData.cliente_id,
        mascota_id: ventaData.mascota_id,
        productos: ventaProducts, 
        total: parseFloat(total.toFixed(2)),
        estado: EstadoVenta.PENDIENTE, 
        lastModified: Date.now()
    };
    setVentas(prev => [...prev, newVenta].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())); 
    return newVenta;
  };
  const updateVentaStatus = (ventaId: string, status: EstadoVenta) => { 
    setVentas(prev => prev.map(v => v.id_venta === ventaId ? { ...v, estado: status, lastModified: Date.now() } : v)); 
  };
  const getVentaById = (ventaId: string) => ventas.find(v => v.id_venta === ventaId); 

  // Payment Operations
  const addPayment = (ventaId: string, monto: number, metodo: MetodoPago) => { 
    const venta = getVentaById(ventaId); 
    if (!venta) throw new Error("Venta no encontrada para el pago"); 

    const newPayment: Pago = {
        id_pago: generateId(),
        venta_id: ventaId, 
        monto: monto,
        fecha: new Date().toISOString(),
        metodo: metodo,
        lastModified: Date.now()
    };
    setPayments(prev => [...prev, newPayment]);
    
    const allVentaPayments = [...payments, newPayment].filter(p => p.venta_id === ventaId); 
    const totalPaid = allVentaPayments.reduce((sum, p) => sum + p.monto, 0);

    if (totalPaid >= venta.total) { 
        updateVentaStatus(ventaId, EstadoVenta.PAGADA); 
    }
    return newPayment;
  };
  const getPaymentsByVentaId = (ventaId: string) => payments.filter(p => p.venta_id === ventaId); 

  // Medical History Operations
  const addMedicalHistoryEvent = (
    petId: string, 
    type: TipoEventoHistorial, 
    description: string, 
    referenceId?: string, 
    eventDateTime?: string,
    attachments?: AttachmentFile[] // Added attachments
  ) => {
    const newEvent: HistorialMedico = {
        id_evento: generateId(),
        mascota_id: petId,
        fecha: eventDateTime || new Date().toISOString(),
        tipo_evento: type,
        descripcion: description,
        referencia_id: referenceId,
        attachments: attachments || [], // Save attachments
        lastModified: Date.now()
    };
    setMedicalHistory(prev => [newEvent, ...prev].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    return newEvent;
  };
  const getMedicalHistoryByPetId = (petId: string) => medicalHistory.filter(mh => mh.mascota_id === petId).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  
  const deleteMedicalHistoryEvent = (eventId: string) => {
    setMedicalHistory(prev => prev.filter(event => event.id_evento !== eventId));
  };

  const updateMedicalHistoryEvent = (eventId: string, updatedData: Partial<Pick<HistorialMedico, 'fecha' | 'descripcion' | 'attachments'>>) => {
    setMedicalHistory(prev =>
      prev.map(event =>
        event.id_evento === eventId
          ? { ...event, ...updatedData, lastModified: Date.now() }
          : event
      ).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    );
  };


  // Breed Operations
  const addBreed = (breedData: RazaForm) => {
    const newBreed: Raza = { ...breedData, id_raza: generateId() };
    setBreeds(prev => [...prev, newBreed].sort((a,b) => a.nombre.localeCompare(b.nombre)));
    return newBreed;
  };
  const updateBreed = (breedId: string, breedData: Partial<RazaForm>) => {
    setBreeds(prev => prev.map(b => b.id_raza === breedId ? { ...b, ...breedData } : b).sort((a,b) => a.nombre.localeCompare(b.nombre)));
  };
  const deleteBreed = (breedId: string) => {
    setBreeds(prev => prev.filter(b => b.id_raza !== breedId));
  };
  const getBreedById = (breedId: string) => breeds.find(b => b.id_raza === breedId);

  // Disease Operations
  const addDisease = (diseaseData: EnfermedadForm) => {
    const newDisease: Enfermedad = { ...diseaseData, id_enfermedad: generateId() };
    setDiseases(prev => [...prev, newDisease].sort((a,b) => a.nombre.localeCompare(b.nombre)));
    return newDisease;
  };
  const updateDisease = (diseaseId: string, diseaseData: Partial<EnfermedadForm>) => {
    setDiseases(prev => prev.map(d => d.id_enfermedad === diseaseId ? { ...d, ...diseaseData } : d).sort((a,b) => a.nombre.localeCompare(b.nombre)));
  };
  const deleteDisease = (diseaseId: string) => {
    setDiseases(prev => prev.filter(d => d.id_enfermedad !== diseaseId));
  };
  
  // Surgery Operations
  const addSurgery = (surgeryData: CirugiaForm) => {
    const newSurgery: Cirugia = { ...surgeryData, id_cirugia: generateId() };
    setSurgeries(prev => [...prev, newSurgery].sort((a,b) => a.tipo.localeCompare(b.tipo)));
    return newSurgery;
  };
  const updateSurgery = (surgeryId: string, surgeryData: Partial<CirugiaForm>) => {
    setSurgeries(prev => prev.map(s => s.id_cirugia === surgeryId ? { ...s, ...surgeryData } : s).sort((a,b) => a.tipo.localeCompare(b.tipo)));
  };
  const deleteSurgery = (surgeryId: string) => {
    setSurgeries(prev => prev.filter(s => s.id_cirugia !== surgeryId));
  };

  const recordPetDisease = (petId: string, diseaseId: string, date: string, notes: string, customEventDateTime?: string) => {
    const newPetDisease: MascotaEnfermedad = {
      id_mascota_enfermedad: generateId(),
      mascota_id: petId,
      enfermedad_id: diseaseId,
      fecha_diagnostico: date, 
      observaciones: notes,
      lastModified: Date.now()
    };
    setPetDiseases(prev => [...prev, newPetDisease]);
    const disease = diseases.find(d => d.id_enfermedad === diseaseId);
    const description = `Diagnóstico: ${disease?.nombre || 'Desconocida'}. Observaciones: ${notes}`;
    const eventDateTimeForHistory = customEventDateTime || `${date} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    addMedicalHistoryEvent(petId, TipoEventoHistorial.ENFERMEDAD_REGISTRADA, description, newPetDisease.id_mascota_enfermedad, eventDateTimeForHistory);
    return newPetDisease;
  };

  const recordPetSurgery = (petId: string, surgeryId: string, date: string, notes: string, cost?: number, customEventDateTime?: string) => {
    const newPetSurgery: MascotaCirugia = {
      id_mascota_cirugia: generateId(),
      mascota_id: petId,
      cirugia_id: surgeryId,
      fecha: date, 
      observaciones: notes,
      costo_final: cost,
      lastModified: Date.now()
    };
    setPetSurgeries(prev => [...prev, newPetSurgery]);
    const surgery = surgeries.find(s => s.id_cirugia === surgeryId);
    const description = `Cirugía Realizada: ${surgery?.tipo || 'Desconocida'}. Observaciones: ${notes}${cost ? `. Costo: $${cost.toFixed(2)}` : ''}`;
    const eventDateTimeForHistory = customEventDateTime || `${date} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    addMedicalHistoryEvent(petId, TipoEventoHistorial.CIRUGIA, description, newPetSurgery.id_mascota_cirugia, eventDateTimeForHistory);
    return newPetSurgery;
  };

  // Expense Operations
  const addExpense = (expenseData: GastoForm) => {
    const newExpense: Gasto = { ...expenseData, id_gasto: generateId(), lastModified: Date.now() };
    setExpenses(prev => [...prev, newExpense].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    return newExpense;
  };
  const updateExpense = (expenseId: string, expenseData: Partial<GastoForm>) => {
    setExpenses(prev => prev.map(e => e.id_gasto === expenseId ? { ...e, ...expenseData, lastModified: Date.now() } : e).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
  };
  const deleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id_gasto !== expenseId));
  };
  
  // Daily Cash Flow
  const getDailyCashFlowReport = (targetDateString: string): DailyCashFlowReportDetails => {
    const targetDate = getISODateString(targetDateString); // Ensure it's YYYY-MM-DD
    
    const incomeByMethod: { [key in MetodoPago]?: number } = {};
    let totalIncome = 0;

    payments
      .filter(p => getISODateString(p.fecha) === targetDate)
      .forEach(p => {
        incomeByMethod[p.metodo] = (incomeByMethod[p.metodo] || 0) + p.monto;
        totalIncome += p.monto;
      });

    const expensesByCategory: { [key in CategoriaGasto]?: number } = {};
    let totalExpenses = 0;
    
    expenses
      .filter(e => getISODateString(e.fecha) === targetDate)
      .forEach(e => {
        expensesByCategory[e.categoria] = (expensesByCategory[e.categoria] || 0) + e.monto;
        totalExpenses += e.monto;
      });
      
    return {
      incomeByMethod,
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      expensesByCategory,
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      netBalance: parseFloat((totalIncome - totalExpenses).toFixed(2)),
      date: targetDate,
    };
  };

  // Print Content Function for PDF Generation
  const printContent = async (content: React.ReactNode, filename: string = 'documento.pdf') => {
    setPrintableContentForPortal(content);
    document.body.classList.add('printing');

    await new Promise(resolve => setTimeout(resolve, 300)); 

    const printableElement = document.getElementById('print-root')?.querySelector('.printable-area') as HTMLElement;

    if (!printableElement) {
      console.error("Elemento para imprimir '.printable-area' no encontrado en '#print-root'. El portal de React podría no haberse renderizado a tiempo o el contenido es nulo.");
      alert("Error: No se encontró el contenido para crear el PDF. (Código: ELM_NF)");
      document.body.classList.remove('printing'); 
      setPrintableContentForPortal(null);
      return;
    }
    
    try {
      const canvas = await html2canvas(printableElement, {
        scale: 2, 
        useCORS: true, 
        logging: false, 
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({ 
        orientation: 'portrait',
        unit: 'pt', 
        format: [canvas.width, canvas.height] 
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(filename);

    } catch (error) {
      console.error("Error durante la generación del PDF:", error);
      alert("Hubo un error al generar el PDF. Revise la consola para más detalles. (Código: PDF_GEN_ERR)");
    }
    
    document.body.classList.remove('printing'); 
    setPrintableContentForPortal(null); 
  };


  return (
    <DataContext.Provider value={{
      clients, pets, appointments, products, ventas, payments, medicalHistory, breeds, diseases, surgeries, petDiseases, petSurgeries, expenses,
      addClient, updateClient, deleteClient, getClientById,
      addPet, updatePet, deletePet, getPetsByClientId, getPetById,
      addAppointment, updateAppointment, deleteAppointment, getAppointmentsByPetId, getUpcomingAppointments,
      addProduct, updateProduct, deleteProduct, getProductById, updateStock,
      addVenta, updateVentaStatus, getVentaById,
      addPayment, getPaymentsByVentaId,
      addMedicalHistoryEvent, getMedicalHistoryByPetId, deleteMedicalHistoryEvent, updateMedicalHistoryEvent,
      addBreed, updateBreed, deleteBreed, getBreedById,
      addDisease, updateDisease, deleteDisease,
      addSurgery, updateSurgery, deleteSurgery,
      recordPetDisease, recordPetSurgery,
      addExpense, updateExpense, deleteExpense,
      getDailyCashFlowReport,
      printContent,
      printableContentForPortal 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export interface DataContextTypeExtended extends DataContextType {}


export const useData = (): DataContextTypeExtended => {
  const context = useContext(DataContext) as DataContextTypeExtended; 
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
