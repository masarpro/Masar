import { redirect } from "next/navigation";

// Legacy path — the new-report form moved under the daily reports tab.
export default async function LegacyNewReportPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;
	redirect(`/app/${organizationSlug}/projects/${projectId}/reports/new`);
}
