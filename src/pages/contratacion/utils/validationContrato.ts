export const validateContratoField = (name: string, value: string | number): string | null => {
  switch (name) {
    case 'fechaContratacion':
      if (!value) return 'La fecha de inicio de contrato es requerida';
      break;

    case 'fechaFinalContrato':
      // Obligatoriedad según tipo de contrato (p. ej. indefinido) se valida en el paso del formulario.
      break;

    case 'idtipoContrato':
      if (!value) return 'El tipo de contrato es requerido';
      break;

    case 'rol':
      if (!value) return 'El cargo es requerido';
      break;

    case 'sueldo':
      if (!value) return 'El sueldo es requerido';
      break;

    case 'tipoSalario':
      if (!value) return 'El tipo de salario es requerido';
      break;

    case 'idGrupoNomina':
      if (!value) return 'El grupo de nómina es requerido';
      break;

    case 'horasmes':
      if (!value) return 'Las horas al mes son requeridas';
      if (!/^\d+$/.test(String(value))) return 'Las horas al mes deben ser un número entero';
      break;

    case 'valorTotalContrato':
      if (!value) return 'El valor total del contrato es requerido';
      break;

    case 'periodoPago':
      if (!value) return 'El período de pago es requerido';
      break;

    case 'formaPago':
      if (!value) return 'La forma de pago es requerida';
      break;

    case 'supervisorContrato':
      if (!String(value || '').trim()) return 'El nombre del supervisor del contrato es requerido';
      break;

    case 'cargoSupervisor':
      if (!String(value || '').trim()) return 'El cargo del supervisor es requerido';
      break;

    case 'objetoContrato':
      if (!value) return 'El objeto de contrato es requerido';
      break;

    case 'perfilProfesional':
      if (!String(value || '').trim()) return 'El perfil profesional es requerido';
      break;

    case 'idTipoCotizante':
      if (!value) return 'El tipo de cotizante es requerido';
      break;

    case 'numeroCuentaBancaria':
      if (value && !/^\d+$/.test(String(value))) {
        return 'El número de cuenta bancaria solo debe contener números';
      }
      break;

    default:
      return null;
  }

  return null;
};
