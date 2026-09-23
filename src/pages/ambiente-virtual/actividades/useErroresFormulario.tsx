import { useEffect, useRef, useState } from 'react';

export type ErroresFormulario = Record<string, string>;

/** Usa las mismas rutas que los errores 422 de Laravel, incluso en preguntas anidadas. */
export function useErroresFormulario(prefijo: string) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const pendiente = useRef(false);
  useEffect(() => {
    if (!pendiente.current) return;
    pendiente.current = false;
    enfocarPrimerError(contenedor.current, errores);
  }, [errores]);

  const mostrarErrores = (nuevos: Record<string, string | string[]>) => {
    pendiente.current = true;
    setErrores(Object.fromEntries(Object.entries(nuevos).map(([clave, valor]) =>
      [clave, Array.isArray(valor) ? valor[0] : valor]
    )));
  };
  const limpiarErrores = () => setErrores({});
  const limpiarCampo = (clave: string) => setErrores((prev) => Object.fromEntries(
    Object.entries(prev).filter(([key]) => key !== clave && !key.startsWith(`${clave}.`))
  ));
  const campo = (clave: string) => ({
    id: `${prefijo}-${clave}`,
    'data-campo': clave,
    'aria-invalid': !!errores[clave],
    'aria-describedby': errores[clave] ? `${prefijo}-error-${clave}` : undefined,
    style: errores[clave] ? { outline: '2px solid #dc2626', outlineOffset: '2px' } : undefined
  });
  const mensaje = (clave: string) => errores[clave] ? (
    <p id={`${prefijo}-error-${clave}`} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-300">
      {errores[clave]}
    </p>
  ) : null;
  return { contenedor, errores, mostrarErrores, limpiarErrores, limpiarCampo, campo, mensaje };
}

export function enfocarPrimerError(contenedor: HTMLDivElement | null, errores: ErroresFormulario): void {
    const campos = contenedor?.querySelectorAll<HTMLElement>('[data-campo]');
    const campo = Array.from(campos ?? []).find((elemento) => errores[elemento.dataset.campo ?? '']);
    const destino = campo ?? contenedor?.querySelector<HTMLElement>('[data-error-general]');
    destino?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    destino?.focus({ preventScroll: true });
}
