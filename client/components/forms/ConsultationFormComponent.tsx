import React, { useState } from 'react';
import { Turno, TipoEventoHistorial, ConsultationFormState } from '../../types';
import { useSupabaseData } from '../../contexts/SupabaseDataContext';
import { Button } from '../common/Button';
import { FormField } from '../common/FormField';
import { SpeciesIcon } from '../../lib/speciesIcon';
import {
  Plus, Trash2, FileText, Thermometer, Scissors, Syringe, Paperclip, Upload, X,
} from 'lucide-react';

interface ConsultationFormComponentProps {
  appointment: Turno;
  onSave: () => void;
  onClose: () => void;
}

const generateLocalId = () => `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

const fmtSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

type TabKey = 'consulta' | 'enfermedades' | 'cirugias' | 'vacunas' | 'archivos';

/** Fila de un item ya agregado, con su acción de quitar. */
const AddedRow: React.FC<{ title: string; detail?: string; onRemove: () => void }> = ({ title, detail, onRemove }) => (
  <li className="flex items-center gap-3 bg-surface border border-secondary-200 rounded-[10px] px-3 py-2.5">
    <span className="flex-1 min-w-0 flex flex-col">
      <span className="text-[13px] font-semibold text-secondary-900 truncate">{title}</span>
      {detail && <span className="text-[11.5px] text-secondary-500 truncate">{detail}</span>}
    </span>
    <button
      type="button"
      onClick={onRemove}
      title="Quitar"
      aria-label={`Quitar ${title}`}
      className="w-[30px] h-[30px] rounded-lg border border-error-200 text-error-600 hover:bg-error-50
                 flex items-center justify-center flex-shrink-0 transition-colors"
    >
      <Trash2 size={14} />
    </button>
  </li>
);

const EmptyHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="m-0 text-[12.5px] text-secondary-500">{children}</p>
);

export const ConsultationFormComponent: React.FC<ConsultationFormComponentProps> = ({ appointment, onSave, onClose }) => {
  const { getPetById, getClientById, diseases, surgeries, addMedicalHistoryEvent, recordPetDisease, recordPetSurgery } = useSupabaseData();

  const pet = getPetById(appointment.mascota_id);
  const client = getClientById(appointment.cliente_id);

  const [tab, setTab] = useState<TabKey>('consulta');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formState, setFormState] = useState<ConsultationFormState>({
    mainDescription: '',
    eventDate: appointment.fecha,
    diseases: [],
    surgeries: [],
    vaccinations: [],
    attachments: [],
  });

  const [tempDisease, setTempDisease] = useState({ diseaseId: '', notes: '' });
  const [tempSurgery, setTempSurgery] = useState({ surgeryId: '', notes: '', cost: '' });
  const [tempVaccination, setTempVaccination] = useState({ vaccineName: '', notes: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleAddDisease = () => {
    if (!tempDisease.diseaseId) { setError('Elegí una enfermedad antes de agregarla.'); return; }
    setFormState(prev => ({ ...prev, diseases: [...prev.diseases, { ...tempDisease, id: generateLocalId() }] }));
    setTempDisease({ diseaseId: '', notes: '' });
    setError(null);
  };

  const handleAddSurgery = () => {
    if (!tempSurgery.surgeryId) { setError('Elegí una cirugía antes de agregarla.'); return; }
    if (tempSurgery.cost && (isNaN(parseFloat(tempSurgery.cost)) || parseFloat(tempSurgery.cost) < 0)) {
      setError('El costo de la cirugía no es válido.'); return;
    }
    setFormState(prev => ({ ...prev, surgeries: [...prev.surgeries, { ...tempSurgery, id: generateLocalId() }] }));
    setTempSurgery({ surgeryId: '', notes: '', cost: '' });
    setError(null);
  };

  const handleAddVaccination = () => {
    if (!tempVaccination.vaccineName.trim()) { setError('Escribí el nombre de la vacuna.'); return; }
    setFormState(prev => ({ ...prev, vaccinations: [...prev.vaccinations, { ...tempVaccination, id: generateLocalId() }] }));
    setTempVaccination({ vaccineName: '', notes: '' });
    setError(null);
  };

  const handleFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setFormState(prev => ({ ...prev, attachments: [...prev.attachments, ...Array.from(e.target.files!)] }));
    e.target.value = ''; // permite volver a elegir el mismo archivo
    setError(null);
  };

  const removeFrom = (key: 'diseases' | 'surgeries' | 'vaccinations', id: string) =>
    setFormState(prev => ({ ...prev, [key]: (prev[key] as { id: string }[]).filter(x => x.id !== id) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { mainDescription, diseases: ds, surgeries: ss, vaccinations: vs, attachments } = formState;

    if (!mainDescription.trim() && !ds.length && !ss.length && !vs.length && !attachments.length) {
      setError('Cargá al menos una observación, un registro o un archivo antes de guardar.');
      setTab('consulta');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const eventDateTime = `${formState.eventDate} ${appointment.hora}`;

      let description = mainDescription.trim();
      if (!description && attachments.length > 0) {
        description = `Consulta con ${attachments.length} archivo(s) adjunto(s).`;
      }

      if (description) {
        await addMedicalHistoryEvent(
          appointment.mascota_id, TipoEventoHistorial.CONSULTA, description,
          appointment.id_turno, eventDateTime, attachments
        );
      }

      for (const d of ds) {
        await recordPetDisease(appointment.mascota_id, d.diseaseId, formState.eventDate, d.notes, eventDateTime);
      }
      for (const s of ss) {
        await recordPetSurgery(
          appointment.mascota_id, s.surgeryId, formState.eventDate, s.notes,
          s.cost ? parseFloat(s.cost) : undefined, eventDateTime
        );
      }
      for (const v of vs) {
        await addMedicalHistoryEvent(
          appointment.mascota_id, TipoEventoHistorial.VACUNACION,
          `Vacuna: ${v.vaccineName}${v.notes ? `. ${v.notes}` : ''}`, undefined, eventDateTime
        );
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la consulta.');
    } finally {
      setSaving(false);
    }
  };

  if (!pet || !client) return <p className="text-secondary-600">Cargando datos de la consulta…</p>;

  const diseaseOptions = diseases.map(d => ({ value: d.id_enfermedad, label: d.nombre })).sort((a, b) => a.label.localeCompare(b.label));
  const surgeryOptions = surgeries.map(s => ({ value: s.id_cirugia, label: s.tipo })).sort((a, b) => a.label.localeCompare(b.label));

  const TABS: { key: TabKey; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'consulta', label: 'Consulta', icon: <FileText size={15} />, count: 0 },
    { key: 'enfermedades', label: 'Enfermedades', icon: <Thermometer size={15} />, count: formState.diseases.length },
    { key: 'cirugias', label: 'Cirugías', icon: <Scissors size={15} />, count: formState.surgeries.length },
    { key: 'vacunas', label: 'Vacunas', icon: <Syringe size={15} />, count: formState.vaccinations.length },
    { key: 'archivos', label: 'Archivos', icon: <Paperclip size={15} />, count: formState.attachments.length },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Contexto del turno */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary-50 border border-secondary-200">
        <span className="w-10 h-10 rounded-xl bg-surface border border-secondary-200 text-secondary-600 flex items-center justify-center flex-shrink-0">
          <SpeciesIcon especie={pet.especie} size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[14px] font-bold text-secondary-900 truncate">{pet.nombre}</p>
          <p className="m-0 text-[12px] text-secondary-500 truncate">
            {client.nombre} · {appointment.motivo}
          </p>
        </div>
        <label className="flex flex-col flex-shrink-0">
          <span className="text-[11px] font-semibold text-secondary-600 mb-1">Fecha</span>
          <input
            type="date" name="eventDate" value={formState.eventDate} onChange={handleInputChange} required
            className="bg-surface border border-secondary-300 rounded-lg px-2.5 py-1.5 text-[12.5px]
                       text-secondary-900 outline-none focus:border-primary-500 transition-colors"
          />
        </label>
      </div>

      {/* Pestañas: el contador deja ver qué se cargó sin recorrer todo el formulario */}
      <div className="flex gap-1 border-b border-secondary-200 -mb-px overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-selected={tab === t.key}
            role="tab"
            className={`flex items-center gap-2 px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap
                        border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-secondary-500 hover:text-secondary-800'
            }`}
          >
            {t.icon}
            {t.label}
            {t.count > 0 && (
              <span className="font-mono text-[10px] font-bold bg-primary-600 text-white px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="min-h-[240px]">
        {tab === 'consulta' && (
          <FormField
            label="Observaciones de la consulta"
            name="mainDescription"
            as="textarea"
            value={formState.mainDescription}
            onChange={handleInputChange}
            rows={9}
            placeholder="Diagnóstico, tratamiento indicado, evolución…"
            className="mb-0"
          />
        )}

        {tab === 'enfermedades' && (
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
              <FormField
                label="Enfermedad" name="tempDiseaseId" as="searchable-select"
                value={tempDisease.diseaseId}
                onChange={e => setTempDisease(p => ({ ...p, diseaseId: e.target.value }))}
                options={diseaseOptions} placeholder="Buscar enfermedad…" className="mb-0"
              />
              <FormField
                label="Observaciones" name="tempDiseaseNotes"
                value={tempDisease.notes}
                onChange={e => setTempDisease(p => ({ ...p, notes: e.target.value }))}
                placeholder="Opcional" className="mb-0"
              />
              <Button type="button" onClick={handleAddDisease} leftIcon={<Plus />} className="h-[42px]">Agregar</Button>
            </div>
            {formState.diseases.length > 0 ? (
              <ul className="flex flex-col gap-2 m-0 p-0 list-none">
                {formState.diseases.map(d => (
                  <AddedRow
                    key={d.id}
                    title={diseases.find(x => x.id_enfermedad === d.diseaseId)?.nombre ?? 'Enfermedad'}
                    detail={d.notes || undefined}
                    onRemove={() => removeFrom('diseases', d.id)}
                  />
                ))}
              </ul>
            ) : <EmptyHint>Todavía no agregaste enfermedades a esta consulta.</EmptyHint>}
          </div>
        )}

        {tab === 'cirugias' && (
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px_auto] items-end">
              <FormField
                label="Cirugía" name="tempSurgeryId" as="searchable-select"
                value={tempSurgery.surgeryId}
                onChange={e => setTempSurgery(p => ({ ...p, surgeryId: e.target.value }))}
                options={surgeryOptions} placeholder="Buscar cirugía…" className="mb-0"
              />
              <FormField
                label="Observaciones" name="tempSurgeryNotes"
                value={tempSurgery.notes}
                onChange={e => setTempSurgery(p => ({ ...p, notes: e.target.value }))}
                placeholder="Opcional" className="mb-0"
              />
              <FormField
                label="Costo ($)" name="tempSurgeryCost" type="number" step="0.01"
                value={tempSurgery.cost}
                onChange={e => setTempSurgery(p => ({ ...p, cost: e.target.value }))}
                placeholder="Opcional" className="mb-0"
              />
              <Button type="button" onClick={handleAddSurgery} leftIcon={<Plus />} className="h-[42px]">Agregar</Button>
            </div>
            {formState.surgeries.length > 0 ? (
              <ul className="flex flex-col gap-2 m-0 p-0 list-none">
                {formState.surgeries.map(s => (
                  <AddedRow
                    key={s.id}
                    title={surgeries.find(x => x.id_cirugia === s.surgeryId)?.tipo ?? 'Cirugía'}
                    detail={[s.notes, s.cost ? `$${s.cost}` : null].filter(Boolean).join(' · ') || undefined}
                    onRemove={() => removeFrom('surgeries', s.id)}
                  />
                ))}
              </ul>
            ) : <EmptyHint>Todavía no agregaste cirugías a esta consulta.</EmptyHint>}
          </div>
        )}

        {tab === 'vacunas' && (
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
              <FormField
                label="Nombre de la vacuna" name="tempVaccineName"
                value={tempVaccination.vaccineName}
                onChange={e => setTempVaccination(p => ({ ...p, vaccineName: e.target.value }))}
                placeholder="Ej: Antirrábica" className="mb-0"
              />
              <FormField
                label="Lote / observaciones" name="tempVaccineNotes"
                value={tempVaccination.notes}
                onChange={e => setTempVaccination(p => ({ ...p, notes: e.target.value }))}
                placeholder="Opcional" className="mb-0"
              />
              <Button type="button" onClick={handleAddVaccination} leftIcon={<Plus />} className="h-[42px]">Agregar</Button>
            </div>
            {formState.vaccinations.length > 0 ? (
              <ul className="flex flex-col gap-2 m-0 p-0 list-none">
                {formState.vaccinations.map(v => (
                  <AddedRow
                    key={v.id} title={v.vaccineName} detail={v.notes || undefined}
                    onRemove={() => removeFrom('vaccinations', v.id)}
                  />
                ))}
              </ul>
            ) : <EmptyHint>Todavía no registraste vacunas en esta consulta.</EmptyHint>}
          </div>
        )}

        {tab === 'archivos' && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-xl border-2 border-dashed
                              border-secondary-300 hover:border-primary-500 hover:bg-primary-50/40 cursor-pointer transition-colors">
              <Upload size={22} className="text-secondary-500" />
              <span className="text-[13px] font-semibold text-secondary-700">Elegí archivos para adjuntar</span>
              <span className="text-[11.5px] text-secondary-500">Estudios, radiografías, fotos o PDFs</span>
              <input type="file" multiple onChange={handleFilesPicked} className="hidden" />
            </label>

            {formState.attachments.length > 0 && (
              <ul className="flex flex-col gap-2 m-0 p-0 list-none">
                {formState.attachments.map((file, i) => (
                  <li key={`${file.name}-${i}`} className="flex items-center gap-3 bg-surface border border-secondary-200 rounded-[10px] px-3 py-2.5">
                    <Paperclip size={15} className="text-secondary-500 flex-shrink-0" />
                    <span className="flex-1 min-w-0 flex flex-col">
                      <span className="text-[13px] font-medium text-secondary-900 truncate">{file.name}</span>
                      <span className="text-[11.5px] text-secondary-500">{fmtSize(file.size)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormState(prev => ({ ...prev, attachments: prev.attachments.filter((_, j) => j !== i) }))}
                      title="Quitar archivo"
                      aria-label={`Quitar ${file.name}`}
                      className="w-[30px] h-[30px] rounded-lg border border-secondary-200 text-secondary-600
                                 hover:bg-secondary-100 flex items-center justify-center flex-shrink-0 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="m-0 text-[13px] text-error-600 bg-error-50 border border-error-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar consulta'}
        </Button>
      </div>
    </form>
  );
};
