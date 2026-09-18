import React, { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { armarSalida, esEntradaDeSalida, esElFondo } from '../../lib/atras';

/**
 * Pregunta antes de que el botón Atrás cierre la aplicación.
 *
 * En una PWA instalada, Atrás en la primera pantalla cierra la app sin más. Eso
 * es especialmente molesto acá, donde se pierde lo que se estaba cargando.
 *
 * Cómo funciona: al arrancar se apila una entrada propia, sin cambiar la URL.
 * Mientras se navega por la app, las pantallas se apilan encima y el Atrás se
 * comporta normal. Cuando el usuario vuelve hasta el fondo y consume esa
 * entrada, en vez de salirse aparece esta confirmación y se vuelve a armar otra,
 * así el próximo Atrás tampoco cae al vacío.
 *
 * ⚠️ Salir no siempre es posible: en una pestaña común el navegador no deja que
 * la página se cierre a sí misma ni retroceda más allá de donde empezó. En la
 * PWA instalada sí funciona, que es el caso que motivó esto.
 */
export const GuardiaSalida: React.FC = () => {
  const [preguntando, setPreguntando] = useState(false);

  // El manejador de popstate se registra una sola vez, así que lee el estado
  // por referencia en vez de capturarlo.
  const preguntandoRef = useRef(false);
  useEffect(() => { preguntandoRef.current = preguntando; }, [preguntando]);

  useEffect(() => {
    armarSalida();

    const alVolver = (e: PopStateEvent) => {
      // 🔴 Ya avisamos y el usuario volvió a tocar Atrás: ese es su "sí, salgo".
      // NO rearmamos, así el Atrás llega al sistema y cierra la app. Rearmar acá
      // dejaría al usuario encerrado, avisándole en bucle sin poder salir nunca.
      if (preguntandoRef.current) return;

      // Volvimos a nuestro propio centinela: el usuario sigue adentro.
      if (esEntradaDeSalida(e.state)) return;

      // Atrás normal entre pantallas: todavía queda historial de la app abajo.
      if (!esElFondo(e.state)) return;

      // Estamos en el fondo: el próximo Atrás se sale. Rearmamos para que haya
      // algo que consumir y preguntamos.
      armarSalida();
      setPreguntando(true);
    };

    window.addEventListener('popstate', alVolver);
    return () => window.removeEventListener('popstate', alVolver);
  }, []);

  if (!preguntando) return null;

  const instalada =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-salida"
      onClick={() => setPreguntando(false)}
    >
      <div
        className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-secondary-100 p-2 shrink-0">
            <LogOut size={20} className="text-secondary-600" />
          </div>
          <div>
            <h3 id="titulo-salida" className="text-lg font-semibold text-secondary-800">
              ¿Salir de VetAdmin?
            </h3>
            <p className="mt-1 text-sm text-secondary-600">
              Estás en la primera pantalla.{' '}
              <strong className="font-semibold text-secondary-800">
                {instalada ? 'Tocá Atrás otra vez y se cierra.' : 'Volvé atrás otra vez para salir.'}
              </strong>{' '}
              Si no querés salir, seguí acá.
            </p>
          </div>
        </div>

        {/* 🔴 No hay botón "Salir", y no es un olvido: una página no puede
            cerrar la app. `window.close()` lo bloquea Android y `history.back()`
            desde el fondo del historial es un no-op — los dos comprobados. Sólo
            cierra el gesto Atrás del sistema, y eso no se dispara por código. Un
            botón que promete salir y no puede es peor que decir qué hacer. */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            autoFocus
            onClick={() => setPreguntando(false)}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md bg-primary-700 text-white hover:bg-primary-800"
          >
            Seguir en la app
          </button>
        </div>
      </div>
    </div>
  );
};
