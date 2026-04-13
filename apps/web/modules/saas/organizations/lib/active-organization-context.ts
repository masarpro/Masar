import type { ActiveOrganization } from "@repo/auth";
import type { PartnerAccessLevel } from "@repo/auth/lib/helper";
import React from "react";

export const ActiveOrganizationContext = React.createContext<
	| {
			activeOrganization: ActiveOrganization | null;
			activeOrganizationUserRole:
				| ActiveOrganization["members"][number]["role"]
				| null;
			isOrganizationAdmin: boolean;
			isOrganizationAccountant: boolean;
			partnerAccessLevel: PartnerAccessLevel;
			loaded: boolean;
			setActiveOrganization: (
				organizationId: string | null,
			) => Promise<void>;
			refetchActiveOrganization: () => Promise<void>;
	  }
	| undefined
>(undefined);
