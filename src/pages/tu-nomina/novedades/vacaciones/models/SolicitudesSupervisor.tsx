interface Persona {
    id: number;
    identificacion: string;
    nombre1: string;
    nombre2: string;
    apellido1: string;
    apellido2: string;
    fechaNac: string;
    direccion: string;
    email: string;
    telefonoFijo: string;
    celular: string;
    perfil: string;
    sexo: string;
    rh: string;
    rutaFoto: string;
    idTipoIdentificacion: number;
    idCiudad: number;
    idCiudadNac: number;
    idCiudadUbicacion: number;
    created_at: string;
    updated_at: string;
    rutaFotoUrl: string;
}

interface Contrato {
    id: number;
    idpersona: number;
    idempresa: number;
    idtipoContrato: number;
    fechaContratacion: string;
    fechaFinalContrato: string;
    valorTotalContrato: number;
    salario_id: number;
    numeroContrato: string;
    objetoContrato: string;
    observacion: string | null;
    perfilProfesional: string;
    otrosi: string;
    created_at: string;
    updated_at: string;
    periodoPago: number;
    idContrato: number | null;
    idEstado: number;
    persona: Persona;
}

interface Vacaciones {
    id: number;
    periodo: number;
    estado: string;
    idSolicitud: number;
    idContrato: number;
    deleted_at: string | null;
    created_at: string | null;
    updated_at: string;
    contrato: Contrato;
}

export interface SolicitudVacacionesSupervisorInterface {
    id: number;
    fechaSolicitud: string;
    fechaLiquidacion: string | null;
    fechaEjecucion: string;
    periodos: string;
    estado: string;
    numDias: number;
    valor: number;
    fechaFinal: string;
    created_at: string;
    updated_at: string;
    vacaciones: Vacaciones[];
}