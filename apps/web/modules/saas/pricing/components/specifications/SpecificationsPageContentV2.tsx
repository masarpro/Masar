"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@ui/components/button";

import { SpecificationsPageContent } from "../pipeline/SpecificationsPageContent";
import { BOMSection } from "./BOMSection";

interface SpecificationsPageContentV2Props {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

export function SpecificationsPageContentV2({
	organizationId,
	organizationSlug,
	studyId,
}: SpecificationsPageContentV2Props) {
	// Check that QUANTITIES stage is APPROVED
	const { data: stagesData, isLoading: stagesLoading } = useQuery(
		orpc.pricing.studies.studyStages.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const stages = (stagesData as any)?.stages ?? [];
	const quantitiesStage = stages.find((s: any) => s.stage === "QUANTITIES");
	const isQuantitiesApproved = quantitiesStage?.status === "APPROVED";

	if (stagesLoading) {
		return null;
	}

	if (!isQuantitiesApproved) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center" dir="rtl">
				<div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 mb-4">
					<Lock className="h-10 w-10 text-amber-500" />
				</div>
				<h3 className="text-lg font-semibold mb-2">مرحلة المواصفات مقفلة</h3>
				<p className="text-muted-foreground mb-4 max-w-md">
					يجب اعتماد مرحلة الكميات أولاً قبل البدء في تحديد المواصفات
				</p>
				<Button asChild variant="outline" className="rounded-xl">
					<Link href={`/app/${organizationSlug}/pricing/studies/${studyId}/quantities`}>
						الرجوع للكميات
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6" dir="rtl">
			{/* Existing specs content (editing specs per item) */}
			<SpecificationsPageContent
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				studyId={studyId}
			/>

			{/* BOM Section */}
			<BOMSection
				organizationId={organizationId}
				studyId={studyId}
			/>
		</div>
	);
}
