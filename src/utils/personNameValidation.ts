/** Misma regla que backend: PersonNameUtil::PATTERN */
export const PERSON_NAME_REGEX =
  /^[A-Za-zÁÉÍÓÚáéíóúÑñüÜ]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñüÜ]+){0,2}$/;

/** Permite espacio final mientras se escribe un nombre compuesto */
export const PERSON_NAME_TYPING_REGEX =
  /^[A-Za-zÁÉÍÓÚáéíóúÑñüÜ]*(?: [A-Za-zÁÉÍÓÚáéíóúÑñüÜ]*)*$/;

export const PERSON_NAME_FIELDS = ['nombre1', 'nombre2', 'apellido1', 'apellido2'] as const;

export type PersonNameField = (typeof PERSON_NAME_FIELDS)[number];

export function isPersonNameField(name: string): name is PersonNameField {
  return (PERSON_NAME_FIELDS as readonly string[]).includes(name);
}

export function normalizePersonNameField(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function countAlphabeticChars(value: string): number {
  return (value.match(/[A-Za-zÁÉÍÓÚáéíóúÑñüÜ]/g) ?? []).length;
}

const labels: Record<PersonNameField, string> = {
  nombre1: 'El primer nombre',
  nombre2: 'El segundo nombre',
  apellido1: 'El primer apellido',
  apellido2: 'El segundo apellido'
};

/** Validación estricta al guardar (valor ya normalizado o por normalizar). */
export function validatePersonNameFinal(
  field: PersonNameField,
  value: string,
  required: boolean
): string | null {
  const normalized = normalizePersonNameField(value);

  if (!normalized) {
    return required ? `${labels[field]} es requerido` : null;
  }

  if (!PERSON_NAME_REGEX.test(normalized)) {
    return `${labels[field]} solo puede contener letras y hasta tres palabras separadas por un espacio`;
  }

  if (countAlphabeticChars(normalized) < 2) {
    return `${labels[field]} debe tener al menos 2 letras`;
  }

  return null;
}

/** Validación tolerante mientras el usuario escribe (permite espacio al final). */
export function validatePersonNameWhileTyping(
  field: PersonNameField,
  value: string,
  required: boolean
): string | null {
  if (!value) {
    return required ? `${labels[field]} es requerido` : null;
  }

  const withoutLeading = value.replace(/^\s+/, '');

  if (/\s{2,}/.test(withoutLeading)) {
    return `${labels[field]} no puede tener espacios consecutivos`;
  }

  if (!PERSON_NAME_TYPING_REGEX.test(withoutLeading)) {
    return `${labels[field]} solo puede contener letras y espacios entre palabras`;
  }

  if (!withoutLeading.endsWith(' ')) {
    const normalized = normalizePersonNameField(withoutLeading);
    if (normalized && countAlphabeticChars(normalized) < 2) {
      return `${labels[field]} debe tener al menos 2 letras`;
    }
  }

  return null;
}
