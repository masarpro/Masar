"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Calculator } from "lucide-react";
import { useTranslations } from "next-intl";

import { StudyOverviewSkeleton } from "@saas/shared/components/skeletons";
import { StudyHeaderCard } from "./StudyHeaderCard";
import { StudyPipelineStepper } from "./StudyPipelineStepper";
import { StudySidebar } from "./StudySidebar";

interface StudyPageShellProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
	children: React.ReactNode;
}

export function StudyPageShell({
	organizationId,
	organizationSlug,
	studyId,
	children,
}: StudyPageShellProps) {
	const t = useTranslations();

	const { data: study, isLoading } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: { id: studyId, organizationId },
		}),
	);

	// ─── Fetch stages from new StudyStage table ───
	const { data: stagesData } = useQuery(
		orpc.pricing.studies.studyStages.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	// Build stages array for stepper
	const stagesArray = stagesData?.stages ?? [];
	const entryPoint = stagesData?.entryPoint ?? "FROM_SCRATCH";

	if (isLoading) {
		return <StudyOverviewSkeleton />;
	}

	if (!study) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div className="relative mb-6">
					<div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full blur-2xl" />
					<div className="relative p-6 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-muted-foreground/10">
						<Calculator className="h-16 w-16 text-muted-foreground" />
					</div>
				</div>
				<p className="text-muted-foreground text-lg">{t("pricing.studies.notFound")}</p>
			</div>
		);
	}

	return (
		<div className="flex gap-6" dir="rtl">
			{/* Sidebar — desktop only */}
			<StudySidebar
				studyId={studyId}
				studyName={study.name}
				organizationSlug={organizationSlug}
				stages={stagesArray}
				entryPoint={entryPoint}
			/>

			{/* Main content area */}
			<div className="flex-1 min-w-0 space-y-6">
				{/* Header card */}
				<StudyHeaderCard study={study} />

				{/* Mobile stepper (hidden on lg where sidebar is shown) */}
				<div className="lg:hidden">
					<StudyPipelineStepper
						studyId={studyId}
						organizationSlug={organizationSlug}
						stages={stagesArray}
						entryPoint={entryPoint}
					/>
				</div>

				{/* Page content */}
				{children}
			</div>
		</div>
	);
}
