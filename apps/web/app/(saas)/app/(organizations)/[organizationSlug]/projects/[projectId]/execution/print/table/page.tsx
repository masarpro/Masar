import { getActiveOrganization } from "@saas/auth/lib/server";
import { TablePrintLayout } from "@saas/projects-execution/components/print/TablePrintLayout";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("execution.print.tableTitle"),
	};
}

export default async function MilestoneTablePrintPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) {
		return notFound();
	}

	return <TablePrintLayout projectId={projectId} />;
}
