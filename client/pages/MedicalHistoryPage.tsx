import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { HistorialMedico, TipoEventoHistorial, AttachmentFile } from '../types';
import { Button } from '../components/common/Button';
import { Modal } from '../components/Modal';
import { FormField } from '../components/common/FormField';
import { PrintableMedicalHistory } from '../components/PrintableMedicalHistory';
import { FileText, Plus, Pill, Stethoscope, Activity, ArrowLeft, ShieldCheck, Printer, Paperclip, XCircle, FileImage, FileVideo, FileType, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { SpeciesIcon } from '../lib/speciesIcon';
import { getPetAge } from '../lib/petAge';
import { PasswordConfirmDialog } from '../components/common/PasswordConfirmDialog';

/**
 * Boton de accion solo con icono: la etiqueta va en title/aria-label y aparece
 * al pasar el mouse, para no llenar la pantalla de texto.
 */
const IconBtn: React.FC<{
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'danger';
  size?: 'sm' | 'md';
}> = ({ label, onClick, children, variant = 'default', size = 'md' }) => {
  const dim = size === 'sm' ? 'w-[26px] h-[26px]' : 'w-[36px] h-[36px]';
  const tone =
    variant === 'primary'
      ? 'bg-primary-700 border-primary-700 text-white hover:bg-primary-800'
      : variant === 'danger'
      ? 'border-error-200 text-error-600 hover:bg-error-50 hover:border-error-300'
      : 'border-secondary-200 text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 hover:border-secondary-300';
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`${dim} ${tone} rounded-[9px] border flex items-center justify-center flex-shrink-0 transition-colors`}
    >
      {children}
    </button>
  );
};

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

    const [attachments, setAttachments] = useState<File[]>([]);
    const [fileInputKey, setFileInputKey] = useState(Date.now()); // To reset file input

    // Debe coincidir con el límite configurado en el backend (multer, ver server/src/storage.js)
    const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const accepted: File[] = [];

            for (const file of files) {
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    alert(`El archivo "${file.name}" es demasiado grande (max ${MAX_FILE_SIZE_BYTES / (1024*1024)}MB). No se adjuntará.`);
                    continue;
                }
                accepted.push(file);
            }

            setAttachments(prev => [...prev, ...accepted]);
            setFileInputKey(Date.now()); // Reset file input to allow selecting the same file again if removed
        }
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
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
                <p className="text-xs text-secondary-500">Límite de tamaño: {MAX_FILE_SIZE_BYTES / (1024*1024)}MB por archivo.</p>
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
                            {attachments.map((file, index) => (
                                <li key={`${file.name}-${index}`} className="text-xs flex justify-between items-center p-1 hover:bg-secondary-100 rounded">
                                    <span className="truncate" title={file.name}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveAttachment(index)} className="p-0.5 text-error-500 hover:text-error-700">
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
  onSave: (updatedData: Partial<Pick<HistorialMedico, 'fecha' | 'descripcion'>>) => Promise<void>;
  onClose: () => void;
}

const EditEventFormComponent: React.FC<EditEventFormProps> = ({ initialEvent, onSave, onClose }) => {
    const { addAttachmentToEvent, deleteAttachment } = useSupabaseData();
    const [fecha, setFecha] = useState(initialEvent.fecha.split('T')[0]); // Only date part for editing
    const [descripcion, setDescripcion] = useState(initialEvent.descripcion);
    const [existingAttachments, setExistingAttachments] = useState<AttachmentFile[]>(initialEvent.attachments || []);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [fileInputKey, setFileInputKey] = useState(Date.now());
    const [submitting, setSubmitting] = useState(false);

    // Debe coincidir con el límite configurado en el backend (multer, ver server/src/storage.js)
    const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const accepted: File[] = [];

            for (const file of files) {
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    alert(`El archivo "${file.name}" es demasiado grande (max ${MAX_FILE_SIZE_BYTES / (1024*1024)}MB).`);
                    continue;
                }
                accepted.push(file);
            }

            setNewFiles(prev => [...prev, ...accepted]);
            setFileInputKey(Date.now());
        }
    };

    const handleRemoveNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Borrar un adjunto pide la contraseña: el backend la exige porque tambien
    // borra el archivo del disco.
    const [deletingAtt, setDeletingAtt] = useState<AttachmentFile | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!descripcion.trim() && existingAttachments.length === 0 && newFiles.length === 0) {
            alert("La descripción no puede estar vacía si no hay archivos adjuntos.");
            return;
        }

        setSubmitting(true);
        try {
            // Combine new date with original time
            const originalTime = new Date(initialEvent.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            const newDateTimeString = `${fecha}T${originalTime}`;

            await onSave({
                fecha: newDateTimeString,
                descripcion: descripcion,
            });

            for (const file of newFiles) {
                await addAttachmentToEvent(initialEvent.id_evento, file);
            }

            onClose();
        } catch (error) {
            console.error('Error updating medical event:', error);
            alert('Error al actualizar el evento médico. Por favor, intente nuevamente.');
        } finally {
            setSubmitting(false);
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
                required={existingAttachments.length === 0 && newFiles.length === 0}
                rows={4}
            />
             <div className="space-y-2">
                {existingAttachments.length > 0 && (
                    <div className="space-y-1">
                        <h4 className="text-xs font-medium text-secondary-600">Archivos adjuntos actuales:</h4>
                        <ul className="max-h-32 overflow-y-auto border border-secondary-200 rounded-md p-1 bg-secondary-50">
                            {existingAttachments.map(att => (
                                <li key={att.id} className="text-xs flex justify-between items-center p-1 hover:bg-secondary-100 rounded">
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="truncate text-primary-600 hover:underline" title={att.name}>
                                        {att.name} ({(att.size / 1024).toFixed(1)} KB)
                                    </a>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setDeletingAtt(att)} className="p-0.5 text-error-500 hover:text-error-700">
                                        <XCircle size={14} />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <label htmlFor="edit_attachments" className="block text-sm font-medium text-secondary-700">Adjuntar Archivos Nuevos</label>
                <input
                    key={fileInputKey}
                    type="file"
                    id="edit_attachments"
                    multiple
                    onChange={handleFileChange}
                    className="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {newFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                        <h4 className="text-xs font-medium text-secondary-600">Archivos nuevos por subir:</h4>
                        <ul className="max-h-32 overflow-y-auto border border-secondary-200 rounded-md p-1 bg-secondary-50">
                            {newFiles.map((file, index) => (
                                <li key={`${file.name}-${index}`} className="text-xs flex justify-between items-center p-1 hover:bg-secondary-100 rounded">
                                    <span className="truncate" title={file.name}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveNewFile(index)} className="p-0.5 text-error-500 hover:text-error-700">
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
                <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar Cambios'}</Button>
            </div>

            <PasswordConfirmDialog
              isOpen={deletingAtt !== null}
              title="Eliminar archivo adjunto"
              description={
                <>
                  Vas a eliminar <strong>{deletingAtt?.name}</strong>. El archivo se borra del servidor
                  y no se puede recuperar.
                </>
              }
              onConfirm={async (password) => {
                if (!deletingAtt) return;
                await deleteAttachment(deletingAtt.id, initialEvent.id_evento, password);
                setExistingAttachments(prev => prev.filter(a => a.id !== deletingAtt.id));
              }}
              onClose={() => setDeletingAtt(null)}
            />
        </form>
    );
};

export const MedicalHistoryPage: React.FC = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { getPetById, getClientById, getMedicalHistoryByPetId, updateMedicalHistoryEvent, diseases, surgeries, petDiseases, petSurgeries, printContent, breeds, deleteAttachment, deleteMedicalHistoryEvent } = useSupabaseData();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Permite abrir el alta de evento desde otra pantalla (?action=new), por
  // ejemplo desde "Agregar consulta" en la ficha del cliente.
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('action');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<HistorialMedico | undefined>(undefined);
  const [deletingAttachment, setDeletingAttachment] = useState<{ att: AttachmentFile; eventId: string } | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<HistorialMedico | null>(null);
  // Colapsados por defecto: la historia clinica se lee de un vistazo y se
  // despliega solo el evento que interesa.
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const toggleEvento = (id: string) =>
    setExpandidos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

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

  const handleEditEventSave = async (updatedData: Partial<Pick<HistorialMedico, 'fecha' | 'descripcion'>>) => {
    if (editingEvent) {
      await updateMedicalHistoryEvent(editingEvent.id_evento, updatedData);
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
    // Para el resto, el id interno no le dice nada a quien usa la app.
    return "";
  };
  
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage size={16} className="text-blue-500 mr-1" />;
    if (mimeType.startsWith('video/')) return <FileVideo size={16} className="text-purple-500 mr-1" />;
    if (mimeType === 'application/pdf') return <FileType size={16} className="text-red-500 mr-1" />; // Or specific PDF icon
    return <Paperclip size={16} className="text-secondary-500 mr-1" />;
  };

  const edadMascota = getPetAge(pet.fecha_nacimiento);

  const eventTone: Record<string, { dot: string; text: string }> = {
    [TipoEventoHistorial.CONSULTA]: { dot: 'bg-primary-600', text: 'text-primary-700' },
    [TipoEventoHistorial.CIRUGIA]: { dot: 'bg-error-500', text: 'text-error-600' },
    [TipoEventoHistorial.TRATAMIENTO]: { dot: 'bg-accent-500', text: 'text-accent-700' },
    [TipoEventoHistorial.ENFERMEDAD_REGISTRADA]: { dot: 'bg-warning-500', text: 'text-warning-700' },
    [TipoEventoHistorial.VACUNACION]: { dot: 'bg-success-500', text: 'text-success-700' },
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Encabezado compacto: acciones solo con icono, la etiqueta aparece al pasar el mouse */}
      <div className="flex flex-wrap items-center gap-3 bg-surface border border-secondary-200 rounded-[18px]
                      px-5 py-4 shadow-[0_1px_2px_rgba(15,31,29,0.04)]">
        <IconBtn label="Volver al cliente" onClick={() => navigate(`/clients/${client?.id_cliente || ''}`)}>
          <ArrowLeft size={16} />
        </IconBtn>

        <span className="w-11 h-11 rounded-xl bg-secondary-100 text-secondary-600 flex items-center justify-center flex-shrink-0">
          <SpeciesIcon especie={pet.especie} size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-[22px] font-extrabold tracking-[-0.5px] text-secondary-900 truncate">
            {pet.nombre}
          </h1>
          <p className="m-0 text-[12.5px] text-secondary-500 truncate">
            {pet.especie} · {pet.sexo}
            {edadMascota && (
              <>
                {' · '}
                <span title={`Nacimiento: ${new Date(pet.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-AR')}`}>
                  {edadMascota.label}
                </span>
              </>
            )}
            {' · '}
            <Link to={`/clients/${client?.id_cliente}`} className="text-primary-700 hover:underline">
              {client?.nombre || 'Sin propietario'}
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <IconBtn label="Imprimir historia clínica" onClick={handlePrintMedicalHistory}>
            <Printer size={16} />
          </IconBtn>
          <IconBtn label="Nuevo evento manual" variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
          </IconBtn>
        </div>
      </div>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Nuevo evento para ${pet.nombre}`} size="lg">
          <NewEventFormComponent petId={pet.id_mascota} onSave={handleEventSaved} onClose={() => setIsModalOpen(false)} />
        </Modal>
      )}

      {isEditModalOpen && editingEvent && (
        <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title={`Editar evento de ${pet.nombre}`} size="lg">
          <EditEventFormComponent initialEvent={editingEvent} onSave={handleEditEventSave} onClose={handleCloseEditModal} />
        </Modal>
      )}

      {historyEvents.length > 0 ? (
        <div className="bg-surface border border-secondary-200 rounded-[18px] px-5 py-5 shadow-[0_1px_2px_rgba(15,31,29,0.04)]">
          {/* Linea de tiempo: la barra vertical hace legible el orden cronologico */}
          <ol className="relative m-0 p-0 list-none border-l border-secondary-200 ml-[7px]">
            {historyEvents.map(event => {
              const tone = eventTone[event.tipo_evento] ?? { dot: 'bg-secondary-400', text: 'text-secondary-700' };
              const ref = getReferenceDetails(event);
              const abierto = expandidos.has(event.id_evento);
              const nAdjuntos = event.attachments?.length ?? 0;
              const resumen = event.descripcion.length > 70
                ? `${event.descripcion.slice(0, 70)}\u2026`
                : event.descripcion;
              return (
                <li key={event.id_evento} className="relative pl-6 pb-7 last:pb-0">
                  <span className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-surface ${tone.dot}`} />

                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleEvento(event.id_evento)}
                      aria-expanded={abierto}
                      className="flex items-center gap-2 min-w-0 text-left"
                    >
                      <ChevronRight
                        size={14}
                        className={`text-secondary-400 transition-transform flex-shrink-0 ${abierto ? 'rotate-90' : ''}`}
                      />
                      <span className={tone.text}>{getEventIcon(event.tipo_evento)}</span>
                      <strong className={`text-[14.5px] font-bold ${tone.text} flex-shrink-0`}>{event.tipo_evento}</strong>
                      {!abierto && (
                        <span className="text-[12.5px] text-secondary-500 truncate hidden sm:inline">
                          &mdash; {resumen}
                        </span>
                      )}
                    </button>
                    <span className="flex items-center gap-1.5 flex-shrink-0">
                      {nAdjuntos > 0 && (
                        <span
                          title={`${nAdjuntos} archivo(s) adjunto(s)`}
                          className="flex items-center gap-1 font-mono text-[10.5px] text-secondary-500"
                        >
                          <Paperclip size={12} />{nAdjuntos}
                        </span>
                      )}
                      <span className="font-mono text-[11.5px] text-secondary-500">
                        {new Date(event.fecha).toLocaleString('es-AR', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      <IconBtn label="Editar evento" size="sm" onClick={() => handleOpenEditModal(event)}>
                        <Pencil size={13} />
                      </IconBtn>
                      <IconBtn label="Eliminar evento" size="sm" variant="danger" onClick={() => setDeletingEvent(event)}>
                        <Trash2 size={13} />
                      </IconBtn>
                    </span>
                  </div>

                  {abierto && (
                  <>
                  <p className="mt-2 mb-0 text-[13.5px] text-secondary-700 whitespace-pre-wrap break-words">
                    {event.descripcion}
                  </p>

                  {ref && <p className="mt-1.5 mb-0 text-[12px] text-secondary-500 italic">{ref}</p>}

                  {event.attachments && event.attachments.length > 0 && (
                    <ul className="flex flex-wrap gap-2 mt-3 m-0 p-0 list-none">
                      {event.attachments.map(att => (
                        <li
                          key={att.id}
                          className="flex items-center gap-2 bg-secondary-50 border border-secondary-200
                                     rounded-[10px] pl-2.5 pr-1.5 py-1.5 max-w-full"
                        >
                          {att.type.startsWith('image/') ? (
                            <img src={att.url} alt="" className="w-7 h-7 rounded object-cover border border-secondary-200 flex-shrink-0" />
                          ) : (
                            <span className="flex-shrink-0">{getFileIcon(att.type)}</span>
                          )}
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Abrir ${att.name}`}
                            className="text-[12.5px] text-secondary-800 hover:text-primary-700 truncate max-w-[190px]"
                          >
                            {att.name}
                          </a>
                          <span className="font-mono text-[10.5px] text-secondary-500 flex-shrink-0">
                            {(att.size / 1024).toFixed(0)} KB
                          </span>
                          <IconBtn
                            label="Eliminar archivo"
                            size="sm"
                            variant="danger"
                            onClick={() => setDeletingAttachment({ att, eventId: event.id_evento })}
                          >
                            <Trash2 size={13} />
                          </IconBtn>
                        </li>
                      ))}
                    </ul>
                  )}
                  </>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <div className="bg-surface border border-secondary-200 rounded-[18px] px-5 py-14 flex flex-col items-center gap-3 text-center">
          <span className="w-14 h-14 rounded-[18px] bg-secondary-100 text-primary-700 flex items-center justify-center">
            <FileText size={24} />
          </span>
          <strong className="text-[15px] text-secondary-900">Historial vacío</strong>
          <p className="m-0 max-w-[320px] text-[13px] text-secondary-500">
            Todavía no hay eventos médicos registrados para {pet.nombre}.
          </p>
        </div>
      )}

      <PasswordConfirmDialog
        isOpen={deletingAttachment !== null}
        title="Eliminar archivo adjunto"
        description={
          <>
            Vas a eliminar <strong>{deletingAttachment?.att.name}</strong>. El archivo se borra del
            servidor y no se puede recuperar.
          </>
        }
        onConfirm={async (password) => {
          if (!deletingAttachment) return;
          await deleteAttachment(deletingAttachment.att.id, deletingAttachment.eventId, password);
        }}
        onClose={() => setDeletingAttachment(null)}
      />

      <PasswordConfirmDialog
        isOpen={deletingEvent !== null}
        title="Eliminar evento de la historia clínica"
        description={
          <>
            Vas a eliminar el evento <strong>{deletingEvent?.tipo_evento}</strong> del{' '}
            {deletingEvent && new Date(deletingEvent.fecha).toLocaleDateString('es-AR')}
            {(deletingEvent?.attachments?.length ?? 0) > 0 && (
              <> y sus {deletingEvent!.attachments!.length} archivo(s) adjunto(s)</>
            )}
            . No se puede recuperar.
          </>
        }
        onConfirm={async (password) => {
          if (!deletingEvent) return;
          await deleteMedicalHistoryEvent(deletingEvent.id_evento, password);
        }}
        onClose={() => setDeletingEvent(null)}
      />
    </div>
  );
};
