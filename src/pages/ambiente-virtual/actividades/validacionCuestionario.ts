import type { ErroresFormulario } from './useErroresFormulario';

interface CuestionarioValidable {
  titulo: string;
  idMateria: number;
  preguntas: { titulo: string; tipo: string; opciones: { texto: string; esCorrecta: boolean }[] }[];
}

export function validarCuestionario({ titulo, idMateria, preguntas }: CuestionarioValidable): ErroresFormulario {
  const errores: ErroresFormulario = {};
  if (!titulo.trim()) errores.titulo = 'El título del cuestionario es obligatorio.';
  else if (titulo.length > 500) errores.titulo = 'El título del cuestionario no puede superar 500 caracteres.';
  if (!Number.isInteger(idMateria) || idMateria <= 0) errores.idMateria = 'Selecciona el RAP del cuestionario.';
  if (!preguntas.length) errores.preguntas = 'Añade al menos una pregunta al cuestionario.';
  preguntas.forEach((pregunta, i) => {
    const base = `preguntas.${i}`;
    if (!pregunta.titulo.trim()) errores[`${base}.titulo`] = `El título de la pregunta ${i + 1} es obligatorio.`;
    else if (pregunta.titulo.length > 1000) errores[`${base}.titulo`] = `El título de la pregunta ${i + 1} no puede superar 1000 caracteres.`;
    if (!['Párrafo', 'Varias opciones'].includes(pregunta.tipo)) errores[`${base}.tipo`] = `Selecciona el tipo de la pregunta ${i + 1}.`;
    if (pregunta.tipo !== 'Varias opciones') return;
    if (pregunta.opciones.length < 2) errores[`${base}.opciones`] = `Añade al menos dos opciones a la pregunta ${i + 1}.`;
    pregunta.opciones.forEach((opcion, j) => {
      if (!opcion.texto.trim()) errores[`${base}.opciones.${j}.texto`] = `El texto de la opción ${j + 1} de la pregunta ${i + 1} es obligatorio.`;
    });
    if (pregunta.opciones.filter((opcion) => opcion.esCorrecta).length !== 1) {
      errores[`${base}.respuestaCorrecta`] = `Selecciona una respuesta correcta para la pregunta ${i + 1}.`;
    }
  });
  return errores;
}
