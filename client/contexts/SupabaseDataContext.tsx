import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete, apiUpload } from '../lib/api';

import {
  Cliente, Mascota, Turno, Producto, Venta, Pago, HistorialMedico, Raza, Enfermedad, Cirugia, Gasto,
  MascotaEnfermedad, MascotaCirugia, ClienteForm, MascotaForm, TurnoForm, ProductoForm,
  VentaFormValues, EstadoVenta, MetodoPago, TipoEventoHistorial, RazaForm, EnfermedadForm, CirugiaForm, GastoForm, CategoriaGasto, EstadoTurno,
  DailyCashFlowReportDetails, AttachmentFile, CategoriaProducto, CategoriaProductoForm
} from '../types';

interface BootstrapResponse {
  clientes: Cliente[];
  mascotas: Mascota[];
  turnos: Turno[];
  productos: Producto[];
  categoriasProductos: CategoriaProducto[];
  ventas: Venta[];
  pagos: Pago[];
  historialMedico: HistorialMedico[];
  razas: Raza[];
  enfermedades: Enfermedad[];
  cirugias: Cirugia[];
  mascotaEnfermedades: MascotaEnfermedad[];
  mascotaCirugias: MascotaCirugia[];
  gastos: Gasto[];
}

interface SupabaseDataContextType {
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
  productCategories: CategoriaProducto[];
  loading: boolean;
  error: string | null;

  // Client operations
  addClient: (clientData: ClienteForm) => Promise<Cliente>;
  updateClient: (clientId: string, clientData: Partial<ClienteForm>) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  getClientById: (clientId: string) => Cliente | undefined;

  // Pet operations
  addPet: (petData: MascotaForm) => Promise<Mascota>;
  updatePet: (petId: string, petData: Partial<MascotaForm>) => Promise<void>;
  deletePet: (petId: string) => Promise<void>;
  getPetsByClientId: (clientId: string) => Mascota[];
  getPetById: (petId: string) => Mascota | undefined;

  // Appointment operations
  addAppointment: (appointmentData: TurnoForm) => Promise<Turno>;
  updateAppointment: (appointmentId: string, appointmentData: Partial<TurnoForm & { estado: EstadoTurno }>) => Promise<void>;
  deleteAppointment: (appointmentId: string) => Promise<void>;
  getAppointmentsByPetId: (petId: string) => Turno[];
  getUpcomingAppointments: () => Turno[];

  // Product operations
  addProduct: (productData: ProductoForm) => Promise<Producto>;
  updateProduct: (productId: string, productData: Partial<ProductoForm>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Producto | undefined;
  updateStock: (productId: string, quantityChange: number) => Promise<void>;

  // Product category operations
  addProductCategory: (categoryData: CategoriaProductoForm) => Promise<CategoriaProducto>;
  updateProductCategory: (categoryId: string, categoryData: Partial<CategoriaProductoForm>) => Promise<void>;
  deleteProductCategory: (categoryId: string) => Promise<void>;
  getProductCategoryById: (categoryId: string) => CategoriaProducto | undefined;

  // Venta operations
  addVenta: (ventaData: VentaFormValues) => Promise<Venta>;
  updateVentaStatus: (ventaId: string, status: EstadoVenta) => Promise<void>;
  getVentaById: (ventaId: string) => Venta | undefined;

  // Payment operations
  addPayment: (ventaId: string, amount: number, method: MetodoPago) => Promise<Pago>;
  getPaymentsByVentaId: (ventaId: string) => Pago[];

  // Medical history operations
  addMedicalHistoryEvent: (
    petId: string,
    type: TipoEventoHistorial,
    description: string,
    referenceId?: string,
    eventDateTime?: string,
    files?: File[]
  ) => Promise<HistorialMedico>;
  getMedicalHistoryByPetId: (petId: string) => HistorialMedico[];
  deleteMedicalHistoryEvent: (eventId: string) => Promise<void>;
  updateMedicalHistoryEvent: (eventId: string, updatedData: Partial<Pick<HistorialMedico, 'fecha' | 'descripcion'>>) => Promise<void>;
  addAttachmentToEvent: (eventId: string, file: File) => Promise<AttachmentFile>;
  deleteAttachment: (attachmentId: string, eventId: string) => Promise<void>;

  // Breed operations
  addBreed: (breedData: RazaForm) => Promise<Raza>;
  updateBreed: (breedId: string, breedData: Partial<RazaForm>) => Promise<void>;
  deleteBreed: (breedId: string) => Promise<void>;
  getBreedById: (breedId: string) => Raza | undefined;

  // Disease operations
  addDisease: (diseaseData: EnfermedadForm) => Promise<Enfermedad>;
  updateDisease: (diseaseId: string, diseaseData: Partial<EnfermedadForm>) => Promise<void>;
  deleteDisease: (diseaseId: string) => Promise<void>;

  // Surgery operations
  addSurgery: (surgeryData: CirugiaForm) => Promise<Cirugia>;
  updateSurgery: (surgeryId: string, surgeryData: Partial<CirugiaForm>) => Promise<void>;
  deleteSurgery: (surgeryId: string) => Promise<void>;

  // Pet disease/surgery operations
  recordPetDisease: (petId: string, diseaseId: string, date: string, notes: string, customEventDateTime?: string) => Promise<MascotaEnfermedad>;
  recordPetSurgery: (petId: string, surgeryId: string, date: string, notes: string, cost?: number, customEventDateTime?: string) => Promise<MascotaCirugia>;

  // Expense operations
  addExpense: (expenseData: GastoForm) => Promise<Gasto>;
  updateExpense: (expenseId: string, expenseData: Partial<GastoForm>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;

  // Reports
  getDailyCashFlowReport: (targetDate: string) => DailyCashFlowReportDetails;
  printContent: (content: React.ReactNode, filename?: string) => void;
  printableContentForPortal: ReactNode | null;

  // Data refresh
  refreshData: () => Promise<void>;
}

const SupabaseDataContext = createContext<SupabaseDataContextType | undefined>(undefined);

export const SupabaseDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [clients, setClients] = useState<Cliente[]>([]);
  const [pets, setPets] = useState<Mascota[]>([]);
  const [appointments, setAppointments] = useState<Turno[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [payments, setPayments] = useState<Pago[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<HistorialMedico[]>([]);
  const [breeds, setBreeds] = useState<Raza[]>([]);
  const [diseases, setDiseases] = useState<Enfermedad[]>([]);
  const [surgeries, setSurgeries] = useState<Cirugia[]>([]);
  const [petDiseases, setPetDiseases] = useState<MascotaEnfermedad[]>([]);
  const [petSurgeries, setPetSurgeries] = useState<MascotaCirugia[]>([]);
  const [expenses, setExpenses] = useState<Gasto[]>([]);
  const [productCategories, setProductCategories] = useState<CategoriaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printableContentForPortal, setPrintableContentForPortal] = useState<ReactNode | null>(null);

  // Load all data
  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiGet<BootstrapResponse>('/bootstrap');

      setClients(data.clientes);
      setPets(data.mascotas);
      setAppointments(data.turnos);
      setProducts(data.productos);
      setProductCategories(data.categoriasProductos);
      setVentas(data.ventas);
      setPayments(data.pagos);
      setMedicalHistory(data.historialMedico);
      setBreeds(data.razas);
      setDiseases(data.enfermedades);
      setSurgeries(data.cirugias);
      setPetDiseases(data.mascotaEnfermedades);
      setPetSurgeries(data.mascotaCirugias);
      setExpenses(data.gastos);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, []);

  // Client operations
  const addClient = async (clientData: ClienteForm): Promise<Cliente> => {
    const newClient = await apiPost<Cliente>('/clientes', clientData);
    setClients(prev => [...prev, newClient].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return newClient;
  };

  const updateClient = async (clientId: string, clientData: Partial<ClienteForm>): Promise<void> => {
    const updated = await apiPut<Cliente>(`/clientes/${clientId}`, clientData);
    setClients(prev => prev.map(c => c.id_cliente === clientId ? updated : c));
  };

  const deleteClient = async (clientId: string): Promise<void> => {
    await apiDelete(`/clientes/${clientId}`);

    setClients(prev => prev.filter(c => c.id_cliente !== clientId));
    setPets(prev => prev.filter(p => p.id_cliente !== clientId));
    setAppointments(prev => prev.filter(a => a.cliente_id !== clientId));
    setVentas(prev => prev.filter(v => v.cliente_id !== clientId));
  };

  const getClientById = (clientId: string) => clients.find(c => c.id_cliente === clientId);

  // Pet operations
  const addPet = async (petData: MascotaForm): Promise<Mascota> => {
    const newPet = await apiPost<Mascota>('/mascotas', petData);
    setPets(prev => [...prev, newPet].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return newPet;
  };

  const updatePet = async (petId: string, petData: Partial<MascotaForm>): Promise<void> => {
    const updated = await apiPut<Mascota>(`/mascotas/${petId}`, petData);
    setPets(prev => prev.map(p => p.id_mascota === petId ? updated : p));
  };

  const deletePet = async (petId: string): Promise<void> => {
    await apiDelete(`/mascotas/${petId}`);

    setPets(prev => prev.filter(p => p.id_mascota !== petId));
    setAppointments(prev => prev.filter(a => a.mascota_id !== petId));
    setMedicalHistory(prev => prev.filter(mh => mh.mascota_id !== petId));
    setVentas(prev => prev.map(v => v.mascota_id === petId ? { ...v, mascota_id: undefined } : v));
  };

  const getPetsByClientId = (clientId: string) => pets.filter(p => p.id_cliente === clientId);
  const getPetById = (petId: string) => pets.find(p => p.id_mascota === petId);

  // Appointment operations
  const addAppointment = async (appointmentData: TurnoForm): Promise<Turno> => {
    const newAppointment = await apiPost<Turno>('/turnos', appointmentData);
    setAppointments(prev => [newAppointment, ...prev].sort((a, b) => {
      const dateA = new Date(`${a.fecha}T${a.hora}`).getTime();
      const dateB = new Date(`${b.fecha}T${b.hora}`).getTime();
      return dateA - dateB;
    }));
    return newAppointment;
  };

  const updateAppointment = async (appointmentId: string, appointmentData: Partial<TurnoForm & { estado: EstadoTurno }>): Promise<void> => {
    const updated = await apiPut<Turno>(`/turnos/${appointmentId}`, appointmentData);
    setAppointments(prev => prev.map(a => a.id_turno === appointmentId ? updated : a).sort((a, b) => {
      const dateA = new Date(`${a.fecha}T${a.hora}`).getTime();
      const dateB = new Date(`${b.fecha}T${b.hora}`).getTime();
      return dateA - dateB;
    }));
  };

  const deleteAppointment = async (appointmentId: string): Promise<void> => {
    await apiDelete(`/turnos/${appointmentId}`);
    setAppointments(prev => prev.filter(a => a.id_turno !== appointmentId));
  };

  const getAppointmentsByPetId = (petId: string) => appointments.filter(a => a.mascota_id === petId);

  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments
      .filter(a => a.estado === EstadoTurno.PENDIENTE && new Date(a.fecha + 'T' + a.hora) >= new Date(now.setHours(0, 0, 0, 0)))
      .sort((a, b) => new Date(a.fecha + 'T' + a.hora).getTime() - new Date(b.fecha + 'T' + b.hora).getTime());
  };

  // Product operations
  const addProduct = async (productData: ProductoForm): Promise<Producto> => {
    const newProduct = await apiPost<Producto>('/productos', productData);
    setProducts(prev => [...prev, newProduct].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return newProduct;
  };

  const updateProduct = async (productId: string, productData: Partial<ProductoForm>): Promise<void> => {
    const updated = await apiPut<Producto>(`/productos/${productId}`, productData);
    setProducts(prev => prev.map(p => p.id_producto === productId ? updated : p));
  };

  const deleteProduct = async (productId: string): Promise<void> => {
    await apiDelete(`/productos/${productId}`);
    setProducts(prev => prev.filter(p => p.id_producto !== productId));
  };

  const getProductById = (productId: string) => products.find(p => p.id_producto === productId);

  const updateStock = async (productId: string, quantityChange: number): Promise<void> => {
    const product = getProductById(productId);
    if (!product) throw new Error('Producto no encontrado');

    await updateProduct(productId, { stock: product.stock + quantityChange });
  };

  // Product category operations
  const addProductCategory = async (categoryData: CategoriaProductoForm): Promise<CategoriaProducto> => {
    const newCategory = await apiPost<CategoriaProducto>('/categorias-productos', categoryData);
    setProductCategories(prev => [...prev, newCategory].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return newCategory;
  };

  const updateProductCategory = async (categoryId: string, categoryData: Partial<CategoriaProductoForm>): Promise<void> => {
    const updated = await apiPut<CategoriaProducto>(`/categorias-productos/${categoryId}`, categoryData);
    setProductCategories(prev => prev.map(c => c.id_categoria === categoryId ? updated : c).sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  const deleteProductCategory = async (categoryId: string): Promise<void> => {
    await apiDelete(`/categorias-productos/${categoryId}`);
    setProductCategories(prev => prev.filter(c => c.id_categoria !== categoryId));
  };

  const getProductCategoryById = (categoryId: string) => productCategories.find(c => c.id_categoria === categoryId);

  // Venta operations
  const addVenta = async (ventaData: VentaFormValues): Promise<Venta> => {
    const newVenta = await apiPost<Venta>('/ventas', ventaData);

    setVentas(prev => [newVenta, ...prev].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    setProducts(prev => prev.map(p => {
      const line = newVenta.productos.find(vp => vp.producto_id === p.id_producto);
      return line ? { ...p, stock: p.stock - line.cantidad, lastModified: Date.now() } : p;
    }));

    return newVenta;
  };

  const updateVentaStatus = async (ventaId: string, status: EstadoVenta): Promise<void> => {
    const updated = await apiPatch<Venta>(`/ventas/${ventaId}/estado`, { estado: status });
    setVentas(prev => prev.map(v => v.id_venta === ventaId ? updated : v));
  };

  const getVentaById = (ventaId: string) => ventas.find(v => v.id_venta === ventaId);

  // Payment operations
  const addPayment = async (ventaId: string, monto: number, metodo: MetodoPago): Promise<Pago> => {
    const venta = getVentaById(ventaId);
    if (!venta) throw new Error("Venta no encontrada para el pago");

    const newPayment = await apiPost<Pago>(`/ventas/${ventaId}/pagos`, { monto, metodo });
    setPayments(prev => [newPayment, ...prev]);

    const allVentaPayments = [...payments, newPayment].filter(p => p.venta_id === ventaId);
    const totalPaid = allVentaPayments.reduce((sum, p) => sum + p.monto, 0);

    if (totalPaid >= venta.total) {
      setVentas(prev => prev.map(v => v.id_venta === ventaId ? { ...v, estado: EstadoVenta.PAGADA, lastModified: Date.now() } : v));
    }

    return newPayment;
  };

  const getPaymentsByVentaId = (ventaId: string) => payments.filter(p => p.venta_id === ventaId);

  // Medical history operations
  const addMedicalHistoryEvent = async (
    petId: string,
    type: TipoEventoHistorial,
    description: string,
    referenceId?: string,
    eventDateTime?: string,
    files?: File[]
  ): Promise<HistorialMedico> => {
    let newEvent = await apiPost<HistorialMedico>('/historial-medico', {
      mascota_id: petId,
      fecha: eventDateTime || new Date().toISOString(),
      tipo_evento: type,
      descripcion: description,
      referencia_id: referenceId,
    });

    if (files && files.length > 0) {
      const uploaded: AttachmentFile[] = [];
      for (const file of files) {
        uploaded.push(await apiUpload<AttachmentFile>(`/historial-medico/${newEvent.id_evento}/attachments`, file));
      }
      newEvent = { ...newEvent, attachments: uploaded };
    }

    setMedicalHistory(prev => [newEvent, ...prev].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    return newEvent;
  };

  const getMedicalHistoryByPetId = (petId: string) =>
    medicalHistory.filter(mh => mh.mascota_id === petId).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const deleteMedicalHistoryEvent = async (eventId: string): Promise<void> => {
    await apiDelete(`/historial-medico/${eventId}`);
    setMedicalHistory(prev => prev.filter(event => event.id_evento !== eventId));
  };

  const updateMedicalHistoryEvent = async (eventId: string, updatedData: Partial<Pick<HistorialMedico, 'fecha' | 'descripcion'>>): Promise<void> => {
    const updated = await apiPut<HistorialMedico>(`/historial-medico/${eventId}`, updatedData);

    setMedicalHistory(prev =>
      prev.map(event => event.id_evento === eventId ? updated : event)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    );
  };

  const addAttachmentToEvent = async (eventId: string, file: File): Promise<AttachmentFile> => {
    const attachment = await apiUpload<AttachmentFile>(`/historial-medico/${eventId}/attachments`, file);

    setMedicalHistory(prev => prev.map(event =>
      event.id_evento === eventId
        ? { ...event, attachments: [...(event.attachments || []), attachment] }
        : event
    ));

    return attachment;
  };

  const deleteAttachment = async (attachmentId: string, eventId: string): Promise<void> => {
    await apiDelete(`/attachments/${attachmentId}`);

    setMedicalHistory(prev => prev.map(event =>
      event.id_evento === eventId
        ? { ...event, attachments: (event.attachments || []).filter(a => a.id !== attachmentId) }
        : event
    ));
  };

  // Breed operations
  const addBreed = async (breedData: RazaForm): Promise<Raza> => {
    const newBreed = await apiPost<Raza>('/razas', breedData);
    setBreeds(prev => [...prev, newBreed].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return newBreed;
  };

  const updateBreed = async (breedId: string, breedData: Partial<RazaForm>): Promise<void> => {
    const updated = await apiPut<Raza>(`/razas/${breedId}`, breedData);
    setBreeds(prev => prev.map(b => b.id_raza === breedId ? updated : b).sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  const deleteBreed = async (breedId: string): Promise<void> => {
    await apiDelete(`/razas/${breedId}`);
    setBreeds(prev => prev.filter(b => b.id_raza !== breedId));
  };

  const getBreedById = (breedId: string) => breeds.find(b => b.id_raza === breedId);

  // Disease operations
  const addDisease = async (diseaseData: EnfermedadForm): Promise<Enfermedad> => {
    const newDisease = await apiPost<Enfermedad>('/enfermedades', diseaseData);
    setDiseases(prev => [...prev, newDisease].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return newDisease;
  };

  const updateDisease = async (diseaseId: string, diseaseData: Partial<EnfermedadForm>): Promise<void> => {
    const updated = await apiPut<Enfermedad>(`/enfermedades/${diseaseId}`, diseaseData);
    setDiseases(prev => prev.map(d => d.id_enfermedad === diseaseId ? updated : d).sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  const deleteDisease = async (diseaseId: string): Promise<void> => {
    await apiDelete(`/enfermedades/${diseaseId}`);
    setDiseases(prev => prev.filter(d => d.id_enfermedad !== diseaseId));
  };

  // Surgery operations
  const addSurgery = async (surgeryData: CirugiaForm): Promise<Cirugia> => {
    const newSurgery = await apiPost<Cirugia>('/cirugias', surgeryData);
    setSurgeries(prev => [...prev, newSurgery].sort((a, b) => a.tipo.localeCompare(b.tipo)));
    return newSurgery;
  };

  const updateSurgery = async (surgeryId: string, surgeryData: Partial<CirugiaForm>): Promise<void> => {
    const updated = await apiPut<Cirugia>(`/cirugias/${surgeryId}`, surgeryData);
    setSurgeries(prev => prev.map(s => s.id_cirugia === surgeryId ? updated : s).sort((a, b) => a.tipo.localeCompare(b.tipo)));
  };

  const deleteSurgery = async (surgeryId: string): Promise<void> => {
    await apiDelete(`/cirugias/${surgeryId}`);
    setSurgeries(prev => prev.filter(s => s.id_cirugia !== surgeryId));
  };

  // Pet disease/surgery operations
  const recordPetDisease = async (petId: string, diseaseId: string, date: string, notes: string, customEventDateTime?: string): Promise<MascotaEnfermedad> => {
    const newPetDisease = await apiPost<MascotaEnfermedad>(`/mascotas/${petId}/enfermedades`, {
      enfermedad_id: diseaseId,
      fecha_diagnostico: date,
      observaciones: notes,
    });
    setPetDiseases(prev => [...prev, newPetDisease]);

    const disease = diseases.find(d => d.id_enfermedad === diseaseId);
    const description = `Diagnóstico: ${disease?.nombre || 'Desconocida'}. Observaciones: ${notes}`;
    const eventDateTimeForHistory = customEventDateTime || `${date} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;

    await addMedicalHistoryEvent(petId, TipoEventoHistorial.ENFERMEDAD_REGISTRADA, description, newPetDisease.id_mascota_enfermedad, eventDateTimeForHistory);

    return newPetDisease;
  };

  const recordPetSurgery = async (petId: string, surgeryId: string, date: string, notes: string, cost?: number, customEventDateTime?: string): Promise<MascotaCirugia> => {
    const newPetSurgery = await apiPost<MascotaCirugia>(`/mascotas/${petId}/cirugias`, {
      cirugia_id: surgeryId,
      fecha: date,
      observaciones: notes,
      costo_final: cost,
    });
    setPetSurgeries(prev => [...prev, newPetSurgery]);

    const surgery = surgeries.find(s => s.id_cirugia === surgeryId);
    const description = `Cirugía Realizada: ${surgery?.tipo || 'Desconocida'}. Observaciones: ${notes}${cost ? `. Costo: $${cost.toFixed(2)}` : ''}`;
    const eventDateTimeForHistory = customEventDateTime || `${date} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;

    await addMedicalHistoryEvent(petId, TipoEventoHistorial.CIRUGIA, description, newPetSurgery.id_mascota_cirugia, eventDateTimeForHistory);

    return newPetSurgery;
  };

  // Expense operations
  const addExpense = async (expenseData: GastoForm): Promise<Gasto> => {
    const newExpense = await apiPost<Gasto>('/gastos', expenseData);
    setExpenses(prev => [newExpense, ...prev].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    return newExpense;
  };

  const updateExpense = async (expenseId: string, expenseData: Partial<GastoForm>): Promise<void> => {
    const updated = await apiPut<Gasto>(`/gastos/${expenseId}`, expenseData);
    setExpenses(prev => prev.map(e => e.id_gasto === expenseId ? updated : e).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
  };

  const deleteExpense = async (expenseId: string): Promise<void> => {
    await apiDelete(`/gastos/${expenseId}`);
    setExpenses(prev => prev.filter(e => e.id_gasto !== expenseId));
  };

  // Reports
  const getDailyCashFlowReport = (targetDateString: string): DailyCashFlowReportDetails => {
    const targetDate = targetDateString; // Ensure it's YYYY-MM-DD

    const incomeByMethod: { [key in MetodoPago]?: number } = {};
    let totalIncome = 0;

    payments
      .filter(p => p.fecha.split('T')[0] === targetDate)
      .forEach(p => {
        incomeByMethod[p.metodo] = (incomeByMethod[p.metodo] || 0) + p.monto;
        totalIncome += p.monto;
      });

    const expensesByCategory: { [key in CategoriaGasto]?: number } = {};
    let totalExpenses = 0;

    expenses
      .filter(e => e.fecha === targetDate)
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

  // Print functionality
  const printContent = async (content: React.ReactNode, filename: string = 'documento.pdf') => {
    setPrintableContentForPortal(content);
    document.body.classList.add('printing');

    await new Promise(resolve => setTimeout(resolve, 300));

    const printableElement = document.getElementById('print-root')?.querySelector('.printable-area') as HTMLElement;

    if (!printableElement) {
      console.error("Elemento para imprimir '.printable-area' no encontrado en '#print-root'.");
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

  const value: SupabaseDataContextType = {
    clients, pets, appointments, products, ventas, payments, medicalHistory, breeds, diseases, surgeries, petDiseases, petSurgeries, expenses, productCategories,
    loading, error,
    addClient, updateClient, deleteClient, getClientById,
    addPet, updatePet, deletePet, getPetsByClientId, getPetById,
    addAppointment, updateAppointment, deleteAppointment, getAppointmentsByPetId, getUpcomingAppointments,
    addProduct, updateProduct, deleteProduct, getProductById, updateStock,
    addProductCategory, updateProductCategory, deleteProductCategory, getProductCategoryById,
    addVenta, updateVentaStatus, getVentaById,
    addPayment, getPaymentsByVentaId,
    addMedicalHistoryEvent, getMedicalHistoryByPetId, deleteMedicalHistoryEvent, updateMedicalHistoryEvent,
    addAttachmentToEvent, deleteAttachment,
    addBreed, updateBreed, deleteBreed, getBreedById,
    addDisease, updateDisease, deleteDisease,
    addSurgery, updateSurgery, deleteSurgery,
    recordPetDisease, recordPetSurgery,
    addExpense, updateExpense, deleteExpense,
    getDailyCashFlowReport,
    printContent,
    printableContentForPortal,
    refreshData
  };

  return (
    <SupabaseDataContext.Provider value={value}>
      {children}
    </SupabaseDataContext.Provider>
  );
};

export const useSupabaseData = (): SupabaseDataContextType => {
  const context = useContext(SupabaseDataContext);
  if (context === undefined) {
    throw new Error('useSupabaseData must be used within a SupabaseDataProvider');
  }
  return context;
};
