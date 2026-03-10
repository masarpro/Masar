import { redirect } from "next/navigation";

export default async function FinishingItemsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; studyId: string }>;
}) {
	const { organizationSlug, studyId } = await params;
	redirect(`/app/${organizationSlug}/pricing/studies/${studyId}?tab=finishing`);
}
