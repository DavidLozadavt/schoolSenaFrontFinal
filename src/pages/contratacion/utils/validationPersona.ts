export const validateFieldPersona = (name: string, value: string): string | null => {
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
  
      case 'nombre2':
        if (!value) return 'El segundo nombre es requerido';
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+$/.test(value) || value.length <= 2) {
          return 'El segundo nombre debe contener solo letras y ser mayor a 2 caracteres';
        }
        break;
  
      case 'apellido2':
        if (!value) return 'El segundo apellido es requerido';
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+$/.test(value) || value.length <= 2) {
          return 'El segundo apellido debe contener solo letras y ser mayor a 2 caracteres';
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
  
      case 'idciudadNac':
        if (!value) return 'La ciudad de nacimiento es requerida';
        break;
  
      case 'departamento':
        if (!value) return 'El departamento de nacimiento es requerido';
        break;
  
      default:
        return null;
    }
  
    return null;
  };
  


  