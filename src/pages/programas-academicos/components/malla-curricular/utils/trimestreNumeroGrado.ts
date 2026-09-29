export type TrimestreConNumero = {
  esNuevo?: boolean;
  numeroGrado?: unknown;
  grado?: { numeroGrado?: unknown } | null;
};

export function parseNumeroGrado(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const n = Math.trunc(value);
    return n > 0 ? n : null;
  }
  const s = String(value).trim();
  if (!/^\d+$/.test(s)) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function numeroGradoDesdeTrimestre(t: TrimestreConNumero | null | undefined): number | null {
  if (!t) return null;
  return parseNumeroGrado(t.grado?.numeroGrado ?? t.numeroGrado);
}

export function trimestresPersistidos<T extends TrimestreConNumero>(trimestres: T[]): T[] {
  return trimestres.filter((t) => !t.esNuevo);
}

export function compararTrimestresPorNumeroGrado(a: TrimestreConNumero, b: TrimestreConNumero): number {
  return (numeroGradoDesdeTrimestre(a) ?? 0) - (numeroGradoDesdeTrimestre(b) ?? 0);
}

export function maxNumeroGradoTrimestres(trimestres: TrimestreConNumero[]): number {
  let max = 0;
  for (const t of trimestresPersistidos(trimestres)) {
    const n = numeroGradoDesdeTrimestre(t);
    if (n != null && n > max) max = n;
  }
  return max;
}

export function siguienteNumeroGradoTrimestre(trimestres: TrimestreConNumero[]): number {
  const max = maxNumeroGradoTrimestres(trimestres);
  return max > 0 ? max + 1 : 1;
}

export function ultimoTrimestrePersistido<T extends TrimestreConNumero>(trimestres: T[]): T | null {
  const persistidos = trimestresPersistidos(trimestres);
  if (persistidos.length === 0) return null;
  return [...persistidos].sort(compararTrimestresPorNumeroGrado)[persistidos.length - 1] ?? null;
}

export function esTrimestreActual(
  trimestre: TrimestreConNumero | null | undefined,
  trimestres: TrimestreConNumero[]
): boolean {
  const n = numeroGradoDesdeTrimestre(trimestre);
  const max = maxNumeroGradoTrimestres(trimestres);
  return n != null && max > 0 && n === max;
}

export function numeroTrimestreDesdeHorario(horario: any): number | null {
  if (!horario) return null;

  const directo = parseNumeroGrado(
    horario.numeroTrimestre ?? horario.numero_trimestre ?? horario.numeroGrado
  );
  if (directo != null) return directo;

  const gm = horario.gradoMateria ?? horario.grado_materia;
  const gp = gm?.gradoPrograma ?? gm?.grado_programa;
  const grado = gp?.grado ?? null;

  return parseNumeroGrado(grado?.numeroGrado ?? grado?.numero_grado);
}

export function esHorarioDeTrimestreActual(
  horario: any,
  maxNumeroGrado: number
): boolean {
  const n = numeroTrimestreDesdeHorario(horario);
  return n != null && maxNumeroGrado > 0 && n === maxNumeroGrado;
}
