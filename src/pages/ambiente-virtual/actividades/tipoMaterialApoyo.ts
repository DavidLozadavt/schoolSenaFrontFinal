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

export const tipoMaterialBadgeClass = (raw?: string | null): string => {
  switch (String(raw ?? '')) {
    case 'GUIA_APRENDIZAJE':
      return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/60';
    case 'MATERIAL_FORMACION':
      return 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-800/60';
    case 'TUTORIAL':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800/60';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/60 dark:text-gray-300 dark:border-gray-700';
  }
};

export const isTipoMaterialValido = (raw?: string | null): boolean =>
  !!raw && TIPO_MATERIAL_OPTIONS.some((o) => o.value === raw);
