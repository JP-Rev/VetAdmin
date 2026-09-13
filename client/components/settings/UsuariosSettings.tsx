import React, { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../Modal';
import { Button } from '../common/Button';
import { FormField } from '../common/FormField';
import { PasswordConfirmDialog } from '../common/PasswordConfirmDialog';
import { Plus, Edit3, Trash2, Search, X, UserRound, ShieldAlert } from 'lucide-react';

interface Usuario {
  id_usuario: string;
  email: string;
  createdAt: string;
}

const MIN_PASSWORD = 8;

/**
 * Alta y baja de quienes pueden entrar al sistema. No hay roles: todos ven
 * todo, así que dar de alta a alguien es darle la llave entera.
 *
 * Los usuarios no viajan en /api/bootstrap (no son datos de la veterinaria),
 * así que esta pantalla se maneja su propia lista.
 */
export const UsuariosSettings: React.FC = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [aEliminar, setAEliminar] = useState<Usuario | null>(null);

  const recargar = async () => {
    try {
      setUsuarios(await apiGet<Usuario[]>('/usuarios'));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los usuarios');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { recargar(); }, []);

  const filtrados = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    return q ? usuarios.filter(u => u.email.toLowerCase().includes(q)) : usuarios;
  }, [usuarios, filtro]);

  const abrirModal = (usuario?: Usuario) => {
    setEditando(usuario ?? null);
    setEmail(usuario?.email ?? '');
    setPassword('');
    setErrorForm(null);
    setModalAbierto(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm(null);

    // En el alta la contraseña es obligatoria; editando, vacía significa
    // "no la toques".
    if ((!editando || password) && password.length < MIN_PASSWORD) {
      setErrorForm(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`);
      return;
    }

    setGuardando(true);
    try {
      if (editando) {
        const cambios: Record<string, string> = {};
        if (email.trim().toLowerCase() !== editando.email) cambios.email = email;
        if (password) cambios.nuevaPassword = password;
        if (Object.keys(cambios).length === 0) {
          setModalAbierto(false);
          return;
        }
        await apiPatch(`/usuarios/${editando.id_usuario}`, cambios);
      } else {
        await apiPost('/usuarios', { email, password });
      }
      await recargar();
      setModalAbierto(false);
    } catch (err) {
      setErrorForm(err instanceof ApiError ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const soyYo = (u: Usuario) => u.email === user?.email;

  return (
    <section>
      <div className="flex flex-col gap-3.5 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-[20px] font-bold tracking-[-0.4px] text-secondary-900">Usuarios</h2>
            <p className="mt-0.5 mb-0 text-[12.5px] text-secondary-500">
              {filtrados.length === usuarios.length
                ? `${usuarios.length} usuario(s)`
                : `${filtrados.length} de ${usuarios.length} usuario(s)`}
            </p>
          </div>
          <Button onClick={() => abrirModal()} leftIcon={<Plus />}>Nuevo Usuario</Button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex items-center gap-2.5 bg-surface border border-secondary-200 rounded-[10px]
                           px-3.5 py-2.5 text-secondary-500 focus-within:border-secondary-300 transition-colors
                           flex-1 min-w-[220px] max-w-md">
            <Search size={16} className="flex-shrink-0" />
            <input
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              placeholder="Buscar por email…"
              className="border-0 outline-none text-[13.5px] text-secondary-900 bg-transparent w-full placeholder:text-secondary-500"
            />
            {filtro && (
              <button type="button" onClick={() => setFiltro('')} title="Limpiar" aria-label="Limpiar búsqueda"
                      className="text-secondary-400 hover:text-secondary-700 flex-shrink-0">
                <X size={14} />
              </button>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 bg-warning-50 border border-warning-200 rounded-xl px-4 py-3 mb-4">
        <ShieldAlert size={17} className="text-warning-700 flex-shrink-0 mt-0.5" />
        <p className="m-0 text-[12.5px] text-warning-800">
          No hay permisos por usuario: cualquiera que entre ve y edita todo el sistema.
          Conviene que al menos uno tenga un email real, porque es a donde llega el link
          para recuperar la contraseña.
        </p>
      </div>

      {error && (
        <p className="m-0 mb-4 text-[13px] text-error-700 bg-error-50 border border-error-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-surface shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Email</th>
              <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Alta</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-secondary-200">
            {filtrados.map(u => (
              <tr key={u.id_usuario} className="hover:bg-secondary-50">
                <td className="px-4 sm:px-6 py-4 text-sm text-secondary-800">
                  <span className="flex items-center gap-2">
                    <UserRound size={15} className="text-secondary-400 flex-shrink-0" />
                    <span className="min-w-0">
                      <span className="block break-all">{u.email}</span>
                      {soyYo(u) && (
                        <span className="text-[11px] font-semibold text-primary-700">tu cuenta</span>
                      )}
                    </span>
                  </span>
                </td>
                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                  {new Date(u.createdAt).toLocaleDateString('es-AR')}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => abrirModal(u)}
                          title="Editar usuario" className="text-accent-600 p-1.5">
                    <Edit3 size={16} />
                  </Button>
                  <Button
                    size="sm" variant="ghost" onClick={() => setAEliminar(u)}
                    disabled={soyYo(u)}
                    title={soyYo(u) ? 'No podés eliminar tu propio usuario' : 'Eliminar usuario'}
                    className="text-error-600 p-1.5 disabled:text-secondary-300"
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!cargando && filtrados.length === 0 && (
          <p className="p-4 text-center text-secondary-500">
            {filtro ? 'Ningún usuario coincide con la búsqueda.' : 'No hay usuarios.'}
          </p>
        )}
        {cargando && <p className="p-4 text-center text-secondary-500">Cargando…</p>}
      </div>

      {modalAbierto && (
        <Modal
          isOpen
          onClose={() => setModalAbierto(false)}
          title={editando ? `Editar ${editando.email}` : 'Nuevo Usuario'}
        >
          <form onSubmit={guardar} className="space-y-4">
            <FormField
              label="Email" name="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required
              placeholder="persona@ejemplo.com"
            />
            <FormField
              label={editando ? 'Contraseña nueva (opcional)' : 'Contraseña'}
              name="password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              required={!editando}
              placeholder={editando ? 'Dejala vacía para no cambiarla' : `Al menos ${MIN_PASSWORD} caracteres`}
            />

            {errorForm && (
              <p className="m-0 text-[13px] text-error-700 bg-error-50 border border-error-200 rounded-lg px-3 py-2">
                {errorForm}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setModalAbierto(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={guardando}>
                {guardando ? 'Guardando…' : editando ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <PasswordConfirmDialog
        isOpen={aEliminar !== null}
        title="Eliminar usuario"
        description={
          <>
            <strong>{aEliminar?.email}</strong> va a perder el acceso al sistema. Los datos de la
            veterinaria no se tocan.
          </>
        }
        onConfirm={async (password) => {
          if (!aEliminar) return;
          await apiDelete(`/usuarios/${aEliminar.id_usuario}`, { password });
          await recargar();
        }}
        onClose={() => setAEliminar(null)}
      />
    </section>
  );
};
