import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { OpenDocumentsList } from "@saas/finance/components/documents/OpenDocumentsList";
import { DocumentsHeaderActions } from "@saas/finance/components/documents/DocumentsHeaderActions";
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
		title: t("finance.documents.title"),
	};
}

export default async function DocumentsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<ListTableSkeleton />}>
			<DocumentsPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function DocumentsPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="documents"
			headerActions={<DocumentsHeaderActions organizationSlug={organizationSlug} />}
		>
			<OpenDocumentsList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
