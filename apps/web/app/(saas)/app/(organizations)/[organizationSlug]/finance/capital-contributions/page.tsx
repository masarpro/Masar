import { redirect } from "next/navigation";

export default async function CapitalContributionsRedirectPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/app/${organizationSlug}/finance/partners?tab=contributions`);
}
