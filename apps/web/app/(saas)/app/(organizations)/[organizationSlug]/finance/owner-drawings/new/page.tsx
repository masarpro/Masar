import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { OwnerDrawingForm } from "@saas/finance/components/owner-drawings/OwnerDrawingForm";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("finance.ownerDrawings.new") };
}

export default async function NewOwnerDrawingPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton rows={6} cols={2} />}>
			<NewOwnerDrawingContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function NewOwnerDrawingContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<FinanceShell organizationSlug={organizationSlug} sectionKey="owner-drawings">
			<OwnerDrawingForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
