import { getActiveOrganization } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { CompanyNavigation } from "@saas/company/components/shell";

export default async function CompanyLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{ organizationSlug: string }>;
}>) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		redirect("/app");
	}

	return (
		<div>
			<CompanyNavigation organizationSlug={organizationSlug} />
			<div className="px-4 md:px-6 lg:px-8 py-6">{children}</div>
		</div>
	);
}
