import { Especie, Raza, Producto, Enfermedad, Cirugia, CategoriaGasto } from './types';

export const APP_TITLE = "VetAdmin";

export const ESPECIES: Especie[] = [
  Especie.PERRO,
  Especie.GATO,
  Especie.AVE,
  Especie.ROEDOR,
  Especie.REPTIL,
  Especie.OTRO,
];

export const RAZAS_PREDEFINIDAS: Raza[] = [
  { id_raza: 'raza_1', nombre: 'Labrador Retriever', especie: Especie.PERRO },
  { id_raza: 'raza_2', nombre: 'Bulldog Francés', especie: Especie.PERRO },
  { id_raza: 'raza_3', nombre: 'Golden Retriever', especie: Especie.PERRO },
  { id_raza: 'raza_4', nombre: 'Pastor Alemán', especie: Especie.PERRO },
  { id_raza: 'raza_5', nombre: 'Caniche', especie: Especie.PERRO },
  { id_raza: 'raza_6', nombre: 'Siamés', especie: Especie.GATO },
  { id_raza: 'raza_7', nombre: 'Persa', especie: Especie.GATO },
  { id_raza: 'raza_8', nombre: 'Maine Coon', especie: Especie.GATO },
  { id_raza: 'raza_9', nombre: 'Bengalí', especie: Especie.GATO },
  { id_raza: 'raza_10', nombre: 'Ragdoll', especie: Especie.GATO },
  { id_raza: 'raza_11', nombre: 'Común Europeo (Perro)', especie: Especie.PERRO },
  { id_raza: 'raza_12', nombre: 'Común Europeo (Gato)', especie: Especie.GATO },
  { id_raza: 'raza_13', nombre: 'Canario', especie: Especie.AVE },
  { id_raza: 'raza_14', nombre: 'Periquito', especie: Especie.AVE },
  { id_raza: 'raza_15', nombre: 'Hamster Sirio', especie: Especie.ROEDOR },
  { id_raza: 'raza_16', nombre: 'Cuy', especie: Especie.ROEDOR },
  { id_raza: 'raza_17', nombre: 'Iguana Verde', especie: Especie.REPTIL },
  { id_raza: 'raza_18', nombre: 'Gecko Leopardo', especie: Especie.REPTIL },
  { id_raza: 'raza_19', nombre: 'Otro Perro', especie: Especie.PERRO },
  { id_raza: 'raza_20', nombre: 'Otro Gato', especie: Especie.GATO },
  { id_raza: 'raza_21', nombre: 'Otra Ave', especie: Especie.AVE },
  { id_raza: 'raza_22', nombre: 'Otro Roedor', especie: Especie.ROEDOR },
  { id_raza: 'raza_23', nombre: 'Otro Reptil', especie: Especie.REPTIL },
  { id_raza: 'raza_24', nombre: 'No Aplica', especie: Especie.OTRO },
];

export const PRODUCTOS_INICIALES: Producto[] = [
    { id_producto: 'prod_1', nombre: 'Alimento Balanceado Perro Adulto 1kg', stock: 50, precio: 15.99, categoria: 'Alimentos', lastModified: Date.now() },
    { id_producto: 'prod_2', nombre: 'Alimento Balanceado Gato Adulto 1kg', stock: 40, precio: 17.50, categoria: 'Alimentos', lastModified: Date.now() },
    { id_producto: 'prod_3', nombre: 'Pipeta Antipulgas Perro Mediano', stock: 100, precio: 8.75, categoria: 'Salud', lastModified: Date.now() },
    { id_producto: 'prod_4', nombre: 'Juguete Pelota Goma', stock: 75, precio: 5.00, categoria: 'Accesorios', lastModified: Date.now() },
    { id_producto: 'prod_5', nombre: 'Shampoo Hipoalergénico 250ml', stock: 30, precio: 12.25, categoria: 'Higiene', lastModified: Date.now() },
];

export const ENFERMEDADES_INICIALES: Enfermedad[] = [
    { id_enfermedad: 'enf_1', nombre: 'Parvovirus Canino', descripcion: 'Enfermedad viral altamente contagiosa en cachorros.', especie_afectada: Especie.PERRO },
    { id_enfermedad: 'enf_2', nombre: 'Moquillo Canino', descripcion: 'Enfermedad viral multisistémica.', especie_afectada: Especie.PERRO },
    { id_enfermedad: 'enf_3', nombre: 'Insuficiencia Renal Crónica Felina', descripcion: 'Pérdida progresiva de la función renal en gatos.', especie_afectada: Especie.GATO },
    { id_enfermedad: 'enf_4', nombre: 'Otitis Externa', descripcion: 'Inflamación del conducto auditivo externo.', especie_afectada: Especie.PERRO }, // Can affect cats too, but more common in dogs
    { id_enfermedad: 'enf_5', nombre: 'Gripe Felina (Complejo Respiratorio Felino)', descripcion: 'Infección respiratoria común en gatos.', especie_afectada: Especie.GATO },
];

export const CIRUGIAS_INICIALES: Cirugia[] = [
    { id_cirugia: 'cir_1', tipo: 'Esterilización (Ovariohisterectomía)', descripcion: 'Extirpación de ovarios y útero en hembras.', duracion_estimada_min: 60, costo_estimado: 150 },
    { id_cirugia: 'cir_2', tipo: 'Castración (Orquiectomía)', descripcion: 'Extirpación de testículos en machos.', duracion_estimada_min: 30, costo_estimado: 100 },
    { id_cirugia: 'cir_3', tipo: 'Limpieza Dental', descripcion: 'Eliminación de sarro y placa bacteriana.', duracion_estimada_min: 45, costo_estimado: 80 },
    { id_cirugia: 'cir_4', tipo: 'Extracción de Cuerpo Extraño (Gastrointestinal)', descripcion: 'Remoción quirúrgica de objeto ingerido.', duracion_estimada_min: 90, costo_estimado: 300 },
];

export const CATEGORIAS_GASTO: CategoriaGasto[] = Object.values(CategoriaGasto);

// SVG Icon components are removed. lucide-react icons will be imported directly in components.
