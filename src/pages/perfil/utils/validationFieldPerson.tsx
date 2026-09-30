<<<<<<< HEAD
export const validationFieldPerson = (name: string, value: any): string | null => {
    // Si el valor es null, undefined o un string vacío, convertimos a string vacío para facilitar la comprobación
    const valString = (value !== null && value !== undefined) ? String(value).trim() : '';

    switch (name) {
      case 'nombre1':
        if (!valString) return 'El primer nombre es requerido';
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(valString) || valString.length <= 2) {
          return 'El primer nombre debe contener solo letras y ser mayor a 2 caracteres';
        }
        break;
  
      case 'apellido1':
        if (!valString) return 'El primer apellido es requerido';
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(valString) || valString.length <= 2) {
          return 'El primer apellido debe contener solo letras y ser mayor a 2 caracteres';
        }
        break;
  
      case 'idtipoIdentificacion':
        if (!valString) return 'El tipo de identificación es requerido';
        break;
  
      case 'identificacion':
        if (!valString) return 'La identificación es requerida';
        if (valString.length < 3) {
          return 'La identificación debe tener al menos 3 caracteres';
        }
        break;
  
      case 'rh':
        if (!valString) return 'El tipo de sangre es requerido';
        break;
  
      case 'sexo':
        if (!valString) return 'El sexo es requerido';
        break;
  
      case 'fechaNac':
        if (!valString) return 'La fecha de nacimiento es requerida';
        break;
  
      case 'idCiudadUbicacion':
        if (!valString) return 'La ciudad de ubicación es requerida';
        break;
  
      case 'email':
        if (!valString) return 'El correo electrónico es requerido';
        if (!/\S+@\S+\.\S+/.test(valString)) {
          return 'El correo electrónico es inválido';
        }
        break;
  
      case 'direccion':
        if (!valString) return 'La dirección es requerida';
        break;
  
      case 'celular':
        if (!valString) return 'El celular es requerido';
        if (!/^\d{10}$/.test(valString)) {
          return 'El celular debe tener 10 dígitos';
        }
        break;
      
      case 'perfilProfesional':
        if (valString && valString.length > 4000) {
          return 'El perfil profesional no puede superar 4000 caracteres';
        }
        break;
  
      case 'departamento':
        break;

      default:
        return null;
    }
  
    return null;
  };
  
=======
import {
  isPersonNameField,
  normalizePersonNameField,
  validatePersonNameFinal,
  validatePersonNameWhileTyping
} from '@/utils/personNameValidation';

export const validationFieldPerson = (
  name: string,
  value: string,
  options?: { final?: boolean }
): string | null => {
  const isFinal = options?.final === true;

  if (isPersonNameField(name)) {
    const required = name === 'nombre1' || name === 'apellido1';
    return isFinal
      ? validatePersonNameFinal(name, value, required)
      : validatePersonNameWhileTyping(name, value, required);
  }

  switch (name) {
    case 'idtipoIdentificacion':
      if (!value) return 'El tipo de identificación es requerido';
      break;

    case 'identificacion':
      if (!value) return 'La identificación es requerida';
      if (!/^\d{5,}$/.test(value)) {
        return 'La identificación debe ser un número con más de 4 cifras';
      }
      break;

    case 'rh':
      if (!value) return 'El tipo de sangre es requerido';
      break;

    case 'sexo':
      if (!value) return 'El sexo es requerido';
      break;

    case 'fechaNac':
      if (!value) return 'La fecha de nacimiento es requerida';
      break;

    case 'idCiudadUbicacion':
      if (!value) return 'La ciudad de ubicación es requerida';
      break;

    case 'departamento':
      if (!value) return 'El departamento de ubicación es requerido';
      break;

    case 'email':
      if (!value) return 'El correo electrónico es requerido';
      if (!/\S+@\S+\.\S+/.test(value)) {
        return 'El correo electrónico es inválido';
      }
      break;

    case 'direccion':
      if (!value) return 'La dirección es requerida';
      break;

    case 'celular':
      if (!value) return 'El celular es requerido';
      if (!/^\d{10}$/.test(value)) {
        return 'El celular debe tener 10 dígitos';
      }
      break;

    case 'perfilProfesional':
      if (value && value.length > 4000) {
        return 'El perfil profesional no puede superar 4000 caracteres';
      }
      break;

    default:
      return null;
  }
>>>>>>> 7808e9cd69aa15046051a6a5e2f08da615c07ae4

  return null;
};

export { normalizePersonNameField };
