import { getActiveOrganization } from "@saas/auth/lib/server";
import { GanttPrintLayout } from "@saas/projects-execution/components/print/GanttPrintLayout";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("execution.print.ganttTitle"),
	};
}

export default async function GanttPrintPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) {
		return notFound();
	}

	return <GanttPrintLayout projectId={projectId} />;
}
