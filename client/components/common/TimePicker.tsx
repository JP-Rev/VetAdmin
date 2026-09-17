import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { normalizarHora } from '../../lib/hora';

interface TimePickerProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: { target: { name: string; value: string } }) => void;
  /** Horarios ofrecidos. Son sugerencias: no limitan lo que se puede escribir. */
  sugerencias: string[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

/**
 * Campo de hora: se escribe a mano o se elige de una lista que se cierra al
 * elegir.
 *
 * Reemplaza al `<input type="time">`, cuyo desplegable es el del navegador y
 * queda abierto después de elegir los minutos — no hay API para cerrarlo desde
 * la página (existe `showPicker()`, no hay `hidePicker()`).
 *
 * Las sugerencias no restringen nada: el horario se puede escribir libremente y
 * puede caer fuera de la franja configurada. La disponibilidad real la maneja el
 * profesional, así que tampoco se bloquean horarios ya ocupados.
 */
export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  name,
  value,
  onChange,
  sugerencias,
  required = false,
  disabled = false,
  error,
  className = '',
}) => {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState(value);
  const [resaltado, setResaltado] = useState(-1);
  const listaRef = useRef<HTMLDivElement>(null);

  // Mientras no se está editando, el campo muestra lo que diga el formulario.
  useEffect(() => { setTexto(value); }, [value]);

  const filtradas = (() => {
    const t = texto.trim();
    if (!t || t === value) return sugerencias;
    const coincide = sugerencias.filter(
      (s) => s.startsWith(t) || s.startsWith(t.padStart(2, '0'))
    );
    // Sin coincidencias se muestran todas: una lista vacía no ayuda a nadie, y
    // lo tipeado se acepta igual al salir del campo.
    return coincide.length > 0 ? coincide : sugerencias;
  })();

  // Deja visible la opción resaltada al moverse con las flechas.
  useEffect(() => {
    if (!abierto || resaltado < 0 || !listaRef.current) return;
    const item = listaRef.current.children[resaltado] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [abierto, resaltado]);

  // Al abrir, posiciona la lista en el horario actual en vez de arriba de todo.
  useEffect(() => {
    if (!abierto) return;
    const i = filtradas.indexOf(value);
    setResaltado(i);
    if (i >= 0 && listaRef.current) {
      const item = listaRef.current.children[i] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'center' });
    }
    // Sólo al abrir: seguir a `filtradas` haría saltar la lista mientras se tipea.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  /**
   * Al salir del campo se interpreta lo tipeado. Si no hay forma de leerlo como
   * hora se vuelve al último valor válido: así el formulario nunca guarda un
   * horario inventado, y el cambio a la vista deja claro que no se tomó.
   */
  const cerrarYNormalizar = () => {
    setAbierto(false);
    const normalizada = normalizarHora(texto);
    if (normalizada && normalizada !== value) onChange({ target: { name, value: normalizada } });
    setTexto(normalizada ?? value);
  };

  const elegir = (hora: string) => {
    onChange({ target: { name, value: hora } });
    setTexto(hora);
    setAbierto(false);
  };

  const teclas = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!abierto) { setAbierto(true); return; }
      setResaltado((prev) => {
        const ultimo = filtradas.length - 1;
        if (e.key === 'ArrowDown') return prev < ultimo ? prev + 1 : 0;
        return prev > 0 ? prev - 1 : ultimo;
      });
      return;
    }
    if (e.key === 'Enter') {
      // No enviar el formulario desde acá: primero se resuelve el campo.
      e.preventDefault();
      if (abierto && resaltado >= 0 && filtradas[resaltado]) elegir(filtradas[resaltado]);
      else cerrarYNormalizar();
      return;
    }
    if (e.key === 'Escape') {
      setTexto(value);
      setAbierto(false);
    }
  };

  const claseInput = `mt-1 block w-full pl-9 pr-9 py-2 border ${
    error ? 'border-error-500' : 'border-secondary-300'
  } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
    disabled ? 'bg-secondary-100 cursor-not-allowed' : 'bg-surface'
  }`;

  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-secondary-700">
        {label} {required && <span className="text-error-500">*</span>}
      </label>

      <div className="relative">
        <Clock size={16} className="absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-secondary-400 pointer-events-none" />
        <input
          id={name}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={abierto}
          aria-autocomplete="list"
          // Teclado numérico en el celular sin perder el tipeo libre.
          inputMode="numeric"
          autoComplete="off"
          placeholder="HH:MM"
          value={texto}
          disabled={disabled}
          required={required}
          onChange={(e) => { setTexto(e.target.value); setAbierto(true); setResaltado(-1); }}
          onFocus={() => setAbierto(true)}
          // Cierra y normaliza al perder el foco: cubre tanto el Tab como el
          // click afuera. Elegir del desplegable NO pasa por acá, porque las
          // opciones cancelan el mousedown para no robarle el foco al input.
          onBlur={cerrarYNormalizar}
          onKeyDown={teclas}
          className={claseInput}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label="Ver horarios"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (abierto ? cerrarYNormalizar() : setAbierto(true))}
          className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 disabled:cursor-not-allowed"
        >
          <ChevronDown size={16} className={`transform transition-transform ${abierto ? 'rotate-180' : ''}`} />
        </button>

        {abierto && filtradas.length > 0 && (
          <div
            ref={listaRef}
            role="listbox"
            aria-label="Horarios sugeridos"
            className="absolute z-50 w-full mt-1 bg-surface border border-secondary-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {filtradas.map((hora, i) => (
              <button
                key={hora}
                type="button"
                role="option"
                aria-selected={hora === value}
                // `onMouseDown` y no `onClick`: el blur del input se dispara
                // antes que el click y cerraría la lista sin haber elegido.
                onMouseDown={(e) => { e.preventDefault(); elegir(hora); }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-primary-50 ${
                  i === resaltado ? 'bg-primary-100' : ''
                } ${hora === value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-secondary-900'}`}
              >
                {hora}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
    </div>
  );
};
