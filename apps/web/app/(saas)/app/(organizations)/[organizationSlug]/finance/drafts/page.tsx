import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { DraftsPage } from "@saas/shared/components/drafts/DraftsPage";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("drafts.title") };
}

export default async function DraftsRoutePage({
	params,
	searchParams,
}: {
	params: Promise<{ organizationSlug: string }>;
	searchParams: Promise<{ tab?: string }>;
}) {
	const { organizationSlug } = await params;
	const { tab } = await searchParams;

	return (
		<Suspense fallback={<ListTableSkeleton rows={8} cols={5} />}>
			<DraftsContent organizationSlug={organizationSlug} tab={tab} />
		</Suspense>
	);
}

async function DraftsContent({
	organizationSlug,
	tab,
}: { organizationSlug: string; tab?: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell organizationSlug={organizationSlug}>
			<DraftsPage
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				defaultTab={tab === "quotations" ? "quotations" : "invoices"}
			/>
		</FinanceShell>
	);
}
