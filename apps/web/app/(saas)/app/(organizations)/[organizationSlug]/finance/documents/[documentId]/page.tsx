import { getActiveOrganization } from "@saas/auth/lib/server";
import { DocumentEditor } from "@saas/finance/components/documents/DocumentEditor";
import { FinanceShell } from "@saas/finance/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; documentId: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.documents.edit"),
	};
}

export default async function EditDocumentPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; documentId: string }>;
}) {
	const { organizationSlug, documentId } = await params;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			title={t("finance.documents.edit")}
		>
			<DocumentEditor
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				documentId={documentId}
			/>
		</FinanceShell>
	);
}
