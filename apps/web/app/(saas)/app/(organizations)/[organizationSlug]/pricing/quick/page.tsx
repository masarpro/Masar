import { redirect } from "next/navigation";

export default async function QuickPricingPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/app/${organizationSlug}/pricing/studies`);
}
