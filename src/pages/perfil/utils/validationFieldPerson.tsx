export const validationFieldPerson = (name: string, value: string): string | null => {
    switch (name) {
      case 'nombre1':
        if (!value) return 'El primer nombre es requerido';
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+$/.test(value) || value.length <= 2) {
          return 'El primer nombre debe contener solo letras y ser mayor a 2 caracteres';
        }
        break;
  
      case 'apellido1':
        if (!value) return 'El primer apellido es requerido';
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+$/.test(value) || value.length <= 2) {
          return 'El primer apellido debe contener solo letras y ser mayor a 2 caracteres';
        }
        break;
  
   
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

  
      default:
        return null;
    }
  
    return null;
  };
  


  