import React, { useEffect, useState } from 'react';
import { Camera, Upload, FileImage, FileVideo, FileType, Paperclip } from 'lucide-react';

/**
 * Selección de archivos adjuntos, compartida por los tres lugares que suben
 * cosas a la historia clínica (nuevo evento, edición de evento y atender
 * consulta), para que el límite de tamaño y el botón de cámara sean los mismos
 * en todos.
 */

/** Debe coincidir con el límite de multer en server/src/storage.js. */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export const fmtFileSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;

/**
 * `capture` abre directamente la cámara en Android/iOS, pero en una notebook el
 * navegador lo ignora y termina siendo un segundo "elegir archivo" que confunde.
 * El puntero grueso es la señal de que hay una pantalla táctil detrás.
 */
const usaCamara = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(pointer: coarse)').matches;
};

interface AttachmentPickerProps {
  /** Prefijo para los id de los input, único por formulario. */
  id: string;
  onFiles: (files: File[]) => void;
  /** Se llama con el nombre de cada archivo que supera el límite. */
  onTooLarge?: (fileName: string) => void;
  hint?: string;
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  id, onFiles, onTooLarge, hint = 'Estudios, radiografías, fotos o PDFs',
}) => {
  const [mostrarCamara, setMostrarCamara] = useState(false);

  // En el primer render del servidor/hidratación no hay matchMedia confiable,
  // así que la decisión se toma una vez montado.
  useEffect(() => { setMostrarCamara(usaCamara()); }, []);

  const recibir = (e: React.ChangeEvent<HTMLInputElement>) => {
    const elegidos = Array.from(e.target.files ?? []);
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (elegidos.length === 0) return;

    const aceptados = elegidos.filter(f => {
      if (f.size > MAX_ATTACHMENT_BYTES) { onTooLarge?.(f.name); return false; }
      return true;
    });
    if (aceptados.length > 0) onFiles(aceptados);
  };

  const estilo = `flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed
                  border-secondary-300 text-secondary-700 hover:border-primary-500 hover:bg-primary-50/40
                  cursor-pointer transition-colors text-[13px] font-semibold`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor={`${id}-archivos`} className={estilo}>
          <Upload size={17} className="text-secondary-500 flex-shrink-0" />
          Elegir archivos
          <input id={`${id}-archivos`} type="file" multiple onChange={recibir} className="hidden" />
        </label>

        {mostrarCamara && (
          <label htmlFor={`${id}-foto`} className={estilo}>
            <Camera size={17} className="text-secondary-500 flex-shrink-0" />
            Sacar foto
            {/* `capture="environment"` = cámara trasera, la útil para una lesión. */}
            <input
              id={`${id}-foto`}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={recibir}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="m-0 text-[11.5px] text-secondary-500">
        {hint} · hasta {MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB por archivo.
      </p>
    </div>
  );
};

/**
 * Miniatura de un archivo todavía no subido. Para una foto el nombre
 * (`IMG_20260913.jpg`) no dice nada, la imagen sí.
 */
export const FileThumb: React.FC<{ file: File; size?: number }> = ({ file, size = 34 }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file.type.startsWith('image/')) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => { URL.revokeObjectURL(objectUrl); setUrl(null); };
  }, [file]);

  const caja = { width: size, height: size };

  if (url) {
    return (
      <img
        src={url}
        alt={`Vista previa de ${file.name}`}
        style={caja}
        className="rounded-lg object-cover border border-secondary-200 flex-shrink-0"
      />
    );
  }

  const icono = file.type.startsWith('video/')
    ? <FileVideo size={16} className="text-purple-500" />
    : file.type === 'application/pdf'
    ? <FileType size={16} className="text-red-500" />
    : file.type.startsWith('image/')
    ? <FileImage size={16} className="text-blue-500" />
    : <Paperclip size={16} className="text-secondary-500" />;

  return (
    <span style={caja} className="rounded-lg bg-secondary-100 flex items-center justify-center flex-shrink-0">
      {icono}
    </span>
  );
};
