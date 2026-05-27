export interface PermissionModel {
    id: number;
    name: string;
    guard_name: string;
    description: string;
    idPermissionPadre: number | null;

    checked: boolean;
    icon: string;

    children?: PermissionModel[];

    created_at?: Date;
    updated_at?: Date;
}