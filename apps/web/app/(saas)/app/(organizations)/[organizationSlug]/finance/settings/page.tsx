import { redirect } from "next/navigation";

export default async function FinanceSettingsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/app/${organizationSlug}/settings/general`);
}
