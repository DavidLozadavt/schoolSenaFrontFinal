import { ReactNode } from "react";

export interface RoleModel {
    id?: number;
    name: string;
    company_id: number;
    company?: any;
    badge?: {
        size: string;
        badge: ReactNode;
        fill: string;
        stroke: string;
    };
    guard_name?: string;
    created_at?: Date;
    updated_at?: Date;
}