import type { FormOption } from '../builder/formBuilderTypes';

type Valor = string | string[];

/** Una opción llamada "Otro", "Otra", "Otros (especifique)"... permite escribir la respuesta. */
export const esOpcionOtro = (texto: string): boolean =>
  /^otr[oa]s?(?![a-z])/.test(
    String(texto ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/^[^a-z]+/, '')
  );

/** ¿La respuesta actual tiene marcada la opción "Otro"? */
export const otroSeleccionado = (valor: Valor | undefined): boolean =>
  Array.isArray(valor) ? valor.some(esOpcionOtro) : !!valor && esOpcionOtro(valor);

/** Une la opción "Otro" con lo que escribió la persona: "Otro" + "Psicóloga" => "Otro: Psicóloga". */
export const combinarOtro = (valor: Valor, detalle: string): Valor => {
  const texto = detalle.trim();
  if (!texto) return valor;
  const unir = (v: string) => (esOpcionOtro(v) ? `${v}: ${texto}` : v);
  return Array.isArray(valor) ? valor.map(unir) : unir(valor);
};

/** Inverso de combinarOtro, para volver a cargar una respuesta guardada en el formulario. */
export const separarOtro = (valor: Valor, opciones: FormOption[]): { valor: Valor; detalle: string } => {
  const otras = opciones.map((o) => o.texto).filter(esOpcionOtro);
  let detalle = '';

  const separar = (v: string): string => {
    const opcion = otras.find((o) => v.startsWith(`${o}: `));
    if (!opcion) return v;
    detalle = v.slice(opcion.length + 2);
    return opcion;
  };

  const limpio = Array.isArray(valor) ? valor.map(separar) : typeof valor === 'string' ? separar(valor) : valor;
  return { valor: limpio, detalle };
};
