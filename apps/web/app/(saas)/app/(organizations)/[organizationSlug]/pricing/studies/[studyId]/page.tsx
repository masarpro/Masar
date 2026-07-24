import { getActiveOrganization } from "@saas/auth/lib/server";
import { CostStudyOverview } from "@saas/pricing/components/studies/CostStudyOverview";
import { StudyPageShell } from "@saas/pricing/components/studies/StudyPageShell";
import { PricingShell } from "@saas/pricing/components/shell";
import { isUnifiedStudy } from "@saas/pricing/lib/unified-flag";
import { StudyOverviewSkeleton } from "@saas/shared/components/skeletons";
import { orpcServer, orpcServerClient } from "@shared/lib/orpc-server";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("pricing.studies.studyDetails"),
	};
}

// Mirrors CostStudyOverview's STAGE_PATH_MAP — keep in sync.
const STAGE_PATH_MAP: Record<string, string> = {
	QUANTITIES: "quantities",
	SPECIFICATIONS: "specifications",
	COSTING: "costing",
	PRICING: "pricing",
	QUOTATION: "quotation",
	CONVERSION: "convert",
};

// Study types whose pipeline skips the quantities stage (useStudyConfig).
const NO_QUANTITIES_STUDY_TYPES = new Set([
	"QUICK_PRICING",
	"CUSTOM_ITEMS",
	"LUMP_SUM_ANALYSIS",
]);

export default async function CostStudyPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; studyId: string }>;
}) {
	const { organizationSlug, studyId } = await params;

	return (
		<Suspense fallback={<StudyOverviewSkeleton />}>
			<CostStudyPageContent
				organizationSlug={organizationSlug}
				studyId={studyId}
			/>
		</Suspense>
	);
}

async function CostStudyPageContent({
	organizationSlug,
	studyId,
}: { organizationSlug: string; studyId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	const organizationId = activeOrganization.id;

	// This route is a landing gate: it only decides which stage page to open.
	// Doing that decision here (in-process, next to the DB) replaces the old
	// client flow — download JS → 3 RPC round trips → router.replace → cold
	// load of the target page — with a single server redirect.
	const study = (await orpcServerClient.pricing.studies
		.getById({ id: studyId, organizationId })
		.catch(() => null)) as {
		studyType?: string | null;
		workScopes?: string[] | null;
	} | null;

	let target: string | null = null;

	if (study) {
		const studyType = study.studyType ?? "FULL_PROJECT";
		const quantitiesEnabled =
			isUnifiedStudy({
				workScopes: study.workScopes ?? [],
				studyType,
			}) || !NO_QUANTITIES_STUDY_TYPES.has(studyType);

		if (quantitiesEnabled) {
			// Same rule as CostStudyOverview: always land on quantities when the
			// study has that stage.
			target = "quantities";
		} else {
			const activeStageData = (await orpcServerClient.pricing.studies.studyStages
				.getActive({ organizationId, studyId })
				.catch(() => null)) as {
				activeStage?: { stage?: string } | null;
			} | null;
			const stage = activeStageData?.activeStage?.stage;
			target = (stage && STAGE_PATH_MAP[stage]) || null;
		}
	}

	if (target) {
		redirect(
			`/app/${organizationSlug}/pricing/studies/${studyId}/${target}`,
		);
	}

	// Fallback (study not found, or no active stage to land on): render the
	// client overview with the study query hydrated so it paints immediately.
	const queryClient = getServerQueryClient();
	await Promise.all([
		queryClient.prefetchQuery(
			orpcServer.pricing.studies.getById.queryOptions({
				input: { id: studyId, organizationId },
			}),
		),
		queryClient.prefetchQuery(
			orpcServer.pricing.studies.studyStages.getActive.queryOptions({
				input: { organizationId, studyId },
			}),
		),
		queryClient.prefetchQuery(
			orpcServer.pricing.studies.studyStages.get.queryOptions({
				input: { organizationId, studyId },
			}),
		),
	]);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<PricingShell
				organizationSlug={organizationSlug}
				sectionKey="studies"
			>
				<StudyPageShell
					organizationId={organizationId}
					organizationSlug={organizationSlug}
					studyId={studyId}
				>
					<CostStudyOverview
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						studyId={studyId}
					/>
				</StudyPageShell>
			</PricingShell>
		</HydrationBoundary>
	);
}
