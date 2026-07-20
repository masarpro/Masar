"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	Hammer,
	PaintBucket,
	Users,
	Wrench,
	Calculator,
	Receipt,
	Save,
	ArrowLeft,
	Tags,
} from "lucide-react";
import { Button } from "@ui/components/button";
import { useEffect, useState } from "react";

import { MaterialsCostingTab } from "./MaterialsCostingTab";
import { FinishingCostingTab } from "./FinishingCostingTab";
import { MEPCostingTab } from "./MEPCostingTab";
import { LaborOverviewTab } from "./LaborOverviewTab";
import { CostingSummaryTab } from "./CostingSummaryTab";
import { IndirectCostsTab } from "./IndirectCostsTab";
import { PricingPageContentV2 } from "../pricing-v2/PricingPageContentV2";
import { usePageContextStore } from "@saas/ai/hooks/use-page-context";
import { StudyEditorSkeleton } from "@saas/shared/components/skeletons";
import { isUnifiedStudy } from "../../lib/unified-flag";

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

	// Fetch study for buildingArea and studyType
	const { data: study } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: { id: studyId, organizationId },
		}),
	);

	const studyType = (study as any)?.studyType ?? "FULL_PROJECT";

	// المراحل حية دائماً — توليد بنود التكلفة يعمل فور الدخول بلا شرط اعتماد
	const generateMutation = useMutation(
		orpc.pricing.studies.costing.generate.mutationOptions({}),
	);

	useEffect(() => {
		if (!generateMutation.isPending && !generateMutation.isSuccess) {
			(generateMutation as any).mutate({ organizationId, studyId });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// إثراء سياق المساعد بمعلومات صفحة تسعير التكلفة v2
	const updateAiContext = usePageContextStore((s) => s.updateContext);
	useEffect(() => {
		const studyName = (study as any)?.name ?? "";
		const buildingAreaVal = Number((study as any)?.buildingArea ?? 0);
		updateAiContext({
			pageName: "Cost Pricing v2",
			pageNameAr: "تسعير التكلفة (الإصدار الجديد)",
			pageDescription:
				"صفحة تسعير التكلفة بنظام التبويبات: المواد، التشطيبات، MEP، العمالة، الملخص. يحسب تكلفة كل بند تلقائياً",
			visibleStats: {
				studyName,
				buildingArea: buildingAreaVal,
				studyType,
				activeTab: activeTab || "default",
			},
		});
	}, [study, studyType, activeTab, updateAiContext]);

	if (!study) {
		return <StudyEditorSkeleton />;
	}

	const buildingArea = Number((study as any)?.buildingArea ?? 0);

	// Build enabled tabs based on workScopes.
	// الدراسات الموحّدة تُسعِّر التشطيبات وMEP داخل مساحة العمل الموحدة —
	// هذه المرحلة تبقى للإنشائي/اليدوي/العمالة فقط (يطابق تخطي التوليد
	// في costingGenerateItems على السيرفر).
	const workScopes: string[] = (study as any)?.workScopes ?? [];
	const unified = isUnifiedStudy({
		workScopes,
		studyType: (study as any)?.studyType,
	});
	const enabledTabs: string[] = [];
	if (workScopes.length === 0) {
		enabledTabs.push("structural");
		if (!unified) enabledTabs.push("finishing", "mep");
	} else {
		if (workScopes.includes("STRUCTURAL")) enabledTabs.push("structural");
		if (!unified && workScopes.includes("FINISHING"))
			enabledTabs.push("finishing");
		if (!unified && workScopes.includes("MEP")) enabledTabs.push("mep");
	}
	// Always include labor, indirect costs, summary and pricing —
	// لوحة واحدة مدموجة لتسعير التكلفة والتسعير (كل شيء حي)
	enabledTabs.push("labor", "indirect", "summary", "pricing");

	const tabDefs = [
		{ value: "structural", icon: Hammer, label: "المواد" },
		{ value: "finishing", icon: PaintBucket, label: "تشطيبات" },
		{ value: "mep", icon: Wrench, label: "كهروميكانيكية" },
		{ value: "labor", icon: Users, label: "المصنعيات" },
		{ value: "indirect", icon: Receipt, label: "مصاريف غير مباشرة" },
		{ value: "summary", icon: Calculator, label: "ملخص التكلفة" },
		{ value: "pricing", icon: Tags, label: "التسعير والأرباح" },
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

				<TabsContent value="indirect" className="mt-4">
					<IndirectCostsTab
						organizationId={organizationId}
						studyId={studyId}
					/>
				</TabsContent>

				<TabsContent value="summary" className="mt-4">
					<CostingSummaryTab
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						studyId={studyId}
						buildingArea={buildingArea}
						onNavigateToPricing={() => setActiveTab("pricing")}
					/>
				</TabsContent>

				<TabsContent value="pricing" className="mt-4">
					<PricingPageContentV2
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						studyId={studyId}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
