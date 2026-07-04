import type { Permissions } from "@repo/database/prisma/permissions";
import { createContext } from "react";

export interface PermissionsContextValue {
	/** Effective permissions (role merged with customPermissions). Null while loading or outside an organization. */
	permissions: Permissions | null;
	/** Organization role type (OWNER, PROJECT_MANAGER, ...). Null while loading. */
	roleType: string | null;
	/** OWNER bypasses every UI gate. */
	isOwner: boolean;
	/** True while the getMine query has not resolved yet. */
	isLoading: boolean;
}

export const PermissionsContext = createContext<
	PermissionsContextValue | undefined
>(undefined);
