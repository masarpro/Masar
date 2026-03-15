import { redirect } from "next/navigation";

export default async function LeaveBalancesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/app/${organizationSlug}/company/hr?tab=leaves`);
}
