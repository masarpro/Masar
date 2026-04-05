import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { OwnerDrawingDetail } from "@saas/finance/components/owner-drawings/OwnerDrawingDetail";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("finance.ownerDrawings.drawingDetails") };
}

export default async function OwnerDrawingDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; drawingId: string }>;
}) {
	const { organizationSlug, drawingId } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton rows={6} cols={2} />}>
			<OwnerDrawingDetailContent
				organizationSlug={organizationSlug}
				drawingId={drawingId}
			/>
		</Suspense>
	);
}

async function OwnerDrawingDetailContent({
	organizationSlug,
	drawingId,
}: { organizationSlug: string; drawingId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<FinanceShell organizationSlug={organizationSlug} sectionKey="owner-drawings">
			<OwnerDrawingDetail
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				drawingId={drawingId}
			/>
		</FinanceShell>
	);
}
