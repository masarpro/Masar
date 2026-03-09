import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProfitabilityReport } from "@saas/projects/components/finance/ProfitabilityReport";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("finance.profitability.title"),
	};
}

export default async function ProfitabilityPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<div>
			<ProfitabilityReport
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</div>
	);
}
