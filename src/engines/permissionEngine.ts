import type { Permission } from "../types.ts";

export function hasPermission(
    subject: string,
    action: Permission["action"],
    asset: string,
    permissions: Permission[]
): boolean {

    return permissions.some(
        permission =>
            permission.subject === subject &&
            permission.action === action &&
            (!permission.asset || permission.asset === asset)
    );
}