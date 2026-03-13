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
	Save,
	ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@ui/components/button";
import { useEffect, useState } from "react";

import { MaterialsCostingTab } from "./MaterialsCostingTab";
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

	// Also fetch study for buildingArea and studyType
	const { data: study } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: { id: studyId, organizationId },
		}),
	);

	// Study types that skip earlier stages have specs auto-APPROVED — skip the check for safety
	const studyType = (study as any)?.studyType ?? "FULL_PROJECT";
	const skipSpecsCheck = studyType === "QUICK_PRICING" || studyType === "CUSTOM_ITEMS";

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

	if (!skipSpecsCheck && !isSpecsApproved) {
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
		{ value: "structural", icon: Hammer, label: "المواد" },
		{ value: "finishing", icon: PaintBucket, label: "تشطيبات" },
		{ value: "mep", icon: Wrench, label: "كهروميكانيكية" },
		{ value: "labor", icon: Users, label: "المصنعيات" },
		{ value: "summary", icon: Calculator, label: "ملخص" },
	].filter((t) => enabledTabs.includes(t.value));

	// Set initial active tab to first enabled tab
	const defaultTab = enabledTabs[0] ?? "structural";

	return (
		<div className="space-y-6" dir="rtl">
			<Tabs dir="rtl" value={activeTab || defaultTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="flex w-full justify-start">
					{tabDefs.map((tab) => {
						const Icon = tab.icon;
						return (
							<TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 py-2.5 text-xs sm:text-sm">
								<Icon className="h-4 w-4" />
								<span className="hidden sm:inline">{tab.label}</span>
							</TabsTrigger>
						);
					})}
				</TabsList>

				{enabledTabs.includes("structural") && (
					<TabsContent value="structural" className="mt-4">
						<MaterialsCostingTab
							organizationId={organizationId}
							studyId={studyId}
							buildingArea={buildingArea}
							onNavigateToTab={setActiveTab}
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
					{/* Save + Navigate button below Labor tab */}
					<Button
						onClick={() => setActiveTab("summary")}
						className="w-full gap-2 py-6 text-base rounded-xl mt-4"
						size="lg"
					>
						<Save className="h-5 w-5" />
						حفظ تكلفة أسعار المصنعيات والانتقال إلى الملخص
						<ArrowLeft className="h-4 w-4" />
					</Button>
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
