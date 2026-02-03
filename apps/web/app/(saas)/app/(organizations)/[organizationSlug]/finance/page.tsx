import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { FinanceDashboard } from "@saas/finance/components/dashboard/FinanceDashboard";
import { FinanceShell } from "@saas/finance/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.title"),
	};
}

export default async function FinancePage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations();

	const [activeOrganization, session] = await Promise.all([
		getActiveOrganization(organizationSlug),
		getSession(),
	]);

	if (!activeOrganization) {
		return notFound();
	}

	const userName = session?.user?.name ?? "";

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			title={t("finance.title")}
			subtitle={t("finance.subtitle")}
		>
			<FinanceDashboard
				organizationId={activeOrganization.id}
				userName={userName}
			/>
		</FinanceShell>
	);
}
