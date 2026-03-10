"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Building2, FileEdit, PaintBucket, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { StructuralItemsEditor } from "./StructuralItemsEditor";
import { FinishingItemsEditor } from "./FinishingItemsEditor";
import { MEPItemsEditor } from "./MEPItemsEditor";
import { ManualItemsTable } from "../pipeline/ManualItemsTable";
import { QuantitiesSummary } from "../pipeline/QuantitiesSummary";
import { StageApprovalButton } from "../pipeline/StageApprovalButton";

interface QuantitiesSubTabsProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
	defaultTab?: string;
}

export function QuantitiesSubTabs({
	organizationId,
	organizationSlug,
	studyId,
	defaultTab,
}: QuantitiesSubTabsProps) {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();

	const currentTab = searchParams.get("tab") || defaultTab || "structural";

	// Fetch stages for the approval button
	const { data: stagesData } = useQuery(
		orpc.pricing.studies.stages.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const stages = stagesData?.stages ?? {
		quantities: "DRAFT" as const,
		specs: "NOT_STARTED" as const,
		costing: "NOT_STARTED" as const,
		pricing: "NOT_STARTED" as const,
		quotation: "NOT_STARTED" as const,
	};

	const handleTabChange = useCallback(
		(tab: string) => {
			const url = new URL(window.location.href);
			url.searchParams.set("tab", tab);
			router.replace(url.pathname + url.search, { scroll: false });
		},
		[router],
	);

	return (
		<div className="space-y-4">
			<Tabs value={currentTab} onValueChange={handleTabChange} dir="rtl">
				<TabsList className="w-full justify-start">
					<TabsTrigger value="structural" className="gap-1.5">
						<Building2 className="h-3.5 w-3.5" />
						{t("pricing.pipeline.tabStructural")}
					</TabsTrigger>
					<TabsTrigger value="finishing" className="gap-1.5">
						<PaintBucket className="h-3.5 w-3.5" />
						{t("pricing.pipeline.tabFinishing")}
					</TabsTrigger>
					<TabsTrigger value="mep" className="gap-1.5">
						<Wrench className="h-3.5 w-3.5" />
						{t("pricing.pipeline.tabMep")}
					</TabsTrigger>
					<TabsTrigger value="manual" className="gap-1.5">
						<FileEdit className="h-3.5 w-3.5" />
						{t("pricing.pipeline.tabManual")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="structural" className="mt-4">
					<StructuralItemsEditor
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						studyId={studyId}
					/>
				</TabsContent>

				<TabsContent value="finishing" className="mt-4">
					<FinishingItemsEditor
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						studyId={studyId}
					/>
				</TabsContent>

				<TabsContent value="mep" className="mt-4">
					<MEPItemsEditor
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						studyId={studyId}
					/>
				</TabsContent>

				<TabsContent value="manual" className="mt-4">
					<ManualItemsTable
						organizationId={organizationId}
						studyId={studyId}
					/>
				</TabsContent>
			</Tabs>

			{/* Summary */}
			<QuantitiesSummary organizationId={organizationId} studyId={studyId} />

			{/* Approval Button */}
			<div className="flex justify-end pt-4 border-t">
				<StageApprovalButton
					organizationId={organizationId}
					organizationSlug={organizationSlug}
					studyId={studyId}
					stage="quantities"
					status={stages.quantities}
					canReopen
				/>
			</div>
		</div>
	);
}
