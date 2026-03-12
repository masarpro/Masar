"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Calculator } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { StudyOverviewSkeleton } from "@saas/shared/components/skeletons";
import { useStudyConfig } from "../../hooks/useStudyConfig";
import { StudyHeaderCard } from "./StudyHeaderCard";
import { StudyConfigBar } from "./StudyConfigBar";
import { EditStudyConfigDialog } from "./EditStudyConfigDialog";
import { StudyPipelineStepper } from "./StudyPipelineStepper";

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
	const [editConfigOpen, setEditConfigOpen] = useState(false);

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
	const stagesArray = (stagesData as any)?.stages ?? [];
	const entryPoint = (stagesData as any)?.entryPoint ?? "FROM_SCRATCH";

	const studyType = (study as any)?.studyType ?? "FULL_PROJECT";
	const workScopes: string[] = (study as any)?.workScopes ?? [];

	const { enabledStageTypes } = useStudyConfig({
		studyType,
		workScopes,
		entryPoint,
	});

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
		<div className="space-y-6" dir="rtl">
			{/* Header card */}
			<StudyHeaderCard
				study={study as any}
				organizationSlug={organizationSlug}
			/>

			{/* Study config bar */}
			<StudyConfigBar
				studyType={studyType}
				workScopes={workScopes}
				onEdit={() => setEditConfigOpen(true)}
				canEdit
			/>

			{/* Pipeline stepper */}
			<StudyPipelineStepper
				studyId={studyId}
				organizationSlug={organizationSlug}
				stages={stagesArray}
				entryPoint={entryPoint}
				enabledStageTypes={enabledStageTypes as unknown as string[]}
			/>

			{/* Page content */}
			{children}

			{/* Edit config dialog */}
			<EditStudyConfigDialog
				open={editConfigOpen}
				onOpenChange={setEditConfigOpen}
				studyId={studyId}
				organizationId={organizationId}
				currentStudyType={studyType}
				currentWorkScopes={workScopes}
			/>
		</div>
	);
}
