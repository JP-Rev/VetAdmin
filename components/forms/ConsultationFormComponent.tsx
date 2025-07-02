import React, { useState } from 'react';
import { Turno, Enfermedad, Cirugia, TipoEventoHistorial, ConsultationFormState, ConsultationDiseaseItem, ConsultationSurgeryItem, ConsultationVaccinationItem, AttachmentFile } from '../../types';
import { useSupabaseData } from '../../contexts/SupabaseDataContext';
import { Button } from '../common/Button';
import { FormField } from '../common/FormField';
import { Plus, Trash2 } from 'lucide-react';

interface ConsultationFormComponentProps {
  appointment: Turno;
  onSave: () => void;
  onClose: () => void;
}

const generateLocalId = () => `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

export const ConsultationFormComponent: React.FC<ConsultationFormComponentProps> = ({ appointment, onSave, onClose }) => {
  const { getPetById, getClientById, diseases, surgeries, addMedicalHistoryEvent, recordPetDisease, recordPetSurgery } = useSupabaseData();
  
  const pet = getPetById(appointment.mascota_id);
  const client = getClientById(appointment.cliente_id);

  const [formState, setFormState] = useState<ConsultationFormState>({
    mainDescription: '',
    eventDate: appointment.fecha,
    diseases: [],
    surgeries: [],
    vaccinations: [],
    attachments: [],
  });

  const [tempDisease, setTempDisease] = useState<{id: string, diseaseId: string, notes: string}>({id: '', diseaseId: '', notes: ''});
  const [tempSurgery, setTempSurgery] = useState<{id: string, surgeryId: string, notes: string, cost?: string}>({id: '', surgeryId: '', notes: '', cost: ''});
  const [tempVaccination, setTempVaccination] = useState<{id: string, vaccineName: string, notes: string}>({id: '', vaccineName: '', notes: ''});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  // Disease Management
  const handleAddDisease = () => {
    if (!tempDisease.diseaseId) { alert('Seleccione una enfermedad.'); return; }
    setFormState(prev => ({ ...prev, diseases: [...prev.diseases, {...tempDisease, id: generateLocalId()}] }));
    setTempDisease({ id: '', diseaseId: '', notes: '' });
  };
  const handleRemoveDisease = (id: string) => {
    setFormState(prev => ({ ...prev, diseases: prev.diseases.filter(d => d.id !== id) }));
  };

  // Surgery Management
  const handleAddSurgery = () => {
    if (!tempSurgery.surgeryId) { alert('Seleccione una cirugía.'); return; }
    setFormState(prev => ({ ...prev, surgeries: [...prev.surgeries, {...tempSurgery, id: generateLocalId()}] }));
    setTempSurgery({id: '', surgeryId: '', notes: '', cost: '' });
  };
  const handleRemoveSurgery = (id: string) => {
    setFormState(prev => ({ ...prev, surgeries: prev.surgeries.filter(s => s.id !== id) }));
  };
  
  // Vaccination Management
  const handleAddVaccination = () => {
    if (!tempVaccination.vaccineName.trim()) { alert('Ingrese el nombre de la vacuna.'); return; }
    setFormState(prev => ({ ...prev, vaccinations: [...prev.vaccinations, {...tempVaccination, id: generateLocalId()}] }));
    setTempVaccination({ id: '', vaccineName: '', notes: '' });
  };
  const handleRemoveVaccination = (id: string) => {
    setFormState(prev => ({ ...prev, vaccinations: prev.vaccinations.filter(v => v.id !== id) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.mainDescription.trim() && formState.diseases.length === 0 && formState.surgeries.length === 0 && formState.vaccinations.length === 0 && formState.attachments.length === 0) {
      alert('Debe ingresar al menos una descripción general, registrar una enfermedad/cirugía/vacunación o adjuntar un archivo.');
      return;
    }

    const eventDateTime = `${formState.eventDate} ${appointment.hora}`;

    // Main consultation event
    let mainEventDescription = formState.mainDescription.trim();
    if (!mainEventDescription && formState.attachments.length > 0) {
      mainEventDescription = `Consulta con ${formState.attachments.length} archivo(s) adjunto(s).`;
    }

    if (mainEventDescription) {
      addMedicalHistoryEvent(
        appointment.mascota_id,
        TipoEventoHistorial.CONSULTA,
        mainEventDescription,
        appointment.id_turno,
        eventDateTime,
        formState.attachments
      );
    }

    // Record diseases
    formState.diseases.forEach(d => {
      recordPetDisease(appointment.mascota_id, d.diseaseId, formState.eventDate, d.notes, eventDateTime);
    });

    // Record surgeries
    formState.surgeries.forEach(s => {
      const cost = s.cost ? parseFloat(s.cost) : undefined;
      if (s.cost && (isNaN(cost!) || cost! < 0)) {
          alert(`Costo inválido para cirugía: ${surgeries.find( surg => surg.id_cirugia === s.surgeryId)?.tipo}. Se guardará sin costo.`);
      }
      recordPetSurgery(appointment.mascota_id, s.surgeryId, formState.eventDate, s.notes, cost, eventDateTime);
    });

    // Record vaccinations
    formState.vaccinations.forEach(v => {
      addMedicalHistoryEvent(
        appointment.mascota_id,
        TipoEventoHistorial.VACUNACION,
        `Vacuna: ${v.vaccineName}. Observaciones: ${v.notes || 'N/A'}`,
        undefined, 
        eventDateTime
      );
    });
    
    onSave();
  };

  if (!pet || !client) return <p>Cargando datos de la consulta...</p>;

  const diseaseOptions = diseases.map(d => ({ value: d.id_enfermedad, label: d.nombre })).sort((a,b) => a.label.localeCompare(b.label));
  const surgeryOptions = surgeries.map(s => ({ value: s.id_cirugia, label: s.tipo })).sort((a,b) => a.label.localeCompare(b.label));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-secondary-800">Consulta para: {pet.nombre}</h3>
        <p className="text-sm text-secondary-600">Propietario: {client.nombre}</p>
        <p className="text-sm text-secondary-500">Motivo Turno: {appointment.motivo}</p>
      </div>

      <FormField label="Fecha del Evento" name="eventDate" type="date" value={formState.eventDate} onChange={handleInputChange} required />
      <FormField label="Descripción General de la Consulta" name="mainDescription" as="textarea" value={formState.mainDescription} onChange={handleInputChange} rows={4} placeholder="Notas, diagnóstico principal, plan de tratamiento general..." />

      {/* Diseases Section */}
      <div className="p-4 border border-secondary-200 rounded-md bg-secondary-50">
        <h4 className="text-md font-semibold text-secondary-700 mb-2">Registrar Enfermedades Diagnosticadas</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <FormField 
              label="Enfermedad" 
              name="tempDiseaseId" 
              as="searchable-select" 
              value={tempDisease.diseaseId} 
              onChange={(e) => setTempDisease(p => ({...p, diseaseId: e.target.value}))} 
              options={diseaseOptions} 
              placeholder="Buscar enfermedad..." 
              className="mb-0 md:col-span-1"
            />
            <FormField label="Notas (Enfermedad)" name="tempDiseaseNotes" as="textarea" value={tempDisease.notes} onChange={(e) => setTempDisease(p => ({...p, notes: e.target.value}))} rows={1} className="mb-0 md:col-span-1" placeholder="Observaciones específicas"/>
            <Button type="button" onClick={handleAddDisease} leftIcon={<Plus/>} className="md:col-span-1 h-10">Agregar Enfermedad</Button>
        </div>
        {formState.diseases.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
            {formState.diseases.map(d => {
                const diseaseDetail = diseases.find(dis => dis.id_enfermedad === d.diseaseId);
                return <li key={d.id} className="flex justify-between items-center p-1.5 bg-white rounded shadow-sm"><span>{diseaseDetail?.nombre}: {d.notes.substring(0,30)}...</span><Button size="sm" variant="ghost" onClick={() => handleRemoveDisease(d.id)} className="text-error-500 p-1"><Trash2 size={14}/></Button></li>
            })}
            </ul>
        )}
      </div>

      {/* Surgeries Section */}
      <div className="p-4 border border-secondary-200 rounded-md bg-secondary-50">
        <h4 className="text-md font-semibold text-secondary-700 mb-2">Registrar Cirugías Realizadas</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <FormField 
              label="Cirugía" 
              name="tempSurgeryId" 
              as="searchable-select" 
              value={tempSurgery.surgeryId} 
              onChange={(e) => setTempSurgery(p => ({...p, surgeryId: e.target.value}))} 
              options={surgeryOptions} 
              placeholder="Buscar cirugía..." 
              className="mb-0 md:col-span-1"
            />
            <FormField label="Notas (Cirugía)" name="tempSurgeryNotes" as="textarea" value={tempSurgery.notes} onChange={(e) => setTempSurgery(p => ({...p, notes: e.target.value}))} rows={1} className="mb-0 md:col-span-1" placeholder="Observaciones"/>
            <FormField label="Costo ($)" name="tempSurgeryCost" type="number" value={tempSurgery.cost || ''} onChange={(e) => setTempSurgery(p => ({...p, cost: e.target.value}))} className="mb-0 md:col-span-1" placeholder="Opcional" step="0.01"/>
            <Button type="button" onClick={handleAddSurgery} leftIcon={<Plus/>} className="md:col-span-1 h-10">Agregar Cirugía</Button>
        </div>
         {formState.surgeries.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
            {formState.surgeries.map(s => {
                const surgeryDetail = surgeries.find(surg => surg.id_cirugia === s.surgeryId);
                return <li key={s.id} className="flex justify-between items-center p-1.5 bg-white rounded shadow-sm"><span>{surgeryDetail?.tipo}: {s.notes.substring(0,25)}... {s.cost ? `($${s.cost})` : ''}</span><Button size="sm" variant="ghost" onClick={() => handleRemoveSurgery(s.id)} className="text-error-500 p-1"><Trash2 size={14}/></Button></li>
            })}
            </ul>
        )}
      </div>
      
      {/* Vaccinations Section */}
      <div className="p-4 border border-secondary-200 rounded-md bg-secondary-50">
        <h4 className="text-md font-semibold text-secondary-700 mb-2">Registrar Vacunaciones Aplicadas</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <FormField label="Nombre Vacuna" name="tempVaccineName" value={tempVaccination.vaccineName} onChange={(e) => setTempVaccination(p => ({...p, vaccineName: e.target.value}))} className="mb-0 md:col-span-1" placeholder="Ej: Antirrábica"/>
            <FormField label="Notas/Lote (Vacuna)" name="tempVaccineNotes" as="textarea" value={tempVaccination.notes} onChange={(e) => setTempVaccination(p => ({...p, notes: e.target.value}))} rows={1} className="mb-0 md:col-span-1" placeholder="Lote, fecha cad, etc."/>
            <Button type="button" onClick={handleAddVaccination} leftIcon={<Plus/>} className="md:col-span-1 h-10">Agregar Vacuna</Button>
        </div>
         {formState.vaccinations.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
            {formState.vaccinations.map(v => 
                <li key={v.id} className="flex justify-between items-center p-1.5 bg-white rounded shadow-sm"><span>{v.vaccineName}: {v.notes.substring(0,30)}...</span><Button size="sm" variant="ghost" onClick={() => handleRemoveVaccination(v.id)} className="text-error-500 p-1"><Trash2 size={14}/></Button></li>
            )}
            </ul>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary">Guardar Consulta</Button>
      </div>
    </form>
  );
};