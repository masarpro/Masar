import { redirect } from "next/navigation";

export default async function LeavesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/app/${organizationSlug}/company/hr?tab=leaves`);
}
