"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	Building2,
	Calendar,
	FileEdit,
	Hash,
	Layers,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { isUnifiedStudy } from "../../lib/unified-flag";
import { ManualItemsTable } from "../pipeline/ManualItemsTable";
import { QuantitiesSummary } from "../pipeline/QuantitiesSummary";
import { StageApprovalButton } from "../pipeline/StageApprovalButton";
import { UnifiedItemsWorkspace } from "../unified-quantities";
import { ImportItemsDialog } from "./ImportItemsDialog";
import { StructuralItemsEditor } from "./StructuralItemsEditor";
// Legacy editors — only mounted when the unified workspace is OFF for this study
import { FinishingItemsEditor } from "./FinishingItemsEditor";
import { MEPItemsEditor } from "./MEPItemsEditor";
import { PaintBucket, Wrench } from "lucide-react";

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

	const { data: study } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: { id: studyId, organizationId },
		}),
	);

	const workScopes: string[] = (study as any)?.workScopes ?? [];
	const isUnified = isUnifiedStudy({ workScopes });

	// Tab list. When unified is in effect the legacy `finishing` and `mep`
	// editors are hidden — the unified tab is the single entry point for both.
	const enabledTabs = useMemo(() => {
		const tabs: string[] = [];
		const noScopes = workScopes.length === 0;

		if (workScopes.includes("STRUCTURAL")) tabs.push("structural");

		if (isUnified) {
			tabs.push("unified");
		} else {
			if (noScopes || workScopes.includes("FINISHING")) tabs.push("finishing");
			if (noScopes || workScopes.includes("MEP")) tabs.push("mep");
		}

		if (workScopes.includes("CUSTOM")) tabs.push("manual");
		return tabs;
	}, [workScopes, isUnified]);

	const currentTab =
		searchParams.get("tab") ||
		defaultTab ||
		enabledTabs[0] ||
		(isUnified ? "unified" : "structural");

	const { data: stagesData } = useQuery(
		orpc.pricing.studies.stages.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

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
						{enabledTabs.includes("unified") && (
							<TabsTrigger value="unified" className="gap-1.5">
								<Layers className="h-3.5 w-3.5" />
								تشطيبات + كهروميكانيكا
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

				{enabledTabs.includes("unified") && (
					<TabsContent value="unified" className="mt-4">
						<UnifiedItemsWorkspace
							costStudyId={studyId}
							organizationId={organizationId}
						/>
					</TabsContent>
				)}

				{enabledTabs.includes("finishing") && (
					<TabsContent value="finishing" className="mt-4">
						<FinishingItemsEditor
							organizationId={organizationId}
							organizationSlug={organizationSlug}
							studyId={studyId}
						/>
					</TabsContent>
				)}

				{enabledTabs.includes("mep") && (
					<TabsContent value="mep" className="mt-4">
						<MEPItemsEditor
							organizationId={organizationId}
							organizationSlug={organizationSlug}
							studyId={studyId}
						/>
					</TabsContent>
				)}

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

			{/* Legacy mid-page summary — only useful for the legacy multi-tab flow.
			    The unified workspace renders its own MiniPnLCard so we suppress this. */}
			{!isUnified && enabledTabs.length > 1 && (
				<QuantitiesSummary organizationId={organizationId} studyId={studyId} />
			)}

			{/* Bottom approval bar — hidden under unified mode because the workspace
			    has its own header CTAs (quote / context) and per-item totals; the
			    pipeline approval ladder no longer applies. */}
			{!isUnified && (
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
			)}
		</div>
	);
}
