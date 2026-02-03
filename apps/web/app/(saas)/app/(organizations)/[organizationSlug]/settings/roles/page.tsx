import { redirect } from "next/navigation";

export default async function RolesSettingsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/app/${organizationSlug}/settings/members`);
}
