import { getActiveOrganization } from "@saas/auth/lib/server";
import { BankDetail } from "@saas/finance/components/banks/BankDetail";
import { FinanceShell } from "@saas/finance/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; bankId: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.banks.details"),
	};
}

export default async function BankDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; bankId: string }>;
}) {
	const { organizationSlug, bankId } = await params;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="banks"
			pageTitle={t("finance.banks.details")}
		>
			<BankDetail
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				bankId={bankId}
			/>
		</FinanceShell>
	);
}
