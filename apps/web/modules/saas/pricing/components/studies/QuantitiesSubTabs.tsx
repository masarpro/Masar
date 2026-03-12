"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Building2, Calendar, FileEdit, Hash, PaintBucket, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { StructuralItemsEditor } from "./StructuralItemsEditor";
import { FinishingItemsEditor } from "./FinishingItemsEditor";
import { MEPItemsEditor } from "./MEPItemsEditor";
import { ManualItemsTable } from "../pipeline/ManualItemsTable";
import { ImportItemsDialog } from "./ImportItemsDialog";
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
	const queryClient = useQueryClient();

	// Fetch study to determine work scopes
	const { data: study } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: { id: studyId, organizationId },
		}),
	);

	const workScopes: string[] = (study as any)?.workScopes ?? [];

	// Determine which tabs to show based on work scopes
	const enabledTabs: string[] = [];
	if (workScopes.length === 0) {
		// fallback for old studies: show all
		enabledTabs.push("structural", "finishing", "mep", "manual");
	} else {
		if (workScopes.includes("STRUCTURAL")) enabledTabs.push("structural");
		if (workScopes.includes("FINISHING")) enabledTabs.push("finishing");
		if (workScopes.includes("MEP")) enabledTabs.push("mep");
		if (workScopes.includes("CUSTOM")) enabledTabs.push("manual");
	}

	const currentTab = searchParams.get("tab") || defaultTab || enabledTabs[0] || "structural";

	// Fetch stages for the approval button
	const { data: stagesData } = useQuery(
		orpc.pricing.studies.stages.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	// Fetch quantities summary for the bottom bar
	const { data: summaryData } = useQuery(
		orpc.pricing.studies.quantitiesSummary.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const stages = (stagesData as any)?.stages ?? {
		quantities: "DRAFT" as const,
		specs: "NOT_STARTED" as const,
		costing: "NOT_STARTED" as const,
		pricing: "NOT_STARTED" as const,
		quotation: "NOT_STARTED" as const,
	};

	const canApprove = (stagesData as any)?.canApprove ?? {
		quantities: true,
		specs: true,
		costing: true,
		pricing: true,
		quotation: true,
	};

	const totalItems = (summaryData as any)?.total ?? 0;
	const lastUpdated = (study as any)?.updatedAt;

	const handleTabChange = useCallback(
		(tab: string) => {
			const url = new URL(window.location.href);
			url.searchParams.set("tab", tab);
			router.replace(url.pathname + url.search, { scroll: false });
		},
		[router],
	);

	const formatDate = (date: Date | string | undefined) => {
		if (!date) return "—";
		const d = new Date(date);
		return d.toLocaleDateString("ar-SA", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	return (
		<div className="space-y-4">
			<Tabs value={currentTab} onValueChange={handleTabChange} dir="rtl">
				{enabledTabs.length > 1 && (
					<TabsList className="w-full justify-start">
						{enabledTabs.includes("structural") && (
							<TabsTrigger value="structural" className="gap-1.5">
								<Building2 className="h-3.5 w-3.5" />
								{t("pricing.pipeline.tabStructural")}
							</TabsTrigger>
						)}
						{enabledTabs.includes("finishing") && (
							<TabsTrigger value="finishing" className="gap-1.5">
								<PaintBucket className="h-3.5 w-3.5" />
								{t("pricing.pipeline.tabFinishing")}
							</TabsTrigger>
						)}
						{enabledTabs.includes("mep") && (
							<TabsTrigger value="mep" className="gap-1.5">
								<Wrench className="h-3.5 w-3.5" />
								{t("pricing.pipeline.tabMep")}
							</TabsTrigger>
						)}
						{enabledTabs.includes("manual") && (
							<TabsTrigger value="manual" className="gap-1.5">
								<FileEdit className="h-3.5 w-3.5" />
								{t("pricing.pipeline.tabManual")}
							</TabsTrigger>
						)}
					</TabsList>
				)}

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

				<TabsContent value="manual" className="mt-4 space-y-4">
					<div className="flex justify-end">
						<ImportItemsDialog
							organizationId={organizationId}
							studyId={studyId}
							onImported={() => {
								queryClient.invalidateQueries({
									queryKey: [["pricing", "studies", "manualItem"]],
								});
							}}
						/>
					</div>
					<ManualItemsTable
						organizationId={organizationId}
						studyId={studyId}
					/>
				</TabsContent>
			</Tabs>

			{/* Summary - hide when only one scope is enabled */}
			{enabledTabs.length > 1 && (
				<QuantitiesSummary organizationId={organizationId} studyId={studyId} />
			)}

			{/* Bottom Summary Bar */}
			<Card className="sticky bottom-0 z-10 border-t-2 border-primary/20 bg-card/95 backdrop-blur-sm">
				<CardContent className="p-4">
					<div
						className="flex items-center justify-between flex-wrap gap-3"
						dir="rtl"
					>
						<div className="flex items-center gap-6 text-sm">
							<span className="flex items-center gap-2 text-muted-foreground">
								<Hash className="h-4 w-4" />
								إجمالي البنود:{" "}
								<span className="font-semibold text-foreground">
									{totalItems}
								</span>
							</span>
							<span className="flex items-center gap-2 text-muted-foreground">
								<Calendar className="h-4 w-4" />
								آخر تحديث:{" "}
								<span className="font-semibold text-foreground">
									{formatDate(lastUpdated)}
								</span>
							</span>
						</div>
						<StageApprovalButton
							organizationId={organizationId}
							organizationSlug={organizationSlug}
							studyId={studyId}
							stage="quantities"
							status={stages.quantities}
							canReopen
							canApprove={canApprove.quantities}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
