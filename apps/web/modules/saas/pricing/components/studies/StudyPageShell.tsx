"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Calculator } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { StudyOverviewSkeleton } from "@saas/shared/components/skeletons";
import { StudyHeaderCard } from "./StudyHeaderCard";
import { StudyConfigBar } from "./StudyConfigBar";
import { EditStudyConfigDialog } from "./EditStudyConfigDialog";

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

	const studyType = (study as any)?.studyType ?? "FULL_PROJECT";
	const workScopes: string[] = (study as any)?.workScopes ?? [];

	if (isLoading) {
		return <StudyOverviewSkeleton />;
	}

	if (!study) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div className="relative mb-6">
					<div className="absolute inset-0 bg-muted/40 rounded-full" />
					<div className="relative p-6 rounded-2xl bg-muted border-2">
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

			{/* شريط المراحل العلوي حُذف بطلب جودت — المراحل مدموجة الآن
			    كأقسام مطوية أسفل صفحة الكميات (StudyStagesAccordion)،
			    وزر التحويل لعرض سعر يعيش هناك ويُنشئ العرض في نظام
			    عروض الأسعار مباشرة */}

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
