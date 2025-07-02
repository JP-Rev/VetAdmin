import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { HistorialMedico, TipoEventoHistorial, Enfermedad, Cirugia, MascotaEnfermedad, MascotaCirugia, Mascota, Cliente, AttachmentFile } from '../types';
import { Button } from '../components/common/Button';
import { Modal } from '../components/Modal';
import { FormField } from '../components/common/FormField';
import { PrintableMedicalHistory } from '../components/PrintableMedicalHistory';
import { FileText, Plus, CalendarDays, Pill, Stethoscope, Activity, ArrowLeft, ShieldCheck, Printer, Paperclip, XCircle, FileImage, FileVideo, FileType, Edit3, ChevronDown, ChevronUp, Eye } from 'lucide-react';

// Helper function to generate IDs, assuming it's not globally available
const generateLocalIdForAttachment = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

interface NewEventFormProps {
  petId: string;
  onSave: (event?: HistorialMedico) => void;
  onClose: () => void;
}

const NewEventFormComponent: React.FC<NewEventFormProps> = ({ petId, onSave, onClose }) => {
    const { addMedicalHistoryEvent, diseases, surgeries, recordPetDisease, recordPetSurgery } = useSupabaseData();
    const [tipoEvento, setTipoEvento] = useState<TipoEventoHistorial>(TipoEventoHistorial.CONSULTA);
    const [descripcion, setDescripcion] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]); 
    
    const [selectedDiseaseId, setSelectedDiseaseId] = useState<string>('');
    const [diseaseNotes, setDiseaseNotes] = useState<string>('');
    const [selectedSurgeryId, setSelectedSurgeryId] = useState<string>('');
    const [surgeryNotes, setSurgeryNotes] = useState<string>('');

    const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
    const [fileInputKey, setFileInputKey] = useState(Date.now()); // To reset file input

    // Max file size for Base64 storage in localStorage (e.g., 2MB)
    const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; 

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newAttachments: AttachmentFile[] = [];
            
            // Check total size if adding multiple files at once
            const currentTotalSize = attachments.reduce((sum, att) => sum + att.size, 0);
            const newFilesTotalSize = files.reduce((sum, file) => sum + file.size, 0);

            if (currentTotalSize + newFilesTotalSize > MAX_FILE_SIZE_BYTES * 2) { // Allow up to 4MB total for demo
                alert(`El tamaño total de los adjuntos excede el límite de 4MB. Por favor, seleccione archivos más pequeños o menos archivos.`);
                setFileInputKey(Date.now()); // Reset file input
                return;
            }

            for (const file of files) {
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    alert(`El archivo "${file.name}" es demasiado grande (max ${MAX_FILE_SIZE_BYTES / (1024*1024)}MB). No se adjuntará.`);
                    continue;
                }
                const reader = new FileReader();
                reader.onload = (loadEvent) => {
                    if (loadEvent.target?.result) {
                        newAttachments.push({
                            id: generateLocalIdForAttachment(),
                            name: file.name,
                            type: file.type,
                            dataUrl: loadEvent.target.result as string,
                            size: file.size,
                        });
                        // Batch update after all files are processed (or one by one if preferred)
                        if (newAttachments.length === files.filter(f => f.size <= MAX_FILE_SIZE_BYTES).length) {
                             setAttachments(prev => [...prev, ...newAttachments]);
                        }
                    }
                };
                reader.onerror = () => {
                     alert(`Error al leer el archivo ${file.name}.`);
                }
                reader.readAsDataURL(file);
            }
            setFileInputKey(Date.now()); // Reset file input to allow selecting the same file again if removed
        }
    };

    const handleRemoveAttachment = (id: string) => {
        setAttachments(prev => prev.filter(att => att.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let newEvent: HistorialMedico | null = null;
        const eventDateTime = `${fecha} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;

        try {
            if (tipoEvento === TipoEventoHistorial.ENFERMEDAD_REGISTRADA) {
                if (!selectedDiseaseId) { alert("Seleccione una enfermedad."); return; }
                await recordPetDisease(petId, selectedDiseaseId, fecha, diseaseNotes || "Sin observaciones específicas.", eventDateTime);
                // Note: recordPetDisease calls addMedicalHistoryEvent internally, but doesn't pass attachments.
                // For simplicity, attachments added here will be associated with the primary event if description is also filled.
                // A more complex setup would modify recordPetDisease to accept attachments.
            } else if (tipoEvento === TipoEventoHistorial.CIRUGIA) {
                if (!selectedSurgeryId) { alert("Seleccione una cirugía."); return; }
                await recordPetSurgery(petId, selectedSurgeryId, fecha, surgeryNotes || "Sin observaciones específicas.", undefined, eventDateTime);
            }
            
            // For all types, if there's a main description or attachments, create/update the primary event
            // This is simplified; in a real app, disease/surgery records might have their own attachments.
            if (descripcion.trim() || attachments.length > 0) {
                let eventDescription = descripcion.trim();
                if (!eventDescription && attachments.length > 0) {
                    eventDescription = `Evento con ${attachments.length} archivo(s) adjunto(s).`;
                }

                newEvent = await addMedicalHistoryEvent(
                    petId, 
                    tipoEvento, 
                    eventDescription, 
                    undefined, // referenceId could be set if linking to a specific disease/surgery record
                    eventDateTime,
                    attachments
                );
            } else if (!newEvent && (tipoEvento === TipoEventoHistorial.ENFERMEDAD_REGISTRADA || tipoEvento === TipoEventoHistorial.CIRUGIA)) {
                 // If only disease/surgery was selected without a general description, 
                 // and no attachments, the internal addMedicalHistoryEvent from recordPet... already fired.
            } else if (!descripcion.trim() && attachments.length === 0) {
                 alert("Debe ingresar una descripción o adjuntar archivos para este tipo de evento.");
                 return;
            }

            onSave(newEvent || undefined); 
        } catch (error) {
            console.error('Error saving medical event:', error);
            alert('Error al guardar el evento médico. Por favor, intente nuevamente.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField 
                label="Fecha del Evento" 
                name="fecha" 
                type="date" 
                value={fecha} 
                onChange={(e) => setFecha(e.target.value)} 
                required 
            />
            <FormField 
                label="Tipo de Evento" 
                name="tipo_evento" 
                as="select" 
                value={tipoEvento} 
                onChange={(e) => {
                    setTipoEvento(e.target.value as TipoEventoHistorial);
                    setSelectedDiseaseId(''); setDiseaseNotes(''); 
                    setSelectedSurgeryId(''); setSurgeryNotes('');
                    if (e.target.value !== TipoEventoHistorial.CONSULTA && e.target.value !== TipoEventoHistorial.TRATAMIENTO && e.target.value !== TipoEventoHistorial.VACUNACION) {
                        setDescripcion(''); 
                    }
                }}
                required 
                options={Object.values(TipoEventoHistorial).map(t => ({ value: t, label: t }))} 
            />

            {tipoEvento === TipoEventoHistorial.ENFERMEDAD_REGISTRADA && (
                <>
                    <FormField label="Enfermedad" name="selectedDiseaseId" as="select" value={selectedDiseaseId} onChange={(e) => setSelectedDiseaseId(e.target.value)} required options={diseases.map(d => ({ value: d.id_enfermedad, label: d.nombre }))} placeholder="Seleccione enfermedad"/>
                    <FormField label="Observaciones (Enfermedad)" name="diseaseNotes" as="textarea" value={diseaseNotes} onChange={(e) => setDiseaseNotes(e.target.value)} rows={2} />
                </>
            )}

            {tipoEvento === TipoEventoHistorial.CIRUGIA && (
                 <>
                    <FormField label="Cirugía Realizada" name="selectedSurgeryId" as="select" value={selectedSurgeryId} onChange={(e) => setSelectedSurgeryId(e.target.value)} required options={surgeries.map(s => ({ value: s.id_cirugia, label: s.tipo }))} placeholder="Seleccione cirugía"/>
                    <FormField label="Observaciones (Cirugía)" name="surgeryNotes" as="textarea" value={surgeryNotes} onChange={(e) => setSurgeryNotes(e.target.value)} rows={2} />
                </>
            )}
            
            {(tipoEvento === TipoEventoHistorial.CONSULTA || tipoEvento === TipoEventoHistorial.TRATAMIENTO || tipoEvento === TipoEventoHistorial.VACUNACION) && (
                 <FormField label="Descripción / Notas" name="descripcion" as="textarea" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required={tipoEvento !== TipoEventoHistorial.VACUNACION && attachments.length === 0} rows={3} placeholder={tipoEvento === TipoEventoHistorial.VACUNACION ? "Nombre de la vacuna, lote, etc." : "Detalles del evento"}/>
            )}

            {/* File Attachments */}
            <div className="space-y-2">
                <label htmlFor="attachments" className="block text-sm font-medium text-secondary-700">Adjuntar Archivos (imágenes, PDFs, videos cortos)</label>
                <p className="text-xs text-secondary-500">Límite de tamaño: ~2MB por archivo (para demostración). Los archivos grandes pueden afectar el rendimiento.</p>
                <input 
                    key={fileInputKey} // Used to reset the input
                    type="file" 
                    id="attachments" 
                    multiple 
                    onChange={handleFileChange} 
                    className="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                        <h4 className="text-xs font-medium text-secondary-600">Archivos seleccionados:</h4>
                        <ul className="max-h-32 overflow-y-auto border border-secondary-200 rounded-md p-1 bg-secondary-50">
                            {attachments.map(att => (
                                <li key={att.id} className="text-xs flex justify-between items-center p-1 hover:bg-secondary-100 rounded">
                                    <span className="truncate" title={att.name}>{att.name} ({(att.size / 1024).toFixed(1)} KB)</span>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveAttachment(att.id)} className="p-0.5 text-error-500 hover:text-error-700">
                                        <XCircle size={14} />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="submit" variant="primary">Guardar Evento</Button>
            </div>
        </form>
    );
};

interface EditEventFormProps {
  initialEvent: HistorialMedico;
  onSave: (updatedData: Partial<Pick<HistorialMedico, 'fecha' | 'descripcion' | 'attachments'>>) => void;
  onClose: () => void;
}

const EditEventFormComponent: React.FC<EditEventFormProps> = ({ initialEvent, onSave, onClose }) => {
    const [fecha, setFecha] = useState(initialEvent.fecha.split('T')[0]); // Only date part for editing
    const [descripcion, setDescripcion] = useState(initialEvent.descripcion);
    const [attachments, setAttachments] = useState<AttachmentFile[]>(initialEvent.attachments || []);
    const [fileInputKey, setFileInputKey] = useState(Date.now());
    
    const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newAttachments: AttachmentFile[] = [];
            const currentTotalSize = attachments.reduce((sum, att) => sum + att.size, 0);
            const newFilesTotalSize = files.reduce((sum, file) => sum + file.size, 0);

            if (currentTotalSize + newFilesTotalSize > MAX_FILE_SIZE_BYTES * 2) {
                alert(`El tamaño total de los adjuntos excede el límite de 4MB.`);
                setFileInputKey(Date.now());
                return;
            }

            for (const file of files) {
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    alert(`El archivo "${file.name}" es demasiado grande (max ${MAX_FILE_SIZE_BYTES / (1024*1024)}MB).`);
                    continue;
                }
                const reader = new FileReader();
                reader.onload = (loadEvent) => {
                    if (loadEvent.target?.result) {
                        newAttachments.push({
                            id: generateLocalIdForAttachment(),
                            name: file.name,
                            type: file.type,
                            dataUrl: loadEvent.target.result as string,
                            size: file.size,
                        });
                        if (newAttachments.length === files.filter(f => f.size <= MAX_FILE_SIZE_BYTES).length) {
                             setAttachments(prev => [...prev, ...newAttachments]);
                        }
                    }
                };
                reader.onerror = () => alert(`Error al leer el archivo ${file.name}.`);
                reader.readAsDataURL(file);
            }
            setFileInputKey(Date.now());
        }
    };

    const handleRemoveAttachment = (id: string) => {
        setAttachments(prev => prev.filter(att => att.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!descripcion.trim() && attachments.length === 0) {
            alert("La descripción no puede estar vacía si no hay archivos adjuntos.");
            return;
        }

        try {
            // Combine new date with original time
            const originalTime = new Date(initialEvent.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            const newDateTimeString = `${fecha}T${originalTime}`;

            await onSave({
                fecha: newDateTimeString,
                descripcion: descripcion,
                attachments: attachments,
            });
        } catch (error) {
            console.error('Error updating medical event:', error);
            alert('Error al actualizar el evento médico. Por favor, intente nuevamente.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-secondary-50 border border-secondary-200 rounded-md">
                <p className="text-sm font-medium text-secondary-700">Tipo de Evento (No editable): <span className="text-primary-600 font-semibold">{initialEvent.tipo_evento}</span></p>
                {initialEvent.referencia_id && <p className="text-xs text-secondary-500 mt-1">Ref: {initialEvent.referencia_id.substring(0,12)}...</p>}
            </div>
            <FormField 
                label="Fecha del Evento" 
                name="fecha" 
                type="date" 
                value={fecha} 
                onChange={(e) => setFecha(e.target.value)} 
                required 
            />
            <FormField 
                label="Descripción / Notas" 
                name="descripcion" 
                as="textarea" 
                value={descripcion} 
                onChange={(e) => setDescripcion(e.target.value)} 
                required={attachments.length === 0} 
                rows={4}
            />
             <div className="space-y-2">
                <label htmlFor="edit_attachments" className="block text-sm font-medium text-secondary-700">Adjuntar Archivos</label>
                <input 
                    key={fileInputKey}
                    type="file" 
                    id="edit_attachments" 
                    multiple 
                    onChange={handleFileChange} 
                    className="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                        <h4 className="text-xs font-medium text-secondary-600">Archivos actuales:</h4>
                        <ul className="max-h-32 overflow-y-auto border border-secondary-200 rounded-md p-1 bg-secondary-50">
                            {attachments.map(att => (
                                <li key={att.id} className="text-xs flex justify-between items-center p-1 hover:bg-secondary-100 rounded">
                                    <span className="truncate" title={att.name}>{att.name} ({(att.size / 1024).toFixed(1)} KB)</span>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveAttachment(att.id)} className="p-0.5 text-error-500 hover:text-error-700">
                                        <XCircle size={14} />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="submit" variant="primary">Guardar Cambios</Button>
            </div>
        </form>
    );
};

// Componente para mostrar texto con límite de caracteres y modal para texto completo
interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

const TruncatedText: React.FC<TruncatedTextProps> = ({ text, maxLength = 80, className = "" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  if (text.length <= maxLength) {
    return (
      <div className={`whitespace-pre-wrap break-words leading-relaxed ${className}`}>
        {text}
      </div>
    );
  }

  return (
    <>
      <div className={`whitespace-pre-wrap break-words leading-relaxed ${className}`}>
        {text.substring(0, maxLength)}...
        <button
          onClick={() => setIsModalOpen(true)}
          className="ml-2 text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center"
          title="Ver descripción completa"
        >
          <Eye size={14} className="mr-1" />
          Ver completo
        </button>
      </div>

      {/* Modal para mostrar texto completo */}
      {isModalOpen && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title="Descripción Completa"
          size="lg"
        >
          <div className="max-h-96 overflow-y-auto p-4 bg-secondary-50 rounded-md border">
            <div className="whitespace-pre-wrap break-words leading-relaxed text-secondary-700">
              {text}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsModalOpen(false)} variant="primary">
              Cerrar
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
};

export const MedicalHistoryPage: React.FC = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { getPetById, getClientById, getMedicalHistoryByPetId, updateMedicalHistoryEvent, diseases, surgeries, petDiseases, petSurgeries, printContent, breeds } = useSupabaseData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<HistorialMedico | undefined>(undefined);

  if (!petId) {
    return <div className="p-6 text-error-600">Error: No se especificó ID de mascota.</div>;
  }

  const pet = getPetById(petId);
  const client = pet ? getClientById(pet.id_cliente) : undefined;
  const historyEvents = getMedicalHistoryByPetId(petId);

  if (!pet) {
    return <div className="p-6 text-error-600">Mascota no encontrada. <Link to="/clients" className="text-primary-600 hover:underline">Volver a Clientes</Link></div>;
  }
  
  const handleEventSaved = () => {
    // Reset all modal states completely
    setIsModalOpen(false);
    setEditingEvent(undefined);
    setIsEditModalOpen(false);
  };

  const handleOpenEditModal = (eventToEdit: HistorialMedico) => {
    setEditingEvent(eventToEdit);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingEvent(undefined);
    setIsEditModalOpen(false);
  };

  const handleEditEventSave = async (updatedData: Partial<Pick<HistorialMedico, 'fecha' | 'descripcion' | 'attachments'>>) => {
    if (editingEvent) {
      try {
        await updateMedicalHistoryEvent(editingEvent.id_evento, updatedData);
        handleCloseEditModal();
      } catch (error) {
        console.error('Error updating medical event:', error);
        alert('Error al actualizar el evento médico. Por favor, intente nuevamente.');
      }
    }
  };

  const handlePrintMedicalHistory = () => {
    if (pet && client) {
      const petBreed = breeds.find(b => b.id_raza === pet.raza_id);
      const enrichedPet = {...pet, raza_nombre: petBreed?.nombre || pet.raza_id};
      const filename = `HC-${enrichedPet.nombre.replace(/\s+/g, '_')}-${client.nombre.split(' ')[0]}.pdf`;

      printContent(
        <PrintableMedicalHistory 
          pet={enrichedPet}
          client={client}
          historyEvents={historyEvents}
          diseases={diseases}
          surgeries={surgeries}
          petDiseases={petDiseases}
          petSurgeries={petSurgeries}
        />,
        filename
      );
    }
  };

  const getEventIcon = (type: TipoEventoHistorial) => {
    switch(type) {
        case TipoEventoHistorial.CONSULTA: return <Stethoscope className="h-5 w-5 mr-2 text-primary-600" />;
        case TipoEventoHistorial.CIRUGIA: return <Activity className="h-5 w-5 mr-2 text-error-600" />;
        case TipoEventoHistorial.TRATAMIENTO: return <Pill className="h-5 w-5 mr-2 text-accent-600" />;
        case TipoEventoHistorial.ENFERMEDAD_REGISTRADA: return <FileText className="h-5 w-5 mr-2 text-warning-700" />;
        case TipoEventoHistorial.VACUNACION: return <ShieldCheck className="h-5 w-5 mr-2 text-success-600" />;
        default: return <FileText className="h-5 w-5 mr-2 text-secondary-500" />;
    }
  }

  const getReferenceDetails = (event: HistorialMedico): string => {
    if (!event.referencia_id) return "";
    
    if (event.tipo_evento === TipoEventoHistorial.ENFERMEDAD_REGISTRADA) {
      const petDisease = petDiseases.find(pd => pd.id_mascota_enfermedad === event.referencia_id);
      if (petDisease) {
        const disease = diseases.find(d => d.id_enfermedad === petDisease.enfermedad_id);
        return `Enfermedad: ${disease?.nombre || 'N/A'}. Fecha Diag: ${new Date(petDisease.fecha_diagnostico  + 'T00:00:00').toLocaleDateString()}.`;
      }
    }
    if (event.tipo_evento === TipoEventoHistorial.CIRUGIA) {
      const petSurgery = petSurgeries.find(ps => ps.id_mascota_cirugia === event.referencia_id);
      if (petSurgery) {
        const surgery = surgeries.find(s => s.id_cirugia === petSurgery.cirugia_id);
         return `Cirugía: ${surgery?.tipo || 'N/A'}. Fecha: ${new Date(petSurgery.fecha  + 'T00:00:00').toLocaleDateString()}. ${petSurgery.costo_final ? 'Costo: $' + petSurgery.costo_final.toFixed(2) + '.' : ''}`;
      }
    }
    if (event.tipo_evento === TipoEventoHistorial.CONSULTA && event.referencia_id?.startsWith('turn_')) { 
        return `Referente al turno ID: ${event.referencia_id.substring(0,10)}...`;
    }
    return `Ref. ID: ${event.referencia_id.substring(0,8)}`;
  };
  
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage size={16} className="text-blue-500 mr-1" />;
    if (mimeType.startsWith('video/')) return <FileVideo size={16} className="text-purple-500 mr-1" />;
    if (mimeType === 'application/pdf') return <FileType size={16} className="text-red-500 mr-1" />; // Or specific PDF icon
    return <Paperclip size={16} className="text-secondary-500 mr-1" />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-secondary-800">Historial Médico: {pet.nombre}</h1>
                <p className="text-md text-secondary-600">Propietario: <Link to={`/clients/${client?.id_cliente}`} className="text-primary-600 hover:underline">{client?.nombre || 'N/A'}</Link></p>
                <p className="text-sm text-secondary-500">Especie: {pet.especie} - Sexo: {pet.sexo}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus />} className="w-full sm:w-auto">
                    Nuevo Evento Manual
                </Button>
                <Button onClick={handlePrintMedicalHistory} leftIcon={<Printer />} variant="outline" className="w-full sm:w-auto">
                    Imprimir HC
                </Button>
            </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/clients/${client?.id_cliente || ''}`)} className="text-sm" leftIcon={<ArrowLeft size={16}/>}>
            Volver a Detalles del Cliente
        </Button>
      </div>
      
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Nuevo Evento Manual para ${pet.nombre}`} size="lg">
            <NewEventFormComponent petId={pet.id_mascota} onSave={handleEventSaved} onClose={() => setIsModalOpen(false)} />
        </Modal>
      )}

      {isEditModalOpen && editingEvent && (
        <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title={`Editar Evento para ${pet.nombre}`} size="lg">
            <EditEventFormComponent initialEvent={editingEvent} onSave={handleEditEventSave} onClose={handleCloseEditModal} />
        </Modal>
      )}

      {historyEvents.length > 0 ? (
        <div className="space-y-4">
          {historyEvents.map(event => (
            <div key={event.id_evento} className="bg-white shadow-lg rounded-lg p-4 sm:p-5 overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                <div className="flex items-center min-w-0 flex-1">
                  {getEventIcon(event.tipo_evento)}
                  <h3 className="text-lg font-semibold text-primary-700 truncate">{event.tipo_evento}</h3>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-0 flex-shrink-0">
                    <p className="text-xs sm:text-sm text-secondary-500 flex items-center">
                        <CalendarDays className="inline h-4 w-4 mr-1.5 text-secondary-400" />
                        {new Date(event.fecha).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleOpenEditModal(event)} 
                        title="Editar Entrada"
                        className="text-accent-600 hover:bg-accent-50 p-1"
                    >
                        <Edit3 size={16} />
                    </Button>
                </div>
              </div>
              
              {/* Descripción con límite de caracteres y modal para texto completo */}
              <div className="mt-1 text-secondary-700 text-sm">
                <TruncatedText text={event.descripcion} maxLength={80} />
              </div>
              
              {event.referencia_id && (
                <div className="mt-2 text-xs text-secondary-500 italic border-t border-secondary-200 pt-2 break-words">
                  {getReferenceDetails(event)}
                </div>
              )}
              
              {event.attachments && event.attachments.length > 0 && (
                <div className="mt-3 pt-2 border-t border-secondary-200">
                    <h4 className="text-xs font-semibold text-secondary-600 mb-1">Archivos Adjuntos:</h4>
                    <ul className="space-y-1">
                        {event.attachments.map(att => (
                            <li key={att.id} className="text-xs">
                                <a 
                                    href={att.dataUrl} 
                                    download={att.name} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-primary-600 hover:text-primary-700 hover:underline flex items-center break-all"
                                    title={`Ver/Descargar ${att.name}`}
                                >
                                    {getFileIcon(att.type)}
                                    <span className="truncate max-w-xs">{att.name}</span>
                                    <span className="ml-1 flex-shrink-0">({(att.size / 1024).toFixed(1)} KB)</span>
                                    {att.type.startsWith('image/') && (
                                      <img src={att.dataUrl} alt={`Miniatura de ${att.name}`} className="h-6 w-auto ml-2 border border-secondary-200 rounded object-cover flex-shrink-0"/>
                                    )}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <FileText className="mx-auto h-12 w-12 text-secondary-400" />
          <h3 className="mt-2 text-lg font-medium text-secondary-900">Historial Vacío</h3>
          <p className="mt-1 text-sm text-secondary-500">No hay eventos médicos registrados para {pet.nombre}.</p>
        </div>
      )}
    </div>
  );
};