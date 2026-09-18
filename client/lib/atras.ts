import { useEffect, useRef } from 'react';

/**
 * Que el botón Atrás del teléfono cierre lo que está abierto, en vez de salirse
 * de la app.
 *
 * El problema: un modal abierto no existe para el navegador. En el celular,
 * Atrás sobre un modal abierto se llevaba puesta la pantalla entera —o la app,
 * si era la primera— en lugar de cerrar el modal.
 *
 * La solución es apilar una entrada de historial mientras el overlay está
 * abierto. Como la URL no cambia, el router no se entera y sigue mostrando la
 * misma pantalla; lo único que hacemos es darle al botón Atrás algo que
 * consumir.
 */

/** Distingue nuestras entradas de las del router. */
const MARCA = '__overlayVetAdmin';

let contador = 0;

/**
 * Mientras `activo`, el botón Atrás llama a `alCerrar()` en vez de navegar.
 *
 * Sirve para cualquier cosa superpuesta: modales, el sidebar del celular, un
 * desplegable a pantalla completa.
 */
export const useCerrarConAtras = (activo: boolean, alCerrar: () => void) => {
  // Por referencia: si `alCerrar` se recrea en cada render —y en estos
  // componentes casi siempre se recrea— tenerlo como dependencia haría que el
  // efecto se desmonte y vuelva a montar, apilando una entrada por render.
  const cerrarRef = useRef(alCerrar);
  useEffect(() => { cerrarRef.current = alCerrar; }, [alCerrar]);

  useEffect(() => {
    if (!activo) return;

    const id = `${MARCA}:${++contador}`;
    // Se conserva el estado que había: react-router guarda ahí su `idx`, que es
    // la profundidad de navegación. Pisarlo dejaría al router sin saber a qué
    // altura está, y al guardia de salida sin poder distinguir la primera
    // pantalla de una intermedia.
    window.history.pushState({ ...window.history.state, [MARCA]: id }, '');

    let cerradoPorAtras = false;

    const alVolver = () => {
      cerradoPorAtras = true;
      cerrarRef.current();
    };
    window.addEventListener('popstate', alVolver);

    return () => {
      window.removeEventListener('popstate', alVolver);

      // Si se cerró con Atrás, el navegador ya consumió nuestra entrada.
      if (cerradoPorAtras) return;

      // Se cerró de otra forma (la X, guardar, clic afuera): hay que sacar la
      // entrada que pusimos, o quedaría un Atrás que no hace nada visible.
      //
      // Sólo si sigue siendo la entrada actual. Varias pantallas navegan con
      // `replace: true` al cerrar el modal, lo que pisa nuestra entrada con la
      // del router: ahí un `back()` volvería a la pantalla anterior de verdad
      // —reabriendo el modal que se acaba de cerrar— en vez de limpiar.
      if ((window.history.state as Record<string, unknown> | null)?.[MARCA] === id) {
        window.history.back();
      }
    };
  }, [activo]);
};

/** Para que el guardia de salida distinga su propia entrada. */
export const MARCA_SALIDA = '__salidaVetAdmin';

/** Vuelve a dejar una entrada que el botón Atrás pueda consumir. */
export const armarSalida = () => {
  window.history.pushState({ ...window.history.state, [MARCA_SALIDA]: true }, '');
};

/** ¿La entrada a la que volvimos es la del guardia de salida? */
export const esEntradaDeSalida = (estado: unknown): boolean =>
  Boolean((estado as Record<string, unknown> | null)?.[MARCA_SALIDA]);

/**
 * ¿Esta entrada es la primera de la app, o sea que el próximo Atrás se sale?
 *
 * `idx` lo mantiene react-router en el estado del historial y es la profundidad
 * de navegación: 0 es la pantalla en la que se entró. Si no hay `idx`, la
 * entrada es anterior a la app (de donde se venía), que también significa que ya
 * estamos afuera.
 *
 * Mirar sólo "esta entrada no es mi centinela" no alcanza: ninguna entrada del
 * router lleva la marca, así que con ese criterio el aviso de salida saltaba en
 * cada Atrás entre pantallas.
 */
export const esElFondo = (estado: unknown): boolean => {
  const idx = (estado as { idx?: unknown } | null)?.idx;
  return typeof idx !== 'number' || idx === 0;
};
