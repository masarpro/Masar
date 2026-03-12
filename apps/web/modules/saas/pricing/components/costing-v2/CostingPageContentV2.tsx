"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	Hammer,
	Lock,
	PaintBucket,
	Users,
	Wrench,
	Calculator,
	Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@ui/components/button";
import { useEffect, useState } from "react";

import { StructuralCostingTab } from "./StructuralCostingTab";
import { FinishingCostingTab } from "./FinishingCostingTab";
import { MEPCostingTab } from "./MEPCostingTab";
import { LaborOverviewTab } from "./LaborOverviewTab";
import { CostingSummaryTab } from "./CostingSummaryTab";

interface CostingPageContentV2Props {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

export function CostingPageContentV2({
	organizationId,
	organizationSlug,
	studyId,
}: CostingPageContentV2Props) {
	const [activeTab, setActiveTab] = useState("");

	// Check that SPECIFICATIONS stage is APPROVED
	const { data: stagesData, isLoading: stagesLoading } = useQuery(
		orpc.pricing.studies.studyStages.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const stages = (stagesData as any)?.stages ?? [];
	const specsStage = stages.find((s: { stage: string }) => s.stage === "SPECIFICATIONS");
	const isSpecsApproved = specsStage?.status === "APPROVED";

	// Also fetch study for buildingArea
	const { data: study } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: { id: studyId, organizationId },
		}),
	);

	// Auto-generate costing items when entering the page
	const generateMutation = useMutation(
		orpc.pricing.studies.costing.generate.mutationOptions({}),
	);

	useEffect(() => {
		if (isSpecsApproved && !generateMutation.isPending && !generateMutation.isSuccess) {
			(generateMutation as any).mutate({ organizationId, studyId });
		}
	}, [isSpecsApproved]);

	if (stagesLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!isSpecsApproved) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center" dir="rtl">
				<div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 mb-4">
					<Lock className="h-10 w-10 text-amber-500" />
				</div>
				<h3 className="text-lg font-semibold mb-2">مرحلة تسعير التكلفة مقفلة</h3>
				<p className="text-muted-foreground mb-4 max-w-md">
					يجب اعتماد مرحلة المواصفات أولاً قبل البدء في تسعير التكلفة
				</p>
				<Button asChild variant="outline" className="rounded-xl">
					<Link href={`/app/${organizationSlug}/pricing/studies/${studyId}/specifications`}>
						الرجوع للمواصفات
					</Link>
				</Button>
			</div>
		);
	}

	const buildingArea = Number((study as any)?.buildingArea ?? 0);

	// Build enabled tabs based on workScopes
	const workScopes: string[] = (study as any)?.workScopes ?? [];
	const enabledTabs: string[] = [];
	if (workScopes.length === 0) {
		enabledTabs.push("structural", "finishing", "mep");
	} else {
		if (workScopes.includes("STRUCTURAL")) enabledTabs.push("structural");
		if (workScopes.includes("FINISHING")) enabledTabs.push("finishing");
		if (workScopes.includes("MEP")) enabledTabs.push("mep");
	}
	// Always include labor and summary
	enabledTabs.push("labor", "summary");

	const tabDefs = [
		{ value: "structural", icon: Hammer, label: "إنشائي" },
		{ value: "finishing", icon: PaintBucket, label: "تشطيبات" },
		{ value: "mep", icon: Wrench, label: "كهروميكانيكية" },
		{ value: "labor", icon: Users, label: "عمالة" },
		{ value: "summary", icon: Calculator, label: "ملخص" },
	].filter((t) => enabledTabs.includes(t.value));

	const gridCols =
		tabDefs.length === 2
			? "grid-cols-2"
			: tabDefs.length === 3
				? "grid-cols-3"
				: tabDefs.length === 4
					? "grid-cols-4"
					: "grid-cols-5";

	// Set initial active tab to first enabled tab
	const defaultTab = enabledTabs[0] ?? "structural";

	return (
		<div className="space-y-6" dir="rtl">
			{/* Hero: cost per sqm (shown after data loads) */}

			<Tabs value={activeTab || defaultTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className={`grid w-full ${gridCols} rounded-xl h-auto p-1`}>
					{tabDefs.map((tab) => {
						const Icon = tab.icon;
						return (
							<TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 rounded-lg py-2.5 text-xs sm:text-sm">
								<Icon className="h-4 w-4" />
								<span className="hidden sm:inline">{tab.label}</span>
							</TabsTrigger>
						);
					})}
				</TabsList>

				{enabledTabs.includes("structural") && (
					<TabsContent value="structural" className="mt-4">
						<StructuralCostingTab
							organizationId={organizationId}
							studyId={studyId}
							buildingArea={buildingArea}
						/>
					</TabsContent>
				)}

				{enabledTabs.includes("finishing") && (
					<TabsContent value="finishing" className="mt-4">
						<FinishingCostingTab
							organizationId={organizationId}
							studyId={studyId}
						/>
					</TabsContent>
				)}

				{enabledTabs.includes("mep") && (
					<TabsContent value="mep" className="mt-4">
						<MEPCostingTab
							organizationId={organizationId}
							studyId={studyId}
						/>
					</TabsContent>
				)}

				<TabsContent value="labor" className="mt-4">
					<LaborOverviewTab
						organizationId={organizationId}
						studyId={studyId}
						buildingArea={buildingArea}
					/>
				</TabsContent>

				<TabsContent value="summary" className="mt-4">
					<CostingSummaryTab
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						studyId={studyId}
						buildingArea={buildingArea}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
