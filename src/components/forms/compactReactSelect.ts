export const compactReactSelectClassNames = {
  control: () =>
    'min-h-9 text-sm rounded-md bg-white dark:bg-coal-400 border border-gray-300 dark:border-coal-200 text-gray-900 dark:text-gray-100',
  singleValue: () => 'text-gray-900 dark:text-gray-100',
  placeholder: () => 'text-gray-400 dark:text-gray-300 text-sm',
  input: () => 'text-gray-900 dark:text-gray-100 text-sm',
  menu: () => 'bg-white dark:bg-coal-500 z-[200] text-sm',
  menuList: () => 'text-sm',
  option: ({ isFocused, isSelected }: { isFocused: boolean; isSelected: boolean }) =>
    `text-gray-900 dark:text-gray-100 text-sm ${isSelected ? 'bg-primary-500 text-white' : ''} ${
      isFocused && !isSelected ? 'bg-gray-100 dark:bg-coal-600' : ''
    }`,
  indicatorSeparator: () => 'bg-gray-300 dark:bg-coal-300',
  dropdownIndicator: () =>
    'text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-white',
  clearIndicator: () =>
    'text-gray-400 dark:text-gray-200 hover:text-gray-600 dark:hover:text-white'
} as const;

/** Selectores de competencia/RAP con nombres largos: envuelve el texto en control y opciones. */
export const compactReactSelectWrapClassNames = {
  ...compactReactSelectClassNames,
  control: () =>
    `${compactReactSelectClassNames.control()} h-auto min-h-9 items-start`,
  singleValue: () =>
    'text-gray-900 dark:text-gray-100 text-sm !whitespace-normal break-words leading-snug max-w-full',
  option: ({ isFocused, isSelected }: { isFocused: boolean; isSelected: boolean }) =>
    `${compactReactSelectClassNames.option({ isFocused, isSelected })} !whitespace-normal break-words leading-snug py-2`,
  valueContainer: () => 'flex-wrap py-1 min-w-0',
} as const;

export const compactReactSelectNoOptions = (): string => 'Sin coincidencias';

export const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/** Búsqueda insensible a acentos; usada con react-select (p. ej. contratación, actividades). */
export const filterOptionNormalized = (haystack: Array<unknown>, rawInput: string): boolean => {
  const q = normalizeText(rawInput);
  if (!q) return true;
  return haystack.some((v) => normalizeText(v).includes(q));
};

