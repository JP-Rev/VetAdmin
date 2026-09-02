import React from 'react';
import { Modal } from '../Modal';
import { Button } from './Button';
import { ShieldAlert } from 'lucide-react';

interface PasswordConfirmDialogProps {
  isOpen: boolean;
  title: string;
  /** Qué se va a borrar, en una frase. */
  description: React.ReactNode;
  confirmLabel?: string;
  onConfirm: (password: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Confirmación de una acción destructiva reingresando la contraseña.
 * El error del backend (contraseña incorrecta) se muestra dentro del diálogo,
 * sin cerrarlo, para poder reintentar.
 */
export const PasswordConfirmDialog: React.FC<PasswordConfirmDialogProps> = ({
  isOpen, title, description, confirmLabel = 'Eliminar', onConfirm, onClose,
}) => {
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [working, setWorking] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setWorking(false);
      // el modal monta el contenido, damos un tick antes de enfocar
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setError('Ingresá tu contraseña.'); return; }
    setWorking(true);
    setError(null);
    try {
      await onConfirm(password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la acción.');
      setPassword('');
      inputRef.current?.focus();
    } finally {
      setWorking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3 p-3.5 rounded-xl bg-error-50 border border-error-200">
          <ShieldAlert size={20} className="text-error-600 flex-shrink-0 mt-0.5" />
          <div className="text-[13px] text-error-700 min-w-0">{description}</div>
        </div>

        <label className="block">
          <span className="block text-[12.5px] font-semibold text-secondary-700 mb-1.5">
            Confirmá con tu contraseña
          </span>
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(null); }}
            autoComplete="current-password"
            className="w-full bg-surface border border-secondary-300 rounded-[10px] px-3.5 py-2.5 text-[13.5px]
                       text-secondary-900 outline-none focus:border-primary-500 transition-colors"
          />
        </label>

        {error && <p className="m-0 text-[13px] text-error-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={working}>Cancelar</Button>
          <Button type="submit" variant="danger" disabled={working}>
            {working ? 'Eliminando…' : confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
