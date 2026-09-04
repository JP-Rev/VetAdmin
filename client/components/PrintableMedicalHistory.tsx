import React from 'react';
import {
  Mascota, Cliente, HistorialMedico, Enfermedad, Cirugia,
  MascotaEnfermedad, MascotaCirugia, TipoEventoHistorial,
} from '../types';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { getPetAge } from '../lib/petAge';

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

/** Color de la etiqueta según el tipo de evento. */
const TONO_EVENTO: Record<string, { color: string; bg: string }> = {
  [TipoEventoHistorial.CONSULTA]: { color: '#0f766e', bg: '#eef5f3' },
  [TipoEventoHistorial.CIRUGIA]: { color: '#b91c1c', bg: '#fdeeee' },
  [TipoEventoHistorial.TRATAMIENTO]: { color: '#7c3aed', bg: '#f4f0fe' },
  [TipoEventoHistorial.ENFERMEDAD_REGISTRADA]: { color: '#c2410c', bg: '#fff3e9' },
  [TipoEventoHistorial.VACUNACION]: { color: '#15803d', bg: '#eef7f0' },
};
const TONO_POR_DEFECTO = { color: '#0f766e', bg: '#eef5f3' };

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtHora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

const LABEL: React.CSSProperties = {
  display: 'block',
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: '7.5pt',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#0f766e',
  fontWeight: 600,
  marginBottom: '6pt',
};

const TH: React.CSSProperties = {
  textAlign: 'left',
  fontSize: '7.5pt',
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#5c6b68',
  fontWeight: 600,
  borderBottom: '0.75pt solid #d7dedc',
};

const DatosTabla: React.FC<{ filas: { k: string; v: string }[] }> = ({ filas }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
    <tbody>
      {filas.map(f => (
        <tr key={f.k}>
          <td style={{ padding: '1.5pt 0', color: '#5c6b68', whiteSpace: 'nowrap', width: '38%' }}>{f.k}</td>
          <td style={{ padding: '1.5pt 0', fontWeight: 600 }}>{f.v}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const PrintableMedicalHistory: React.FC<PrintableMedicalHistoryProps> = ({
  pet, client, historyEvents, diseases, surgeries, petDiseases, petSurgeries,
}) => {
  const { clinica, getPesajesByPetId } = useSupabaseData();
  const pesajes = getPesajesByPetId(pet.id_mascota);
  const pesoActual = pesajes.length > 0 ? pesajes[pesajes.length - 1] : null;

  const referenciaDe = (event: HistorialMedico): string | null => {
    if (!event.referencia_id) return null;
    const partes: string[] = [];

    if (event.tipo_evento === TipoEventoHistorial.ENFERMEDAD_REGISTRADA) {
      const pd = petDiseases.find(x => x.id_mascota_enfermedad === event.referencia_id);
      if (pd) {
        const enf = diseases.find(d => d.id_enfermedad === pd.enfermedad_id);
        partes.push(`Enfermedad: ${enf?.nombre ?? 'N/D'}`);
        partes.push(`Fecha diag.: ${fmtFecha(pd.fecha_diagnostico + 'T00:00:00')}`);
      }
    }
    if (event.tipo_evento === TipoEventoHistorial.CIRUGIA) {
      const ps = petSurgeries.find(x => x.id_mascota_cirugia === event.referencia_id);
      if (ps) {
        const cir = surgeries.find(s => s.id_cirugia === ps.cirugia_id);
        partes.push(`Cirugía: ${cir?.tipo ?? 'N/D'}`);
        partes.push(`Fecha: ${fmtFecha(ps.fecha + 'T00:00:00')}`);
        if (ps.costo_final) {
          partes.push(`Costo: $${ps.costo_final.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);
        }
      }
    }
    // Para el resto, el id interno no aporta nada al documento impreso.
    return partes.length > 0 ? partes.join(' · ') : null;
  };

  const eventos = [...historyEvents].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  const edad = getPetAge(pet.fecha_nacimiento);
  const nacimiento = pet.fecha_nacimiento
    ? `${fmtFecha(pet.fecha_nacimiento + 'T00:00:00')}${edad ? ` · ${edad.short}` : ''}`
    : 'No registrada';

  const domicilio =
    [[client.calle, client.numero].filter(Boolean).join(' '), client.localidad]
      .filter(Boolean).join(', ') || '—';

  const contactoClinica = [clinica.direccion, clinica.telefono, clinica.email]
    .filter(Boolean).join(' · ');

  const ultimaAtencion = eventos.length > 0 ? fmtFecha(eventos[0].fecha) : '—';
  const ultimaVacuna = eventos.find(e => e.tipo_evento === TipoEventoHistorial.VACUNACION);
  const cantCirugias = eventos.filter(e => e.tipo_evento === TipoEventoHistorial.CIRUGIA).length;

  const resumen = [
    { label: 'Eventos registrados', value: String(eventos.length) },
    { label: 'Última atención', value: ultimaAtencion },
    { label: 'Última vacunación', value: ultimaVacuna ? fmtFecha(ultimaVacuna.fecha) : '—' },
    { label: 'Cirugías', value: String(cantCirugias) },
  ];

  const ahora = new Date();
  const generado = `Generado ${ahora.toLocaleDateString('es-AR')} ${ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })} h`;
  const inicial = (clinica.nombre || 'V').trim().charAt(0).toUpperCase();

  return (
    <div className="printable-area hc-doc">
      {/*
        El documento va dentro de una tabla cuyo thead/tfoot el navegador
        repite en cada hoja impresa. Se usa esto en vez de `position: fixed`
        porque los elementos fijos no reservan espacio en el flujo: a partir de
        la segunda pagina el contenido se les superponia.
      */}
      <table className="hc-page">
        <thead>
          <tr><td>
            <div className="hc-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '9pt' }}>
          <span style={{
            width: '24pt', height: '24pt', borderRadius: '7pt', background: '#0f766e', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12pt', fontWeight: 800,
          }}>{inicial}</span>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <strong style={{ fontSize: '12.5pt', fontWeight: 800, letterSpacing: '-0.2pt' }}>
              {clinica.nombre}
            </strong>
            {contactoClinica && (
              <span style={{ fontSize: '8pt', color: '#5c6b68' }}>{contactoClinica}</span>
            )}
          </span>
        </div>
        <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
          <span style={{ ...LABEL, marginBottom: 0 }}>Historia clínica</span>
          <span style={{ display: 'block', fontSize: '9pt', color: '#5c6b68' }}>
            {[pet.nombre, pet.especie, pet.raza_nombre].filter(Boolean).join(' · ')}
          </span>
        </div>
            </div>
          </td></tr>
        </thead>

        <tfoot>
          <tr><td>
            <div className="hc-footer">
              <span>{clinica.nombre} · Documento confidencial de uso veterinario</span>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{generado}</span>
            </div>
          </td></tr>
        </tfoot>

        <tbody><tr><td>
      <div className="hc-body">
        <h1 style={{ margin: '0 0 2pt', fontSize: '21pt', fontWeight: 800, letterSpacing: '-0.6pt', lineHeight: 1.15 }}>
          Historia clínica veterinaria
        </h1>
        <p style={{ margin: '0 0 14pt', fontSize: '10pt', color: '#5c6b68' }}>
          Registro cronológico de consultas, tratamientos, vacunaciones, enfermedades y cirugías.
        </p>

        {/* Paciente y propietario */}
        <table style={{
          width: '100%', borderCollapse: 'collapse', marginBottom: '14pt',
          background: '#f5f8f7', border: '0.75pt solid #dde5e3', breakInside: 'avoid',
        }}>
          <tbody>
            <tr>
              <td style={{ padding: '10pt 12pt', verticalAlign: 'top', width: '50%', borderRight: '0.75pt solid #dde5e3' }}>
                <span style={LABEL}>Paciente</span>
                <strong style={{ display: 'block', fontSize: '14pt', fontWeight: 800, letterSpacing: '-0.3pt', marginBottom: '5pt' }}>
                  {pet.nombre}
                </strong>
                <DatosTabla filas={[
                  { k: 'Especie', v: pet.especie },
                  { k: 'Raza', v: pet.raza_nombre },
                  { k: 'Sexo', v: pet.sexo },
                  { k: 'Nacimiento', v: nacimiento },
                  { k: 'Peso', v: pesoActual ? `${pesoActual.peso.toLocaleString('es-AR')} kg (${fmtFecha(pesoActual.fecha + 'T00:00:00')})` : 'No registrado' },
                ]} />
              </td>
              <td style={{ padding: '10pt 12pt', verticalAlign: 'top', width: '50%' }}>
                <span style={LABEL}>Propietario</span>
                <strong style={{ display: 'block', fontSize: '14pt', fontWeight: 800, letterSpacing: '-0.3pt', marginBottom: '5pt' }}>
                  {client.nombre}
                </strong>
                <DatosTabla filas={[
                  { k: 'Teléfono', v: client.telefono || '—' },
                  ...(client.telefono_alt ? [{ k: 'Alternativo', v: client.telefono_alt }] : []),
                  { k: 'Email', v: client.email || '—' },
                  { k: 'Domicilio', v: domicilio },
                ]} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Resumen */}
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4pt 0', marginBottom: '16pt', breakInside: 'avoid' }}>
          <tbody>
            <tr>
              {resumen.map(r => (
                <td key={r.label} style={{
                  width: '25%', border: '0.75pt solid #dde5e3', padding: '8pt 10pt', verticalAlign: 'top',
                }}>
                  <span style={{ display: 'block', fontSize: '8pt', color: '#5c6b68', marginBottom: '2pt' }}>{r.label}</span>
                  <strong style={{ fontSize: '15pt', fontWeight: 800, letterSpacing: '-0.4pt', fontVariantNumeric: 'tabular-nums' }}>
                    {r.value}
                  </strong>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {pesajes.length > 1 && (
          <>
            <h2 style={{
              margin: '0 0 8pt', fontSize: '12pt', fontWeight: 700, letterSpacing: '-0.2pt',
              paddingBottom: '4pt', borderBottom: '0.75pt solid #d7dedc',
            }}>
              Evolución del peso
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt', marginBottom: '16pt', breakInside: 'avoid' }}>
              <thead>
                <tr>
                  <th style={{ ...TH, padding: '5pt 8pt 5pt 0' }}>Fecha</th>
                  <th style={{ ...TH, padding: '5pt 8pt', textAlign: 'right' }}>Peso</th>
                  <th style={{ ...TH, padding: '5pt 0 5pt 8pt', textAlign: 'right' }}>Variación</th>
                </tr>
              </thead>
              <tbody>
                {[...pesajes].reverse().map((pj, i, arr) => {
                  const previo = arr[i + 1];
                  const delta = previo ? Number((pj.peso - previo.peso).toFixed(2)) : null;
                  return (
                    <tr key={pj.id_pesaje}>
                      <td style={{ padding: '3pt 8pt 3pt 0', borderBottom: '0.5pt solid #e8edec', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '9pt' }}>
                        {fmtFecha(pj.fecha + 'T00:00:00')}
                      </td>
                      <td style={{ padding: '3pt 8pt', borderBottom: '0.5pt solid #e8edec', textAlign: 'right', fontWeight: 600 }}>
                        {pj.peso.toLocaleString('es-AR')} kg
                      </td>
                      <td style={{ padding: '3pt 0 3pt 8pt', borderBottom: '0.5pt solid #e8edec', textAlign: 'right', color: '#5c6b68', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '9pt' }}>
                        {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toLocaleString('es-AR')} kg`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        <h2 style={{
          margin: '0 0 8pt', fontSize: '12pt', fontWeight: 700, letterSpacing: '-0.2pt',
          paddingBottom: '4pt', borderBottom: '0.75pt solid #d7dedc',
        }}>
          Eventos médicos
        </h2>

        {eventos.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
            <thead>
              <tr>
                <th style={{ ...TH, padding: '5pt 8pt 5pt 0', width: '82pt' }}>Fecha</th>
                <th style={{ ...TH, padding: '5pt 8pt', width: '96pt' }}>Tipo</th>
                <th style={{ ...TH, padding: '5pt 0 5pt 8pt' }}>Detalle clínico</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map(e => {
                const tono = TONO_EVENTO[e.tipo_evento] ?? TONO_POR_DEFECTO;
                const referencia = referenciaDe(e);
                const adjuntos = (e.attachments ?? []).map(a => a.name).join(', ');
                return (
                  <tr key={e.id_evento} style={{ breakInside: 'avoid' }}>
                    <td style={{
                      padding: '8pt 8pt 8pt 0', verticalAlign: 'top', borderBottom: '0.5pt solid #e8edec',
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '9pt',
                    }}>
                      <strong style={{ display: 'block', fontWeight: 600 }}>{fmtFecha(e.fecha)}</strong>
                      <span style={{ color: '#7a8886' }}>{fmtHora(e.fecha)} h</span>
                    </td>
                    <td style={{ padding: '8pt', verticalAlign: 'top', borderBottom: '0.5pt solid #e8edec' }}>
                      <span style={{
                        display: 'inline-block', fontSize: '8.5pt', fontWeight: 700, padding: '2pt 6pt',
                        borderLeft: `2.5pt solid ${tono.color}`, background: tono.bg, color: '#16211f',
                      }}>
                        {e.tipo_evento}
                      </span>
                    </td>
                    <td style={{ padding: '8pt 0 8pt 8pt', verticalAlign: 'top', borderBottom: '0.5pt solid #e8edec' }}>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{e.descripcion}</p>
                      {referencia && (
                        <p style={{ margin: '4pt 0 0', fontSize: '9pt', color: '#5c6b68' }}>
                          <strong style={{ fontWeight: 600 }}>Referencia:</strong> {referencia}
                        </p>
                      )}
                      {adjuntos && (
                        <p style={{ margin: '3pt 0 0', fontSize: '9pt', color: '#5c6b68' }}>
                          <strong style={{ fontWeight: 600 }}>Adjuntos:</strong> {adjuntos}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{
            margin: '10pt 0', padding: '14pt', border: '0.75pt dashed #cfd8d6',
            textAlign: 'center', color: '#5c6b68', fontSize: '10pt',
          }}>
            No hay eventos médicos registrados para este paciente.
          </p>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '26pt', breakInside: 'avoid' }}>
          <tbody>
            <tr>
              <td style={{ width: '46%', paddingTop: '26pt', borderTop: '0.75pt solid #16211f', fontSize: '9pt', color: '#5c6b68', verticalAlign: 'top' }}>
                Firma y sello del profesional
              </td>
              <td style={{ width: '8%' }} />
              <td style={{ width: '46%', paddingTop: '26pt', borderTop: '0.75pt solid #16211f', fontSize: '9pt', color: '#5c6b68', verticalAlign: 'top' }}>
                Aclaración y matrícula
              </td>
            </tr>
          </tbody>
        </table>
      </div>
        </td></tr></tbody>
      </table>
    </div>
  );
};
