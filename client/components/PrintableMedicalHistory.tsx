import React from 'react';
import { Mascota, Cliente, HistorialMedico, Enfermedad, Cirugia, MascotaEnfermedad, MascotaCirugia, TipoEventoHistorial } from '../types';
import { APP_TITLE } from '../constants';

interface EnrichedMascota extends Mascota {
  raza_nombre: string;
}
interface PrintableMedicalHistoryProps {
  pet: EnrichedMascota;
  client: Cliente;
  historyEvents: HistorialMedico[];
  diseases: Enfermedad[];
  surgeries: Cirugia[];
  petDiseases: MascotaEnfermedad[];
  petSurgeries: MascotaCirugia[];
}

export const PrintableMedicalHistory: React.FC<PrintableMedicalHistoryProps> = ({ 
    pet, client, historyEvents, diseases, surgeries, petDiseases, petSurgeries 
}) => {

  const getReferenceDetailsForPrint = (event: HistorialMedico): string | null => {
    if (!event.referencia_id) return null;
    
    let details = [];

    if (event.tipo_evento === TipoEventoHistorial.ENFERMEDAD_REGISTRADA) {
      const petDisease = petDiseases.find(pd => pd.id_mascota_enfermedad === event.referencia_id);
      if (petDisease) {
        const disease = diseases.find(d => d.id_enfermedad === petDisease.enfermedad_id);
        details.push(`Enfermedad: ${disease?.nombre || 'N/A'}`);
        details.push(`Fecha Diag.: ${new Date(petDisease.fecha_diagnostico + 'T00:00:00').toLocaleDateString()}`);
      }
    }
    if (event.tipo_evento === TipoEventoHistorial.CIRUGIA) {
      const petSurgery = petSurgeries.find(ps => ps.id_mascota_cirugia === event.referencia_id);
      if (petSurgery) {
        const surgery = surgeries.find(s => s.id_cirugia === petSurgery.cirugia_id);
        details.push(`Cirugía: ${surgery?.tipo || 'N/A'}`);
        details.push(`Fecha: ${new Date(petSurgery.fecha + 'T00:00:00').toLocaleDateString()}`);
        if(petSurgery.costo_final) details.push(`Costo: $${petSurgery.costo_final.toFixed(2)}`);
      }
    }
    if (event.tipo_evento === TipoEventoHistorial.CONSULTA && event.referencia_id?.startsWith('turn_')) {
        details.push(`Turno ID: ${event.referencia_id.substring(0,10)}...`);
    }
    
    return details.length > 0 ? details.join('. ') : `Ref. ID: ${event.referencia_id.substring(0,8)}`;
  };

  return (
    <div className="printable-area">
      <div className="text-center mb-6">
        <h1>{APP_TITLE}</h1>
        <h2>Historial Clínico</h2>
      </div>

      <section>
        <h3>Datos de la Mascota</h3>
        <p><strong>Nombre:</strong> {pet.nombre}</p>
        <p><strong>Especie:</strong> {pet.especie}</p>
        <p><strong>Raza:</strong> {pet.raza_nombre}</p>
        <p><strong>Fecha de Nacimiento:</strong> {new Date(pet.fecha_nacimiento + 'T00:00:00').toLocaleDateString()}</p>
        <p><strong>Sexo:</strong> {pet.sexo}</p>
        <p><strong>ID Mascota:</strong> {pet.id_mascota.substring(0,8)}</p>
      </section>

      <section>
        <h3>Datos del Propietario</h3>
        <p><strong>Nombre:</strong> {client.nombre}</p>
        <p><strong>Teléfono:</strong> {client.telefono}</p>
        {client.email && <p><strong>Email:</strong> {client.email}</p>}
        {client.domicilio && <p><strong>Domicilio:</strong> {client.domicilio}</p>}
      </section>

      <section>
        <h3>Eventos Médicos</h3>
        {historyEvents.length > 0 ? (
          <div>
            {historyEvents.map(event => (
              <div key={event.id_evento} className="event-item">
                <p><strong>Fecha:</strong> {new Date(event.fecha).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>Tipo:</strong> {event.tipo_evento}</p>
                <p><strong>Descripción:</strong></p>
                <div style={{ marginLeft: '10pt', whiteSpace: 'pre-wrap' }}>{event.descripcion}</div>
                {event.referencia_id && (
                  <p style={{ fontSize: '10pt', fontStyle: 'italic', marginTop: '4pt' }}>
                    <em>Detalles Adicionales: {getReferenceDetailsForPrint(event)}</em>
                  </p>
                )}
                {event.attachments && event.attachments.length > 0 && (
                  <p style={{ fontSize: '10pt', fontStyle: 'italic', marginTop: '4pt' }}>
                    <em>Archivos Adjuntos: {event.attachments.map(att => att.name).join(', ')}</em>
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No hay eventos médicos registrados.</p>
        )}
      </section>
      
      <footer style={{ marginTop: '20pt', paddingTop: '10pt', borderTop: '1pt solid #ccc', textAlign: 'center', fontSize: '10pt' }}>
        Historial generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}.
      </footer>
    </div>
  );
};