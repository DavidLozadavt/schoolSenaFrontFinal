export const validateUbicacionField = (name: string, value: string): string | null => {
  switch (name) {
    case 'departamentoU':
      if (!value) return 'El departamento de ubicación es requerido';
      break;

    case 'idciudadUbicacion':
      if (!value) return 'La ciudad de ubicación es requerida';
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

    default:
      return null;
  }

  return null;
};