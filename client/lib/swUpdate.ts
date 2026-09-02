/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register';

const UNA_HORA = 60 * 60 * 1000;

/**
 * Registra el Service Worker y se ocupa de que una pestaña abierta se entere
 * de un deploy nuevo.
 *
 * El registro por defecto de vite-plugin-pwa sólo hace `register()`: nunca
 * vuelve a preguntar si hay versión nueva, así que una pestaña que quedó
 * abierta sigue con la versión vieja hasta que alguien recarga a mano.
 *
 * Acá se agrega:
 *  - un chequeo periódico y otro al volver a la pestaña,
 *  - recarga automática cuando el SW nuevo toma el control.
 */
export function setupServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  // Si ya había un SW controlando la página, un cambio de controlador
  // significa "se activó una versión nueva". En la primera visita no hay
  // controlador, y ahí el cambio es sólo la instalación inicial: no recargar.
  const teniaControlador = Boolean(navigator.serviceWorker.controller);
  let recargando = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!teniaControlador || recargando) return;
    recargando = true;
    window.location.reload();
  });

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const buscarActualizacion = () => {
        // Falla si no hay red; no es un error que valga la pena mostrar.
        registration.update().catch(() => {});
      };

      setInterval(buscarActualizacion, UNA_HORA);

      // Al volver a la pestaña: es el momento típico en que el usuario
      // retoma la app después de un deploy.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') buscarActualizacion();
      });
    },
  });
}
