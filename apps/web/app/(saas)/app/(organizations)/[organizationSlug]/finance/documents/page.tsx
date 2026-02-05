import { getActiveOrganization } from "@saas/auth/lib/server";
import { OpenDocumentsList } from "@saas/finance/components/documents/OpenDocumentsList";
import { DocumentsHeaderActions } from "@saas/finance/components/documents/DocumentsHeaderActions";
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
		title: t("finance.documents.title"),
	};
}

export default async function DocumentsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

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
