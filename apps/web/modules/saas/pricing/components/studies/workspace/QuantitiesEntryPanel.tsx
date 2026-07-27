"use client";

import { Building2 } from "lucide-react";
import { useState } from "react";

import { getSlabBlockCount } from "../../../lib/boq-aggregator";
import {
	createDefaultConfig,
	type StructuralBuildingConfig,
	type StructuralFloorConfig,
} from "../../../types/structural-building-config";
import { StructuralAccordion } from "../StructuralAccordion";
import { StructuralBuildingConfigBar } from "../StructuralBuildingConfigBar";
import { StructuralBuildingWizard } from "../StructuralBuildingWizard";
import { SummaryStatsCards } from "../SummaryStatsCards";

// ═══════════════════════════════════════════════════════════════
// لوحة إدخال الكميات
// ───────────────────────────────────────────────────────────────
// بطاقات الإجمالي + إعداد المبنى + أقسام الإدخال الإنشائية.
// جداول العرض انتقلت إلى شريط «جداول» أعلى الصفحة.
// ═══════════════════════════════════════════════════════════════

interface QuantitiesEntryPanelProps {
	organizationId: string;
	studyId: string;
	rawItems: any[];
	buildingConfig: StructuralBuildingConfig | null;
	isConfigComplete: boolean;
	enabledFloors: StructuralFloorConfig[];
	saveBuildingConfig: (config: StructuralBuildingConfig) => Promise<unknown>;
	isSaving: boolean;
	onUpdate: () => void;
}

export function QuantitiesEntryPanel({
	organizationId,
	studyId,
	rawItems,
	buildingConfig,
	isConfigComplete,
	enabledFloors,
	saveBuildingConfig,
	isSaving,
	onUpdate,
}: QuantitiesEntryPanelProps) {
	const [showWizard, setShowWizard] = useState<boolean | null>(null);

	const stats = {
		concrete: rawItems.reduce(
			(sum, item) => sum + (item.concreteVolume || 0),
			0,
		),
		rebar: rawItems.reduce((sum, item) => sum + (item.steelWeight || 0), 0),
		blocks:
			rawItems
				.filter((item) => item.category === "blocks")
				.reduce((sum, item) => sum + (item.quantity || 0), 0) +
			// بلوك أسقف الهوردي — كان مستثنى من بطاقة "إجمالي البلوك"
			rawItems.reduce((sum, item) => sum + getSlabBlockCount(item), 0),
		formwork: rawItems
			.filter(
				(item) =>
					item.category !== "blocks" &&
					item.category !== "plainConcrete",
			)
			.reduce((sum, item) => {
				const dims = (item.dimensions as Record<string, number>) || {};
				return sum + (dims.formworkArea || 0);
			}, 0),
	};

	// المعالج يظهر تلقائياً عند الإنشاء الأول فقط — بعد الحفظ أو التخطي
	// يُحفظ إعداد فلا يعود إلا من زر التعديل
	const shouldShowWizard =
		showWizard === true ||
		(showWizard === null && !buildingConfig && rawItems.length === 0);

	if (shouldShowWizard) {
		return (
			<div className="space-y-6">
				<SummaryStatsCards structural={stats} />
				<StructuralBuildingWizard
					initialConfig={buildingConfig}
					onSave={async (config) => {
						await saveBuildingConfig(config);
						setShowWizard(false);
					}}
					onSkip={async () => {
						if (!buildingConfig) {
							await saveBuildingConfig(createDefaultConfig());
						}
						setShowWizard(false);
					}}
					isSaving={isSaving}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<SummaryStatsCards structural={stats} />

			{isConfigComplete && enabledFloors.length > 0 ? (
				<StructuralBuildingConfigBar
					floors={enabledFloors}
					onEdit={() => setShowWizard(true)}
					buildingConfig={buildingConfig}
				/>
			) : (
				<button
					type="button"
					onClick={() => setShowWizard(true)}
					className="flex w-full items-center gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-2.5 text-start transition-colors hover:bg-muted/40"
				>
					<Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
					<span className="flex-1 text-muted-foreground text-sm">
						لم يتم إعداد بيانات المبنى الإنشائي
					</span>
					<span className="font-medium text-primary text-sm">
						إعداد المبنى
					</span>
				</button>
			)}

			<StructuralAccordion
				studyId={studyId}
				organizationId={organizationId}
				items={rawItems.map((item) => ({
					id: item.id,
					category: item.category,
					name: item.name,
					quantity: item.quantity,
					dimensions:
						(item.dimensions as Record<string, number>) || {},
					concreteVolume: item.concreteVolume || 0,
					steelWeight: item.steelWeight || 0,
					totalCost: item.totalCost || 0,
					subCategory: item.subCategory,
				}))}
				onUpdate={onUpdate}
				buildingFloors={isConfigComplete ? enabledFloors : undefined}
				buildingConfig={isConfigComplete ? buildingConfig : undefined}
			/>
		</div>
	);
}
