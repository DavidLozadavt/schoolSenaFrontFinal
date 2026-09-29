/** Valores persistidos en materialApoyoRap.tipoMaterial (nullable). */
export const TIPO_MATERIAL_OPTIONS = [
  { value: 'GUIA_APRENDIZAJE', label: 'Guía de aprendizaje' },
  { value: 'MATERIAL_FORMACION', label: 'Material de formación' },
  { value: 'TUTORIAL', label: 'Tutorial' },
] as const;

export type TipoMaterialApoyoValue = (typeof TIPO_MATERIAL_OPTIONS)[number]['value'];

export const tipoMaterialLabel = (raw?: string | null): string => {
  if (!raw) return 'Sin tipo';
  const found = TIPO_MATERIAL_OPTIONS.find((o) => o.value === raw);
  return found ? found.label : String(raw);
};

export const tipoMaterialDisplay = (raw?: string | null): string => tipoMaterialLabel(raw);

export const isTipoMaterialValido = (raw?: string | null): boolean =>
  !!raw && TIPO_MATERIAL_OPTIONS.some((o) => o.value === raw);
