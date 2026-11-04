/** Etiqueta compacta: no duplica el código si ya viene al inicio del nombre. */
export const etiquetaCompetenciaMaterial = (
  codigo?: string | null,
  nombre?: string | null
): string => {
  const code = String(codigo || '').trim();
  let name = String(nombre || '').trim();
  if (!code) return name;
  if (!name) return code;
  const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  name = name.replace(new RegExp(`^${escaped}(\\s*[-–—:·]\\s*|\\s+)`, 'i'), '').trim();
  return name ? `${code} · ${name}` : code;
};
