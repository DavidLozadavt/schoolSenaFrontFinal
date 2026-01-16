export interface PersonModel {
    id?: number;
    identificacion: string;
    nombre1: string;
    nombre2: string;
    apellido1: string;
    apellido2: string;
    fechaNac: string;
    direccion: string;
    email: string;
    telefonoFijo: string | null;
    celular: string;
    perfil: string;
    sexo: string;
    rh: string;
    rutaFoto: string;
    idTipoIdentificacion: number;
    idCiudad: number | null;
    idCiudadNac: number;
    idCiudadUbicacion: number;
    created_at?: string;
    updated_at?: string;
    rutaFotoUrl?: string;
}