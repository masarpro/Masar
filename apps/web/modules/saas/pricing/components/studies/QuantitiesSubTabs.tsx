"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Building2, FileEdit, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { isUnifiedStudy } from "../../lib/unified-flag";
import { ManualItemsTable } from "../pipeline/ManualItemsTable";
import { QuantitiesSummary } from "../pipeline/QuantitiesSummary";
import { UnifiedItemsWorkspace } from "../unified-quantities";
import { ImportItemsDialog } from "./ImportItemsDialog";
import { StudyStagesAccordion } from "./StudyStagesAccordion";
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
	const isUnified = isUnifiedStudy({
		workScopes,
		studyType: (study as any)?.studyType,
	});

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

			{/* المراحل مدموجة أسفل صفحة الكميات كأقسام مطوية (بطلب جودت):
			    المواصفات ← تسعير التكلفة ← التسعير، مع اعتماد الكميات وزر
			    التحويل لعرض سعر في رأس اللوحة. تظهر لكل الدراسات كاملة
			    المسار — وللدراسات الموحّدة فقط عندما تشمل نطاقاً إنشائياً
			    أو يدوياً (التشطيبات وMEP تُسعَّر داخل مساحة العمل). */}
			{!["QUICK_PRICING", "CUSTOM_ITEMS", "LUMP_SUM_ANALYSIS"].includes(
				(study as any)?.studyType ?? "",
			) &&
				(!isUnified ||
					workScopes.includes("STRUCTURAL") ||
					workScopes.includes("CUSTOM")) && (
					<StudyStagesAccordion
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						studyId={studyId}
						studyType={(study as any)?.studyType ?? "FULL_PROJECT"}
						clientName={(study as any)?.customerName}
					/>
				)}
		</div>
	);
}
