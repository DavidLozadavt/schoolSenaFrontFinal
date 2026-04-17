import { Contrato } from './types';

export const FORMAS_DE_PAGO: Contrato['formaDePago'][] = [
  'COMISIONES',
  'SALARIO INTEGRAL',
  'NORMAL'
];

export const FORMA_PAGO_STYLES: Record<Contrato['formaDePago'], string> = {
  COMISIONES: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  'SALARIO INTEGRAL':
    'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  NORMAL: 'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400'
};

export const ACTIVIDADES_MINIMAS = 6;
