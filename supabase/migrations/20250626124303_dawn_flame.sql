/*
  # Datos iniciales para VetAdmin

  1. Datos de prueba
    - Razas predefinidas
    - Productos iniciales
    - Enfermedades comunes
    - Tipos de cirugía
*/

-- Insertar razas predefinidas
INSERT INTO razas (nombre, especie) VALUES
('Labrador Retriever', 'Perro'),
('Bulldog Francés', 'Perro'),
('Golden Retriever', 'Perro'),
('Pastor Alemán', 'Perro'),
('Caniche', 'Perro'),
('Siamés', 'Gato'),
('Persa', 'Gato'),
('Maine Coon', 'Gato'),
('Bengalí', 'Gato'),
('Ragdoll', 'Gato'),
('Común Europeo (Perro)', 'Perro'),
('Común Europeo (Gato)', 'Gato'),
('Canario', 'Ave'),
('Periquito', 'Ave'),
('Hamster Sirio', 'Roedor'),
('Cuy', 'Roedor'),
('Iguana Verde', 'Reptil'),
('Gecko Leopardo', 'Reptil'),
('Otro Perro', 'Perro'),
('Otro Gato', 'Gato'),
('Otra Ave', 'Ave'),
('Otro Roedor', 'Roedor'),
('Otro Reptil', 'Reptil'),
('No Aplica', 'Otro');

-- Insertar productos iniciales
INSERT INTO productos (nombre, stock, precio, categoria) VALUES
('Alimento Balanceado Perro Adulto 1kg', 50, 15.99, 'Alimentos'),
('Alimento Balanceado Gato Adulto 1kg', 40, 17.50, 'Alimentos'),
('Pipeta Antipulgas Perro Mediano', 100, 8.75, 'Salud'),
('Juguete Pelota Goma', 75, 5.00, 'Accesorios'),
('Shampoo Hipoalergénico 250ml', 30, 12.25, 'Higiene');

-- Insertar enfermedades comunes
INSERT INTO enfermedades (nombre, descripcion, especie_afectada) VALUES
('Parvovirus Canino', 'Enfermedad viral altamente contagiosa en cachorros.', 'Perro'),
('Moquillo Canino', 'Enfermedad viral multisistémica.', 'Perro'),
('Insuficiencia Renal Crónica Felina', 'Pérdida progresiva de la función renal en gatos.', 'Gato'),
('Otitis Externa', 'Inflamación del conducto auditivo externo.', 'Perro'),
('Gripe Felina (Complejo Respiratorio Felino)', 'Infección respiratoria común en gatos.', 'Gato');

-- Insertar tipos de cirugía
INSERT INTO cirugias (tipo, descripcion, duracion_estimada_min, costo_estimado) VALUES
('Esterilización (Ovariohisterectomía)', 'Extirpación de ovarios y útero en hembras.', 60, 150),
('Castración (Orquiectomía)', 'Extirpación de testículos en machos.', 30, 100),
('Limpieza Dental', 'Eliminación de sarro y placa bacteriana.', 45, 80),
('Extracción de Cuerpo Extraño (Gastrointestinal)', 'Remoción quirúrgica de objeto ingerido.', 90, 300);