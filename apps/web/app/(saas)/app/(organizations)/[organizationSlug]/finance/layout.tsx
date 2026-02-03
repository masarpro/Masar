import { getActiveOrganization } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function FinanceLayout({
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

	return <div className="px-4 md:px-6 lg:px-8 py-6">{children}</div>;
}
