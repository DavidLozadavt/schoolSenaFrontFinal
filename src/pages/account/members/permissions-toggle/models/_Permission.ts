export interface PermissionModel {
    id: number;
    name: string;
    guard_name: string;
    description: string;

    checked: boolean;
    icon: string;

    created_at?: Date;
    updated_at?: Date;
}