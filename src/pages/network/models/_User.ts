import { PersonModel } from "./_Person";

export interface UserModel {
    id?: number;
    email: string;
    contrasena: string;
    idpersona: number;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    device_token: string | null;
    persona: PersonModel;
}