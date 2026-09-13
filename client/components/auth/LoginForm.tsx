import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';
import { FormField } from '../common/FormField';
import { apiPost, ApiError } from '../../lib/api';
import { LogIn, Eye, EyeOff, Mail, KeyRound, ArrowLeft } from 'lucide-react';

/**
 * El link de recuperación llega como `?reset=<token>` antes del hash
 * (`https://host/?reset=abc#/`), así que se lee del search y no interfiere con
 * el HashRouter. Se consulta una sola vez, al montar.
 */
export const leerTokenDeReset = (): string => {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('reset') || '';
};

/** Saca el token de la URL para que no quede reusable ni visible en el historial. */
const limpiarTokenDeLaUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('reset');
  window.history.replaceState({}, '', url);
};

type Vista = 'login' | 'olvide' | 'reset';

export const LoginForm: React.FC = () => {
  const { signIn, signOut, user } = useAuth();

  const [tokenReset, setTokenReset] = useState(leerTokenDeReset);
  const [vista, setVista] = useState<Vista>(() => (leerTokenDeReset() ? 'reset' : 'login'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [verPassword, setVerPassword] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const irA = (siguiente: Vista) => {
    setVista(siguiente);
    setError(null);
    setAviso(null);
  };

  const mensajeDeError = (err: unknown, porDefecto: string) =>
    err instanceof ApiError ? err.message : porDefecto;

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    setCargando(false);
  };

  const pedirLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await apiPost('/auth/forgot-password', { email, resetPath: window.location.pathname });
      // El mismo mensaje exista o no la cuenta: el backend tampoco distingue,
      // para no filtrar qué direcciones están registradas.
      setAviso('Si el email está registrado, te mandamos un link para cambiar la contraseña. Revisá también el correo no deseado.');
      setVista('login');
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo conectar con el servidor'));
    } finally {
      setCargando(false);
    }
  };

  const guardarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (nuevaPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (nuevaPassword !== confirmacion) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setCargando(true);
    try {
      await apiPost('/auth/reset-password', { token: tokenReset, password: nuevaPassword });
      // Si la sesión seguía abierta (se abrió el mail en el mismo dispositivo),
      // se cierra: la contraseña cambió, corresponde volver a entrar. Además
      // es lo que hace que ProtectedRoute deje de mostrar este formulario.
      if (user) await signOut();
      setNuevaPassword('');
      setConfirmacion('');
      setTokenReset('');
      limpiarTokenDeLaUrl();
      setVista('login');
      setAviso('Contraseña actualizada. Ya podés iniciar sesión.');
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo restablecer la contraseña'));
    } finally {
      setCargando(false);
    }
  };

  const titulo =
    vista === 'login' ? 'Iniciar Sesión'
    : vista === 'olvide' ? 'Recuperar contraseña'
    : 'Elegí una contraseña nueva';

  const bajada =
    vista === 'login' ? 'VetAdmin - Sistema de Gestión Veterinaria'
    : vista === 'olvide' ? 'Te mandamos un link por mail para volver a entrar.'
    : 'El link vence a la hora y se puede usar una sola vez.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">{titulo}</h2>
          <p className="mt-2 text-center text-sm text-secondary-600">{bajada}</p>
        </div>

        {aviso && (
          <div className="bg-primary-50 border border-primary-200 text-primary-800 px-4 py-3 rounded text-sm">
            {aviso}
          </div>
        )}
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {vista === 'login' && (
          <form className="mt-8 space-y-6" onSubmit={iniciarSesion}>
            <div className="space-y-4">
              <FormField
                label="Email" name="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com"
              />
              <div className="relative">
                <FormField
                  label="Contraseña" name="password" type={verPassword ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  className="absolute right-3 top-9 text-secondary-400 hover:text-secondary-600"
                  onClick={() => setVerPassword(!verPassword)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {verPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={cargando} leftIcon={<LogIn />}>
              {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            <button
              type="button"
              onClick={() => irA('olvide')}
              className="w-full text-center text-[13px] text-primary-700 hover:underline"
            >
              Olvidé mi contraseña
            </button>
          </form>
        )}

        {vista === 'olvide' && (
          <form className="mt-8 space-y-6" onSubmit={pedirLink}>
            <FormField
              label="Email de tu cuenta" name="email-reset" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com"
            />
            <Button type="submit" className="w-full" disabled={cargando} leftIcon={<Mail />}>
              {cargando ? 'Enviando...' : 'Enviarme el link'}
            </Button>
            <button
              type="button"
              onClick={() => irA('login')}
              className="w-full flex items-center justify-center gap-1.5 text-[13px] text-secondary-600 hover:text-secondary-900"
            >
              <ArrowLeft size={14} /> Volver a iniciar sesión
            </button>
          </form>
        )}

        {vista === 'reset' && (
          <form className="mt-8 space-y-6" onSubmit={guardarPassword}>
            <div className="space-y-4">
              <FormField
                label="Contraseña nueva" name="nueva" type={verPassword ? 'text' : 'password'}
                value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} required
                placeholder="Al menos 8 caracteres"
              />
              <FormField
                label="Repetila" name="confirmacion" type={verPassword ? 'text' : 'password'}
                value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} required
                placeholder="La misma contraseña"
              />
              <label className="flex items-center gap-2 text-[13px] text-secondary-600">
                <input
                  type="checkbox" checked={verPassword}
                  onChange={(e) => setVerPassword(e.target.checked)}
                  className="rounded border-secondary-300"
                />
                Mostrar contraseñas
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={cargando} leftIcon={<KeyRound />}>
              {cargando ? 'Guardando...' : 'Guardar contraseña'}
            </Button>

            <button
              type="button"
              onClick={() => { setTokenReset(''); limpiarTokenDeLaUrl(); irA('login'); }}
              className="w-full flex items-center justify-center gap-1.5 text-[13px] text-secondary-600 hover:text-secondary-900"
            >
              <ArrowLeft size={14} /> Volver a iniciar sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
