import { cachedListPurchases } from "@shared/lib/cached-queries";
import { cache } from "react";

export const getPurchases = cache(async (organizationId?: string) => {
	const { purchases } = await cachedListPurchases(organizationId);

	return purchases;
});
