"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { StudyEditorSkeleton } from "@saas/shared/components/skeletons";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, type ReactNode } from "react";

import type { StructuralItem } from "../../../lib/boq-aggregator";
import { useStructuralBuildingConfig } from "../../../hooks/useStructuralBuildingConfig";
import { CostingPageContentV2 } from "../../costing-v2/CostingPageContentV2";
import { SpecificationsPageContentV2 } from "../../specifications/SpecificationsPageContentV2";
import {
	BOQCostReportPanel,
	BOQCuttingPanel,
	BOQFactoryOrderPanel,
	BOQSummaryPanel,
} from "../boq/BOQPanels";
import { BOQTablesProvider } from "../boq/BOQTablesContext";
import { QuantitiesEntryPanel } from "./QuantitiesEntryPanel";
import { TablesToolbar } from "./TablesToolbar";
import { WorkspaceNav, type WorkspaceView } from "./WorkspaceNav";

// ═══════════════════════════════════════════════════════════════
// مساحة عمل دراسة الكميات الإنشائية
// ───────────────────────────────────────────────────────────────
// كل اللوحات تُركَّب مرة واحدة وتبقى حيّة؛ التبديل بين التبويبات
// إظهار/إخفاء فقط — بلا إعادة تحميل ولا فقدان لحالة النماذج.
// ═══════════════════════════════════════════════════════════════

const VALID_VIEWS: WorkspaceView[] = [
	"quantities",
	"specs",
	"costing",
	"table-summary",
	"table-factory",
	"table-cutting",
	"table-cost",
];

interface StudyWorkspaceProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

export function StudyWorkspace({
	organizationId,
	organizationSlug,
	studyId,
}: StudyWorkspaceProps) {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();

	const { data: study, isLoading: studyLoading } = useQuery<any>(
		orpc.pricing.studies.getById.queryOptions({
			input: { id: studyId, organizationId },
		}),
	);

	const { data: rawItems = [], refetch } = useQuery<any>(
		orpc.pricing.studies.getStructuralItems.queryOptions({
			input: { costStudyId: studyId, organizationId },
		}),
	);

	const {
		buildingConfig,
		isConfigComplete,
		enabledFloors,
		saveBuildingConfig,
		isSaving,
	} = useStructuralBuildingConfig({ organizationId, studyId });

	// شكل موحّد للبنود يستهلكه محرك التجميع وكل الجداول
	const items = useMemo<StructuralItem[]>(
		() =>
			(rawItems as any[]).map((item) => ({
				id: item.id,
				category: item.category,
				subCategory: item.subCategory,
				name: item.name,
				quantity: item.quantity,
				dimensions: (item.dimensions as Record<string, number>) || {},
				concreteVolume: item.concreteVolume || 0,
				steelWeight: item.steelWeight || 0,
				totalCost: item.totalCost || 0,
			})),
		[rawItems],
	);

	const floorOptions = useMemo(
		() =>
			isConfigComplete
				? enabledFloors.map((f) => ({
						id: f.id,
						label: f.label,
						icon: f.icon,
						sortOrder: f.sortOrder,
					}))
				: undefined,
		[isConfigComplete, enabledFloors],
	);

	// التبويب النشط في العنوان — يسمح بالمشاركة والرجوع
	const viewParam = searchParams.get("view") as WorkspaceView | null;
	const view: WorkspaceView =
		viewParam && VALID_VIEWS.includes(viewParam) ? viewParam : "quantities";

	const handleViewChange = useCallback(
		(next: WorkspaceView) => {
			const url = new URL(window.location.href);
			url.searchParams.set("view", next);
			router.replace(url.pathname + url.search, { scroll: false });
		},
		[router],
	);

	if (studyLoading) {
		return <StudyEditorSkeleton />;
	}

	if (!study) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
				<AlertCircle className="h-10 w-10 text-muted-foreground/50" />
				<p className="text-muted-foreground">
					{t("pricing.studies.notFound")}
				</p>
			</div>
		);
	}

	const studyName = study?.name as string | undefined;

	return (
		<BOQTablesProvider
			organizationId={organizationId}
			studyId={studyId}
			studyName={studyName}
			items={items}
			enabledFloors={floorOptions}
		>
			<div className="space-y-4" dir="rtl">
				{/* التحويل لعرض سعر يعيش في تبويب «التسعير والأرباح» داخل
				    التكلفة والتسعير — لا زر عائم هنا */}
				<WorkspaceNav
					value={view}
					onChange={handleViewChange}
					itemsCount={items.length}
				/>

				{/* ─── اللوحات: كلها مركّبة، تُخفى غير النشطة ─── */}
				<Panel active={view === "quantities"}>
					<QuantitiesEntryPanel
						organizationId={organizationId}
						studyId={studyId}
						rawItems={rawItems as any[]}
						buildingConfig={buildingConfig}
						isConfigComplete={isConfigComplete}
						enabledFloors={enabledFloors}
						saveBuildingConfig={saveBuildingConfig}
						isSaving={isSaving}
						onUpdate={refetch}
					/>
				</Panel>

				<Panel active={view === "specs"}>
					<SpecificationsPageContentV2
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						studyId={studyId}
					/>
				</Panel>

				<Panel active={view === "costing"}>
					<CostingPageContentV2
						organizationId={organizationId}
						organizationSlug={organizationSlug}
						studyId={studyId}
					/>
				</Panel>

				{items.length > 0 && (
					<>
						<Panel active={view === "table-summary"}>
							<div className="space-y-4">
								<TablesToolbar
									tab="summary"
									title="ملخص الكميات"
								/>
								<BOQSummaryPanel />
							</div>
						</Panel>

						<Panel active={view === "table-factory"}>
							<div className="space-y-4">
								<TablesToolbar
									tab="factory"
									title="طلبية المصنع — حديد التسليح"
								/>
								<BOQFactoryOrderPanel />
							</div>
						</Panel>

						<Panel active={view === "table-cutting"}>
							<div className="space-y-4">
								<TablesToolbar
									tab="cutting"
									title="تفاصيل التفصيل — ورشة القص"
								/>
								<BOQCuttingPanel />
							</div>
						</Panel>

						<Panel active={view === "table-cost"}>
							<div className="space-y-4">
								<TablesToolbar
									tab="cost"
									title="تقرير التكلفة والتسعير"
									showFilters={false}
								/>
								<BOQCostReportPanel />
							</div>
						</Panel>
					</>
				)}
			</div>
		</BOQTablesProvider>
	);
}

/**
 * لوحة تبقى مركّبة دائماً وتُخفى بالعرض — الحفاظ على حالة النماذج
 * والاستعلامات يجعل التبديل فورياً بلا أي تحميل.
 */
function Panel({ active, children }: { active: boolean; children: ReactNode }) {
	// صنف Tailwind لا سمة hidden — السمة تُهزم بأي قاعدة display في CSS
	// فتظهر اللوحات كلها فوق بعضها
	return (
		<div className={active ? undefined : "hidden"} aria-hidden={!active}>
			{children}
		</div>
	);
}
