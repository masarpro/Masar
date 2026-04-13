import { useActiveOrganization } from "./use-active-organization";

export function usePartnerAccess() {
	const { partnerAccessLevel } = useActiveOrganization();

	return {
		level: partnerAccessLevel,
		canAccessPartners: partnerAccessLevel !== "none",
		canViewProfits: partnerAccessLevel === "full",
		canViewReports: partnerAccessLevel === "full",
		canViewNetBalance: partnerAccessLevel === "full",
		canCreate: partnerAccessLevel !== "none",
	};
}
