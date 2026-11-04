import type { CSSObjectWithLabel } from 'react-select';
import {
  compactReactSelectNoOptions,
  filterOptionNormalized,
} from '@/components/forms/compactReactSelect';

export type SelectAcademicoOption = {
  value: number;
  label: string;
  codigo?: string;
  nombre?: string;
};

const nombreYaIncluyeCodigo = (nombre: string, codigo: string): boolean =>
  nombre.startsWith(`${codigo} `) ||
  nombre.startsWith(`${codigo}-`) ||
  nombre.startsWith(`${codigo} ·`) ||
  nombre.startsWith(`${codigo}–`);

const stripPrefijoIdInterno = (nombre: string): string => {
  const doble = nombre.match(/^\d+\s*[·•\-]\s+(\d{3,}\b.*)$/);
  if (doble?.[1]) return doble[1].trim();
  return nombre;
};

/** Código institucional + nombre. Nunca antepone el PK interno. */
export const etiquetaAcademica = (codigo?: string | null, nombre?: string | null): string => {
  const nom = stripPrefijoIdInterno(String(nombre ?? '').trim());
  const cod = String(codigo ?? '').trim();
  const normalizado = nom.replace(/^(\d+)\s*·\s*/, '$1 - ');
  if (cod && normalizado) {
    if (nombreYaIncluyeCodigo(normalizado, cod)) return normalizado;
    return `${cod} - ${normalizado}`;
  }
  return normalizado || cod;
};

export const formatOpcionAcademica = (
  opt: { label: string },
  meta: { context: 'menu' | 'value' }
) =>
  meta.context === 'value' ? (
    <span className="block truncate whitespace-nowrap" title={opt.label}>
      {opt.label}
    </span>
  ) : (
    <span className="line-clamp-2 block break-words leading-snug whitespace-normal" title={opt.label}>
      {opt.label}
    </span>
  );

export const filterOptionAcademico = (
  option: { label?: string; data?: { codigo?: string; nombre?: string } },
  input: string
): boolean => filterOptionNormalized([option.label, option.data?.codigo, option.data?.nombre], input);

export const selectMenuWidthBiblioteca = {
  minWidth: 'min(31.25rem, calc(100vw - 1.5rem))',
  width: 'max(100%, min(40rem, calc(100vw - 1.5rem)))',
  maxWidth: 'min(43.75rem, calc(100vw - 1.5rem))',
} as const;

export const applySelectMenuWidth = (
  base: CSSObjectWithLabel,
  extra?: CSSObjectWithLabel
): CSSObjectWithLabel => ({
  ...base,
  minWidth: selectMenuWidthBiblioteca.minWidth,
  width: selectMenuWidthBiblioteca.width,
  maxWidth: selectMenuWidthBiblioteca.maxWidth,
  ...extra,
});

export const selectStylesBiblioteca = {
  singleValue: (base: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...base,
    color: 'inherit',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  placeholder: (base: CSSObjectWithLabel): CSSObjectWithLabel => ({ ...base, color: 'inherit' }),
  input: (base: CSSObjectWithLabel): CSSObjectWithLabel => ({ ...base, color: 'inherit' }),
  valueContainer: (base: CSSObjectWithLabel): CSSObjectWithLabel => ({ ...base, overflow: 'hidden' }),
  menuPortal: (base: CSSObjectWithLabel): CSSObjectWithLabel => ({ ...base, zIndex: 400 }),
  menu: (base: CSSObjectWithLabel) => applySelectMenuWidth(base),
};

export const propsSelectAcademico = {
  isSearchable: true,
  filterOption: filterOptionAcademico,
  formatOptionLabel: formatOpcionAcademica,
  menuPortalTarget: typeof document !== 'undefined' ? document.body : undefined,
  menuPosition: 'fixed' as const,
  menuPlacement: 'auto' as const,
  noOptionsMessage: compactReactSelectNoOptions,
};
