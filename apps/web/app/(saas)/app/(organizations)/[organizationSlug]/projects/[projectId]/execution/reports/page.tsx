import { redirect } from "next/navigation";

// Legacy path — the daily reports hub moved to its own top-level tab.
export default async function LegacyDailyReportsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;
	redirect(`/app/${organizationSlug}/projects/${projectId}/reports`);
}
