import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const RAZAS = [
  { nombre: 'Labrador Retriever', especie: 'Perro' },
  { nombre: 'Bulldog Francés', especie: 'Perro' },
  { nombre: 'Golden Retriever', especie: 'Perro' },
  { nombre: 'Pastor Alemán', especie: 'Perro' },
  { nombre: 'Caniche', especie: 'Perro' },
  { nombre: 'Siamés', especie: 'Gato' },
  { nombre: 'Persa', especie: 'Gato' },
  { nombre: 'Maine Coon', especie: 'Gato' },
  { nombre: 'Bengalí', especie: 'Gato' },
  { nombre: 'Ragdoll', especie: 'Gato' },
  { nombre: 'Común Europeo (Perro)', especie: 'Perro' },
  { nombre: 'Común Europeo (Gato)', especie: 'Gato' },
  { nombre: 'Canario', especie: 'Ave' },
  { nombre: 'Periquito', especie: 'Ave' },
  { nombre: 'Hamster Sirio', especie: 'Roedor' },
  { nombre: 'Cuy', especie: 'Roedor' },
  { nombre: 'Iguana Verde', especie: 'Reptil' },
  { nombre: 'Gecko Leopardo', especie: 'Reptil' },
  { nombre: 'Otro Perro', especie: 'Perro' },
  { nombre: 'Otro Gato', especie: 'Gato' },
  { nombre: 'Otra Ave', especie: 'Ave' },
  { nombre: 'Otro Roedor', especie: 'Roedor' },
  { nombre: 'Otro Reptil', especie: 'Reptil' },
  { nombre: 'No Aplica', especie: 'Otro' },
]

const CATEGORIAS_PRODUCTOS = [
  { nombre: 'Alimentos', descripcion: 'Alimentos balanceados y snacks para mascotas' },
  { nombre: 'Salud', descripcion: 'Medicamentos, vitaminas y productos de salud' },
  { nombre: 'Accesorios', descripcion: 'Juguetes, correas, collares y accesorios' },
  { nombre: 'Higiene', descripcion: 'Productos de limpieza y cuidado personal' },
  { nombre: 'Equipamiento', descripcion: 'Equipos médicos y herramientas veterinarias' },
  { nombre: 'Suministros', descripcion: 'Materiales y suministros generales' },
]

const PRODUCTOS = [
  { nombre: 'Alimento Balanceado Perro Adulto 1kg', stock: 50, precio: 15.99, categoria: 'Alimentos' },
  { nombre: 'Alimento Balanceado Gato Adulto 1kg', stock: 40, precio: 17.50, categoria: 'Alimentos' },
  { nombre: 'Pipeta Antipulgas Perro Mediano', stock: 100, precio: 8.75, categoria: 'Salud' },
  { nombre: 'Juguete Pelota Goma', stock: 75, precio: 5.00, categoria: 'Accesorios' },
  { nombre: 'Shampoo Hipoalergénico 250ml', stock: 30, precio: 12.25, categoria: 'Higiene' },
]

const ENFERMEDADES = [
  { nombre: 'Parvovirus Canino', descripcion: 'Enfermedad viral altamente contagiosa en cachorros.', especieAfectada: 'Perro' },
  { nombre: 'Moquillo Canino', descripcion: 'Enfermedad viral multisistémica.', especieAfectada: 'Perro' },
  { nombre: 'Insuficiencia Renal Crónica Felina', descripcion: 'Pérdida progresiva de la función renal en gatos.', especieAfectada: 'Gato' },
  { nombre: 'Otitis Externa', descripcion: 'Inflamación del conducto auditivo externo.', especieAfectada: 'Perro' },
  { nombre: 'Gripe Felina (Complejo Respiratorio Felino)', descripcion: 'Infección respiratoria común en gatos.', especieAfectada: 'Gato' },
]

const CIRUGIAS = [
  { tipo: 'Esterilización (Ovariohisterectomía)', descripcion: 'Extirpación de ovarios y útero en hembras.', duracionEstimadaMin: 60, costoEstimado: 150 },
  { tipo: 'Castración (Orquiectomía)', descripcion: 'Extirpación de testículos en machos.', duracionEstimadaMin: 30, costoEstimado: 100 },
  { tipo: 'Limpieza Dental', descripcion: 'Eliminación de sarro y placa bacteriana.', duracionEstimadaMin: 45, costoEstimado: 80 },
  { tipo: 'Extracción de Cuerpo Extraño (Gastrointestinal)', descripcion: 'Remoción quirúrgica de objeto ingerido.', duracionEstimadaMin: 90, costoEstimado: 300 },
]

async function main() {
  for (const raza of RAZAS) {
    const existing = await prisma.raza.findFirst({ where: { nombre: raza.nombre } })
    if (!existing) await prisma.raza.create({ data: raza })
  }

  const categoriasByNombre = {}
  for (const cat of CATEGORIAS_PRODUCTOS) {
    const created = await prisma.categoriaProducto.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: cat,
    })
    categoriasByNombre[cat.nombre] = created.id
  }

  for (const prod of PRODUCTOS) {
    const existing = await prisma.producto.findFirst({ where: { nombre: prod.nombre } })
    if (!existing) {
      await prisma.producto.create({
        data: { ...prod, categoriaId: categoriasByNombre[prod.categoria] ?? null },
      })
    }
  }

  for (const enfermedad of ENFERMEDADES) {
    const existing = await prisma.enfermedad.findFirst({ where: { nombre: enfermedad.nombre } })
    if (!existing) await prisma.enfermedad.create({ data: enfermedad })
  }

  for (const cirugia of CIRUGIAS) {
    const existing = await prisma.cirugia.findFirst({ where: { tipo: cirugia.tipo } })
    if (!existing) await prisma.cirugia.create({ data: cirugia })
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 10)
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: { email: adminEmail, passwordHash },
    })
    console.log(`Usuario admin listo: ${adminEmail}`)
  } else {
    console.log('SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD no definidos, no se crea usuario admin')
  }

  console.log('Seed completado')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
