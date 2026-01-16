
import { RoleModel } from "@/pages/account/members/roles/models/_Role";
import { StateModel } from "./_State";
import { UserModel } from "./_User";

export interface Company {
    id: number;
    razonSocial: string;
    nit: string;
    rutaLogo: string;
    representanteLegal: string;
    digitoVerificacion: number;
    created_at?: string;
    updated_at?: string;
    rutaLogoUrl: string;
}

export interface ActivationCompanyUser {
    id?: number;
    user_id: number;
    state_id: number;
    company_id: number;
    fechaInicio: string;
    fechaFin: string;
    created_at?: string;
    updated_at?: string;
    company?: Company;
    user?: UserModel;
    roles?: RoleModel[];
    estado?: StateModel;
}
