import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { SectionRouteGate } from "@saas/permissions/components/SectionRouteGate";
import { cachedGetMyPermissions } from "@shared/lib/cached-queries";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function PricingLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{ organizationSlug: string }>;
}>) {
	const { organizationSlug } = await params;
	const [session, organization] = await Promise.all([
		getSession(),
		getActiveOrganization(organizationSlug),
	]);

	if (!session?.user) {
		redirect("/auth/login");
	}
	if (!organization) {
		redirect("/app");
	}

	// Server guard (RBAC-UI): no pricing permission at all → back to home.
	const { permissions, isOwner } = await cachedGetMyPermissions(
		organization.id,
	);
	const hasAnyPricing =
		isOwner ||
		(permissions ? Object.values(permissions.pricing).some(Boolean) : false);

	if (!hasAnyPricing) {
		redirect(`/app/${organizationSlug}`);
	}

	return (
		<SectionRouteGate sectionRoot="pricing">{children}</SectionRouteGate>
	);
}
