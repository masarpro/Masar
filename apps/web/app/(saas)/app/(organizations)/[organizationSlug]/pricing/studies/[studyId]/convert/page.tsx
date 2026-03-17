import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { PricingShell } from "@saas/pricing/components/shell";
import { StudyPageShell } from "@saas/pricing/components/studies/StudyPageShell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: "التحويل لمشروع",
	};
}

export default async function ConvertToProjectPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; studyId: string }>;
}) {
	const { organizationSlug, studyId } = await params;

	return (
		<Suspense fallback={null}>
			<ConvertToProjectPageContent organizationSlug={organizationSlug} studyId={studyId} />
		</Suspense>
	);
}

async function ConvertToProjectPageContent({ organizationSlug, studyId }: { organizationSlug: string; studyId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<PricingShell
			organizationSlug={organizationSlug}
			sectionKey="studies"
			hideSubPageHeader
		>
			<StudyPageShell
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				studyId={studyId}
			>
				<div className="space-y-6">
					<div className="rounded-lg border border-dashed border-muted-foreground/25 p-12 text-center">
						<p className="text-muted-foreground">قيد التطوير — المرحلة القادمة</p>
					</div>
				</div>
			</StudyPageShell>
		</PricingShell>
	);
}
