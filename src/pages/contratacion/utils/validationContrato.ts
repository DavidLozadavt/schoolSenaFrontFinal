export const validateContratoField = (name: string, value: string | number): string | null => {
  switch (name) {
    case 'fechaContratacion':
      if (!value) return 'La fecha de inicio de contrato es requerida';
      break;

    case 'fechaFinalContrato':
      if (value && !value) return 'La fecha de fin de contrato es requerida';
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

    case 'valorTotalContrato':
      if (!value) return 'El valor total del contrato es requerido';
      break;

    case 'periodoPago':
      if (!value) return 'El período de pago es requerido';
      break;

    case 'objetoContrato':
      if (!value) return 'El objeto de contrato es requerido';
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
