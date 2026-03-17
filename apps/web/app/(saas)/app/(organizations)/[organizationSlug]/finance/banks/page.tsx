import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { BanksList } from "@saas/finance/components/banks/BanksList";
import { BanksHeaderActions } from "@saas/finance/components/banks/BanksHeaderActions";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.banks.title"),
	};
}

export default async function BanksPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<ListTableSkeleton />}>
			<BanksPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function BanksPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="banks"
			headerActions={<BanksHeaderActions organizationSlug={organizationSlug} />}
		>
			<BanksList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
