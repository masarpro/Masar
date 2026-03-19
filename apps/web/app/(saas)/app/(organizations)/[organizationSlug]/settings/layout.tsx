import { isOrganizationAdmin } from "@repo/auth/lib/helper";
import { config } from "@repo/config";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { SettingsNavigation } from "@saas/settings/components/shell/SettingsNavigation";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function SettingsLayout({
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

	if (!organization) {
		redirect("/app");
	}

	const userIsOrganizationAdmin = isOrganizationAdmin(
		organization,
		session?.user,
	);

	const billingEnabled =
		config.organizations.enable &&
		config.organizations.enableBilling &&
		userIsOrganizationAdmin;

	return (
		<div>
			<SettingsNavigation
				organizationSlug={organizationSlug}
				isAdmin={userIsOrganizationAdmin}
				billingEnabled={billingEnabled}
			/>
			<div className="px-4 md:px-6 lg:px-8 py-6">{children}</div>
		</div>
	);
}
