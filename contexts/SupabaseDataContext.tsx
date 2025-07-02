import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import {
  Cliente, Mascota, Turno, Producto, Venta, Pago, HistorialMedico, Raza, Enfermedad, Cirugia, Gasto,
  MascotaEnfermedad, MascotaCirugia, ClienteForm, MascotaForm, TurnoForm, ProductoForm,
  VentaFormValues, EstadoVenta, MetodoPago, TipoEventoHistorial, Especie, RazaForm, EnfermedadForm, CirugiaForm, GastoForm, CategoriaGasto, EstadoTurno,
  DailyCashFlowReportDetails, AttachmentFile, CategoriaProducto, CategoriaProductoForm
} from '../types';

type Tables = Database['public']['Tables'];

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
    attachments?: AttachmentFile[]
  ) => Promise<HistorialMedico>;
  getMedicalHistoryByPetId: (petId: string) => HistorialMedico[];
  deleteMedicalHistoryEvent: (eventId: string) => Promise<void>;
  updateMedicalHistoryEvent: (eventId: string, updatedData: Partial<Pick<HistorialMedico, 'fecha' | 'descripcion' | 'attachments'>>) => Promise<void>;

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

// Helper functions
const transformSupabaseClient = (row: Tables['clientes']['Row']): Cliente => ({
  id_cliente: row.id_cliente,
  nombre: row.nombre,
  telefono: row.telefono,
  email: row.email || '',
  domicilio: row.domicilio || '',
  lastModified: new Date(row.updated_at || row.created_at || '').getTime()
});

const transformSupabasePet = (row: Tables['mascotas']['Row']): Mascota => ({
  id_mascota: row.id_mascota,
  nombre: row.nombre,
  especie: row.especie as Especie,
  raza_id: row.raza_id || '',
  id_cliente: row.id_cliente || '',
  fecha_nacimiento: row.fecha_nacimiento,
  sexo: row.sexo as any,
  lastModified: new Date(row.updated_at || row.created_at || '').getTime()
});

const transformSupabaseAppointment = (row: Tables['turnos']['Row']): Turno => ({
  id_turno: row.id_turno,
  fecha: row.fecha,
  hora: row.hora,
  cliente_id: row.cliente_id || '',
  mascota_id: row.mascota_id || '',
  motivo: row.motivo,
  estado: row.estado as EstadoTurno,
  lastModified: new Date(row.updated_at || row.created_at || '').getTime()
});

const transformSupabaseProduct = (row: Tables['productos']['Row']): Producto => ({
  id_producto: row.id_producto,
  nombre: row.nombre,
  stock: row.stock,
  precio: Number(row.precio),
  categoria: row.categoria,
  categoria_id: row.categoria_id || undefined,
  lastModified: new Date(row.updated_at || row.created_at || '').getTime()
});

const transformSupabaseProductCategory = (row: Tables['categorias_productos']['Row']): CategoriaProducto => ({
  id_categoria: row.id_categoria,
  nombre: row.nombre,
  descripcion: row.descripcion || '',
  activa: row.activa || true
});

const transformSupabaseVenta = (row: Tables['ventas']['Row'], productos: any[]): Venta => ({
  id_venta: row.id_venta,
  fecha: row.fecha,
  cliente_id: row.cliente_id || '',
  mascota_id: row.mascota_id || undefined,
  productos: productos.map(p => ({
    producto_id: p.producto_id,
    cantidad: p.cantidad,
    precio_unitario: Number(p.precio_unitario)
  })),
  total: Number(row.total),
  estado: row.estado as EstadoVenta,
  lastModified: new Date(row.updated_at || row.created_at || '').getTime()
});

const transformSupabasePayment = (row: Tables['pagos']['Row']): Pago => ({
  id_pago: row.id_pago,
  venta_id: row.venta_id || '',
  monto: Number(row.monto),
  fecha: row.fecha,
  metodo: row.metodo as MetodoPago,
  lastModified: new Date(row.created_at || '').getTime()
});

const transformSupabaseBreed = (row: Tables['razas']['Row']): Raza => ({
  id_raza: row.id_raza,
  nombre: row.nombre,
  especie: row.especie as Especie
});

const transformSupabaseDisease = (row: Tables['enfermedades']['Row']): Enfermedad => ({
  id_enfermedad: row.id_enfermedad,
  nombre: row.nombre,
  descripcion: row.descripcion,
  especie_afectada: row.especie_afectada as Especie | undefined
});

const transformSupabaseSurgery = (row: Tables['cirugias']['Row']): Cirugia => ({
  id_cirugia: row.id_cirugia,
  tipo: row.tipo,
  descripcion: row.descripcion,
  duracion_estimada_min: row.duracion_estimada_min,
  costo_estimado: Number(row.costo_estimado)
});

const transformSupabaseMedicalHistory = (row: Tables['historial_medico']['Row']): HistorialMedico => ({
  id_evento: row.id_evento,
  mascota_id: row.mascota_id || '',
  fecha: row.fecha,
  tipo_evento: row.tipo_evento as TipoEventoHistorial,
  descripcion: row.descripcion,
  referencia_id: row.referencia_id || undefined,
  attachments: (row.attachments as AttachmentFile[]) || [],
  lastModified: new Date(row.updated_at || row.created_at || '').getTime()
});

const transformSupabasePetDisease = (row: Tables['mascota_enfermedades']['Row']): MascotaEnfermedad => ({
  id_mascota_enfermedad: row.id_mascota_enfermedad,
  mascota_id: row.mascota_id || '',
  enfermedad_id: row.enfermedad_id || '',
  fecha_diagnostico: row.fecha_diagnostico,
  observaciones: row.observaciones || '',
  lastModified: new Date(row.updated_at || row.created_at || '').getTime()
});

const transformSupabasePetSurgery = (row: Tables['mascota_cirugias']['Row']): MascotaCirugia => ({
  id_mascota_cirugia: row.id_mascota_cirugia,
  mascota_id: row.mascota_id || '',
  cirugia_id: row.cirugia_id || '',
  fecha: row.fecha,
  observaciones: row.observaciones || '',
  costo_final: row.costo_final ? Number(row.costo_final) : undefined,
  lastModified: new Date(row.updated_at || row.created_at || '').getTime()
});

const transformSupabaseExpense = (row: Tables['gastos']['Row']): Gasto => ({
  id_gasto: row.id_gasto,
  fecha: row.fecha,
  descripcion: row.descripcion,
  monto: Number(row.monto),
  categoria: row.categoria as CategoriaGasto,
  lastModified: new Date(row.updated_at || row.created_at || '').getTime()
});

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

      // Load all data in parallel
      const [
        clientsResult,
        petsResult,
        appointmentsResult,
        productsResult,
        ventasResult,
        paymentsResult,
        medicalHistoryResult,
        breedsResult,
        diseasesResult,
        surgeriesResult,
        petDiseasesResult,
        petSurgeriesResult,
        expensesResult,
        productCategoriesResult
      ] = await Promise.all([
        supabase.from('clientes').select('*').order('nombre'),
        supabase.from('mascotas').select('*').order('nombre'),
        supabase.from('turnos').select('*').order('fecha', { ascending: false }),
        supabase.from('productos').select('*').order('nombre'),
        supabase.from('ventas').select(`
          *,
          venta_productos (
            producto_id,
            cantidad,
            precio_unitario
          )
        `).order('fecha', { ascending: false }),
        supabase.from('pagos').select('*').order('fecha', { ascending: false }),
        supabase.from('historial_medico').select('*').order('fecha', { ascending: false }),
        supabase.from('razas').select('*').order('nombre'),
        supabase.from('enfermedades').select('*').order('nombre'),
        supabase.from('cirugias').select('*').order('tipo'),
        supabase.from('mascota_enfermedades').select('*'),
        supabase.from('mascota_cirugias').select('*'),
        supabase.from('gastos').select('*').order('fecha', { ascending: false }),
        supabase.from('categorias_productos').select('*').order('nombre')
      ]);

      // Check for errors
      const results = [
        clientsResult, petsResult, appointmentsResult, productsResult,
        ventasResult, paymentsResult, medicalHistoryResult, breedsResult,
        diseasesResult, surgeriesResult, petDiseasesResult, petSurgeriesResult,
        expensesResult, productCategoriesResult
      ];

      for (const result of results) {
        if (result.error) {
          throw result.error;
        }
      }

      // Transform and set data
      setClients(clientsResult.data?.map(transformSupabaseClient) || []);
      setPets(petsResult.data?.map(transformSupabasePet) || []);
      setAppointments(appointmentsResult.data?.map(transformSupabaseAppointment) || []);
      setProducts(productsResult.data?.map(transformSupabaseProduct) || []);
      setVentas(ventasResult.data?.map(row => transformSupabaseVenta(row, row.venta_productos || [])) || []);
      setPayments(paymentsResult.data?.map(transformSupabasePayment) || []);
      setMedicalHistory(medicalHistoryResult.data?.map(transformSupabaseMedicalHistory) || []);
      setBreeds(breedsResult.data?.map(transformSupabaseBreed) || []);
      setDiseases(diseasesResult.data?.map(transformSupabaseDisease) || []);
      setSurgeries(surgeriesResult.data?.map(transformSupabaseSurgery) || []);
      setPetDiseases(petDiseasesResult.data?.map(transformSupabasePetDisease) || []);
      setPetSurgeries(petSurgeriesResult.data?.map(transformSupabasePetSurgery) || []);
      setExpenses(expensesResult.data?.map(transformSupabaseExpense) || []);
      setProductCategories(productCategoriesResult.data?.map(transformSupabaseProductCategory) || []);

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
    const { data, error } = await supabase
      .from('clientes')
      .insert([clientData])
      .select()
      .single();

    if (error) throw error;
    
    const newClient = transformSupabaseClient(data);
    setClients(prev => [...prev, newClient].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return newClient;
  };

  const updateClient = async (clientId: string, clientData: Partial<ClienteForm>): Promise<void> => {
    const { error } = await supabase
      .from('clientes')
      .update({ ...clientData, updated_at: new Date().toISOString() })
      .eq('id_cliente', clientId);

    if (error) throw error;

    setClients(prev => prev.map(c => 
      c.id_cliente === clientId 
        ? { ...c, ...clientData, lastModified: Date.now() }
        : c
    ));
  };

  const deleteClient = async (clientId: string): Promise<void> => {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id_cliente', clientId);

    if (error) throw error;

    setClients(prev => prev.filter(c => c.id_cliente !== clientId));
    setPets(prev => prev.filter(p => p.id_cliente !== clientId));
    setAppointments(prev => prev.filter(a => a.cliente_id !== clientId));
    setVentas(prev => prev.filter(v => v.cliente_id !== clientId));
  };

  const getClientById = (clientId: string) => clients.find(c => c.id_cliente === clientId);

  // Pet operations
  const addPet = async (petData: MascotaForm): Promise<Mascota> => {
    const { data, error } = await supabase
      .from('mascotas')
      .insert([petData])
      .select()
      .single();

    if (error) throw error;
    
    const newPet = transformSupabasePet(data);
    setPets(prev => [...prev, newPet].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return newPet;
  };

  const updatePet = async (petId: string, petData: Partial<MascotaForm>): Promise<void> => {
    const { error } = await supabase
      .from('mascotas')
      .update({ ...petData, updated_at: new Date().toISOString() })
      .eq('id_mascota', petId);

    if (error) throw error;

    setPets(prev => prev.map(p => 
      p.id_mascota === petId 
        ? { ...p, ...petData, lastModified: Date.now() }
        : p
    ));
  };

  const deletePet = async (petId: string): Promise<void> => {
    const { error } = await supabase
      .from('mascotas')
      .delete()
      .eq('id_mascota', petId);

    if (error) throw error;

    setPets(prev => prev.filter(p => p.id_mascota !== petId));
    setAppointments(prev => prev.filter(a => a.mascota_id !== petId));
    setMedicalHistory(prev => prev.filter(mh => mh.mascota_id !== petId));
    setVentas(prev => prev.map(v => v.mascota_id === petId ? {...v, mascota_id: undefined} : v));
  };

  const getPetsByClientId = (clientId: string) => pets.filter(p => p.id_cliente === clientId);
  const getPetById = (petId: string) => pets.find(p => p.id_mascota === petId);

  // Appointment operations
  const addAppointment = async (appointmentData: TurnoForm): Promise<Turno> => {
    const { data, error } = await supabase
      .from('turnos')
      .insert([{ ...appointmentData, estado: 'Pendiente' }])
      .select()
      .single();

    if (error) throw error;
    
    const newAppointment = transformSupabaseAppointment(data);
    setAppointments(prev => [newAppointment, ...prev].sort((a, b) => {
      const dateA = new Date(`${a.fecha}T${a.hora}`).getTime();
      const dateB = new Date(`${b.fecha}T${b.hora}`).getTime();
      return dateA - dateB;
    }));
    return newAppointment;
  };

  const updateAppointment = async (appointmentId: string, appointmentData: Partial<TurnoForm & { estado: EstadoTurno }>): Promise<void> => {
    const { error } = await supabase
      .from('turnos')
      .update({ ...appointmentData, updated_at: new Date().toISOString() })
      .eq('id_turno', appointmentId);

    if (error) throw error;

    setAppointments(prev => prev.map(a => 
      a.id_turno === appointmentId 
        ? { ...a, ...appointmentData, lastModified: Date.now() }
        : a
    ).sort((a, b) => {
      const dateA = new Date(`${a.fecha}T${a.hora}`).getTime();
      const dateB = new Date(`${b.fecha}T${b.hora}`).getTime();
      return dateA - dateB;
    }));
  };

  const deleteAppointment = async (appointmentId: string): Promise<void> => {
    const { error } = await supabase
      .from('turnos')
      .delete()
      .eq('id_turno', appointmentId);

    if (error) throw error;

    setAppointments(prev => prev.filter(a => a.id_turno !== appointmentId));
  };

  const getAppointmentsByPetId = (petId: string) => appointments.filter(a => a.mascota_id === petId);
  
  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments
      .filter(a => a.estado === EstadoTurno.PENDIENTE && new Date(a.fecha + 'T' + a.hora) >= new Date(now.setHours(0,0,0,0)))
      .sort((a,b) => new Date(a.fecha + 'T' + a.hora).getTime() - new Date(b.fecha + 'T' + b.hora).getTime());
  };

  // Product operations
  const addProduct = async (productData: ProductoForm): Promise<Producto> => {
    const { data, error } = await supabase
      .from('productos')
      .insert([productData])
      .select()
      .single();

    if (error) throw error;
    
    const newProduct = transformSupabaseProduct(data);
    setProducts(prev => [...prev, newProduct].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return newProduct;
  };

  const updateProduct = async (productId: string, productData: Partial<ProductoForm>): Promise<void> => {
    const { error } = await supabase
      .from('productos')
      .update({ ...productData, updated_at: new Date().toISOString() })
      .eq('id_producto', productId);

    if (error) throw error;

    setProducts(prev => prev.map(p => 
      p.id_producto === productId 
        ? { ...p, ...productData, lastModified: Date.now() }
        : p
    ));
  };

  const deleteProduct = async (productId: string): Promise<void> => {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id_producto', productId);

    if (error) throw error;

    setProducts(prev => prev.filter(p => p.id_producto !== productId));
  };

  const getProductById = (productId: string) => products.find(p => p.id_producto === productId);

  const updateStock = async (productId: string, quantityChange: number): Promise<void> => {
    const product = getProductById(productId);
    if (!product) throw new Error('Producto no encontrado');

    const newStock = product.stock + quantityChange;
    await updateProduct(productId, { stock: newStock });
  };

  // Product category operations
  const addProductCategory = async (categoryData: CategoriaProductoForm): Promise<CategoriaProducto> => {
    const { data, error } = await supabase
      .from('categorias_productos')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;
    
    const newCategory = transformSupabaseProductCategory(data);
    setProductCategories(prev => [...prev, newCategory].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return newCategory;
  };

  const updateProductCategory = async (categoryId: string, categoryData: Partial<CategoriaProductoForm>): Promise<void> => {
    const { error } = await supabase
      .from('categorias_productos')
      .update({ ...categoryData, updated_at: new Date().toISOString() })
      .eq('id_categoria', categoryId);

    if (error) throw error;

    setProductCategories(prev => prev.map(c => 
      c.id_categoria === categoryId 
        ? { ...c, ...categoryData }
        : c
    ).sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  const deleteProductCategory = async (categoryId: string): Promise<void> => {
    const { error } = await supabase
      .from('categorias_productos')
      .delete()
      .eq('id_categoria', categoryId);

    if (error) throw error;

    setProductCategories(prev => prev.filter(c => c.id_categoria !== categoryId));
  };

  const getProductCategoryById = (categoryId: string) => productCategories.find(c => c.id_categoria === categoryId);

  // Venta operations
  const addVenta = async (ventaData: VentaFormValues): Promise<Venta> => {
    let total = 0;
    const ventaProducts = ventaData.productos.map(item => {
      const product = getProductById(item.producto_id);
      if (!product) throw new Error("Producto no encontrado");
      if (product.stock < item.cantidad) throw new Error(`Stock insuficiente para ${product.nombre}`);
      total += product.precio * item.cantidad;
      return { producto_id: item.producto_id, cantidad: item.cantidad, precio_unitario: product.precio };
    });

    // Create venta
    const { data: ventaResult, error: ventaError } = await supabase
      .from('ventas')
      .insert([{
        cliente_id: ventaData.cliente_id,
        mascota_id: ventaData.mascota_id,
        total: parseFloat(total.toFixed(2)),
        estado: 'Pendiente'
      }])
      .select()
      .single();

    if (ventaError) throw ventaError;

    // Create venta products
    const ventaProductsToInsert = ventaProducts.map(item => ({
      venta_id: ventaResult.id_venta,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario
    }));

    const { error: productsError } = await supabase
      .from('venta_productos')
      .insert(ventaProductsToInsert);

    if (productsError) throw productsError;

    // Update stock
    for (const item of ventaProducts) {
      await updateStock(item.producto_id, -item.cantidad);
    }

    const newVenta = transformSupabaseVenta(ventaResult, ventaProducts);
    setVentas(prev => [newVenta, ...prev].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    return newVenta;
  };

  const updateVentaStatus = async (ventaId: string, status: EstadoVenta): Promise<void> => {
    const { error } = await supabase
      .from('ventas')
      .update({ estado: status, updated_at: new Date().toISOString() })
      .eq('id_venta', ventaId);

    if (error) throw error;

    setVentas(prev => prev.map(v => 
      v.id_venta === ventaId 
        ? { ...v, estado: status, lastModified: Date.now() }
        : v
    ));
  };

  const getVentaById = (ventaId: string) => ventas.find(v => v.id_venta === ventaId);

  // Payment operations
  const addPayment = async (ventaId: string, monto: number, metodo: MetodoPago): Promise<Pago> => {
    const venta = getVentaById(ventaId);
    if (!venta) throw new Error("Venta no encontrada para el pago");

    const { data, error } = await supabase
      .from('pagos')
      .insert([{
        venta_id: ventaId,
        monto: monto,
        metodo: metodo
      }])
      .select()
      .single();

    if (error) throw error;

    const newPayment = transformSupabasePayment(data);
    setPayments(prev => [newPayment, ...prev]);

    const allVentaPayments = [...payments, newPayment].filter(p => p.venta_id === ventaId);
    const totalPaid = allVentaPayments.reduce((sum, p) => sum + p.monto, 0);

    if (totalPaid >= venta.total) {
      await updateVentaStatus(ventaId, EstadoVenta.PAGADA);
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
    attachments?: AttachmentFile[]
  ): Promise<HistorialMedico> => {
    const { data, error } = await supabase
      .from('historial_medico')
      .insert([{
        mascota_id: petId,
        fecha: eventDateTime || new Date().toISOString(),
        tipo_evento: type,
        descripcion: description,
        referencia_id: referenceId,
        attachments: attachments || []
      }])
      .select()
      .single();

    if (error) throw error;

    const newEvent = transformSupabaseMedicalHistory(data);
    setMedicalHistory(prev => [newEvent, ...prev].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    return newEvent;
  };

  const getMedicalHistoryByPetId = (petId: string) => 
    medicalHistory.filter(mh => mh.mascota_id === petId).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const deleteMedicalHistoryEvent = async (eventId: string): Promise<void> => {
    const { error } = await supabase
      .from('historial_medico')
      .delete()
      .eq('id_evento', eventId);

    if (error) throw error;

    setMedicalHistory(prev => prev.filter(event => event.id_evento !== eventId));
  };

  const updateMedicalHistoryEvent = async (eventId: string, updatedData: Partial<Pick<HistorialMedico, 'fecha' | 'descripcion' | 'attachments'>>): Promise<void> => {
    const { error } = await supabase
      .from('historial_medico')
      .update({ ...updatedData, updated_at: new Date().toISOString() })
      .eq('id_evento', eventId);

    if (error) throw error;

    setMedicalHistory(prev =>
      prev.map(event =>
        event.id_evento === eventId
          ? { ...event, ...updatedData, lastModified: Date.now() }
          : event
      ).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    );
  };

  // Breed operations
  const addBreed = async (breedData: RazaForm): Promise<Raza> => {
    const { data, error } = await supabase
      .from('razas')
      .insert([breedData])
      .select()
      .single();

    if (error) throw error;
    
    const newBreed = transformSupabaseBreed(data);
    setBreeds(prev => [...prev, newBreed].sort((a,b) => a.nombre.localeCompare(b.nombre)));
    return newBreed;
  };

  const updateBreed = async (breedId: string, breedData: Partial<RazaForm>): Promise<void> => {
    const { error } = await supabase
      .from('razas')
      .update(breedData)
      .eq('id_raza', breedId);

    if (error) throw error;

    setBreeds(prev => prev.map(b => 
      b.id_raza === breedId 
        ? { ...b, ...breedData }
        : b
    ).sort((a,b) => a.nombre.localeCompare(b.nombre)));
  };

  const deleteBreed = async (breedId: string): Promise<void> => {
    const { error } = await supabase
      .from('razas')
      .delete()
      .eq('id_raza', breedId);

    if (error) throw error;

    setBreeds(prev => prev.filter(b => b.id_raza !== breedId));
  };

  const getBreedById = (breedId: string) => breeds.find(b => b.id_raza === breedId);

  // Disease operations
  const addDisease = async (diseaseData: EnfermedadForm): Promise<Enfermedad> => {
    const { data, error } = await supabase
      .from('enfermedades')
      .insert([diseaseData])
      .select()
      .single();

    if (error) throw error;
    
    const newDisease = transformSupabaseDisease(data);
    setDiseases(prev => [...prev, newDisease].sort((a,b) => a.nombre.localeCompare(b.nombre)));
    return newDisease;
  };

  const updateDisease = async (diseaseId: string, diseaseData: Partial<EnfermedadForm>): Promise<void> => {
    const { error } = await supabase
      .from('enfermedades')
      .update(diseaseData)
      .eq('id_enfermedad', diseaseId);

    if (error) throw error;

    setDiseases(prev => prev.map(d => 
      d.id_enfermedad === diseaseId 
        ? { ...d, ...diseaseData }
        : d
    ).sort((a,b) => a.nombre.localeCompare(b.nombre)));
  };

  const deleteDisease = async (diseaseId: string): Promise<void> => {
    const { error } = await supabase
      .from('enfermedades')
      .delete()
      .eq('id_enfermedad', diseaseId);

    if (error) throw error;

    setDiseases(prev => prev.filter(d => d.id_enfermedad !== diseaseId));
  };

  // Surgery operations
  const addSurgery = async (surgeryData: CirugiaForm): Promise<Cirugia> => {
    const { data, error } = await supabase
      .from('cirugias')
      .insert([surgeryData])
      .select()
      .single();

    if (error) throw error;
    
    const newSurgery = transformSupabaseSurgery(data);
    setSurgeries(prev => [...prev, newSurgery].sort((a,b) => a.tipo.localeCompare(b.tipo)));
    return newSurgery;
  };

  const updateSurgery = async (surgeryId: string, surgeryData: Partial<CirugiaForm>): Promise<void> => {
    const { error } = await supabase
      .from('cirugias')
      .update(surgeryData)
      .eq('id_cirugia', surgeryId);

    if (error) throw error;

    setSurgeries(prev => prev.map(s => 
      s.id_cirugia === surgeryId 
        ? { ...s, ...surgeryData }
        : s
    ).sort((a,b) => a.tipo.localeCompare(b.tipo)));
  };

  const deleteSurgery = async (surgeryId: string): Promise<void> => {
    const { error } = await supabase
      .from('cirugias')
      .delete()
      .eq('id_cirugia', surgeryId);

    if (error) throw error;

    setSurgeries(prev => prev.filter(s => s.id_cirugia !== surgeryId));
  };

  // Pet disease/surgery operations
  const recordPetDisease = async (petId: string, diseaseId: string, date: string, notes: string, customEventDateTime?: string): Promise<MascotaEnfermedad> => {
    const { data, error } = await supabase
      .from('mascota_enfermedades')
      .insert([{
        mascota_id: petId,
        enfermedad_id: diseaseId,
        fecha_diagnostico: date,
        observaciones: notes
      }])
      .select()
      .single();

    if (error) throw error;

    const newPetDisease = transformSupabasePetDisease(data);
    setPetDiseases(prev => [...prev, newPetDisease]);

    const disease = diseases.find(d => d.id_enfermedad === diseaseId);
    const description = `Diagnóstico: ${disease?.nombre || 'Desconocida'}. Observaciones: ${notes}`;
    const eventDateTimeForHistory = customEventDateTime || `${date} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    
    await addMedicalHistoryEvent(petId, TipoEventoHistorial.ENFERMEDAD_REGISTRADA, description, newPetDisease.id_mascota_enfermedad, eventDateTimeForHistory);
    
    return newPetDisease;
  };

  const recordPetSurgery = async (petId: string, surgeryId: string, date: string, notes: string, cost?: number, customEventDateTime?: string): Promise<MascotaCirugia> => {
    const { data, error } = await supabase
      .from('mascota_cirugias')
      .insert([{
        mascota_id: petId,
        cirugia_id: surgeryId,
        fecha: date,
        observaciones: notes,
        costo_final: cost
      }])
      .select()
      .single();

    if (error) throw error;

    const newPetSurgery = transformSupabasePetSurgery(data);
    setPetSurgeries(prev => [...prev, newPetSurgery]);

    const surgery = surgeries.find(s => s.id_cirugia === surgeryId);
    const description = `Cirugía Realizada: ${surgery?.tipo || 'Desconocida'}. Observaciones: ${notes}${cost ? `. Costo: $${cost.toFixed(2)}` : ''}`;
    const eventDateTimeForHistory = customEventDateTime || `${date} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    
    await addMedicalHistoryEvent(petId, TipoEventoHistorial.CIRUGIA, description, newPetSurgery.id_mascota_cirugia, eventDateTimeForHistory);
    
    return newPetSurgery;
  };

  // Expense operations
  const addExpense = async (expenseData: GastoForm): Promise<Gasto> => {
    const { data, error } = await supabase
      .from('gastos')
      .insert([expenseData])
      .select()
      .single();

    if (error) throw error;
    
    const newExpense = transformSupabaseExpense(data);
    setExpenses(prev => [newExpense, ...prev].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    return newExpense;
  };

  const updateExpense = async (expenseId: string, expenseData: Partial<GastoForm>): Promise<void> => {
    const { error } = await supabase
      .from('gastos')
      .update({ ...expenseData, updated_at: new Date().toISOString() })
      .eq('id_gasto', expenseId);

    if (error) throw error;

    setExpenses(prev => prev.map(e => 
      e.id_gasto === expenseId 
        ? { ...e, ...expenseData, lastModified: Date.now() }
        : e
    ).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
  };

  const deleteExpense = async (expenseId: string): Promise<void> => {
    const { error } = await supabase
      .from('gastos')
      .delete()
      .eq('id_gasto', expenseId);

    if (error) throw error;

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