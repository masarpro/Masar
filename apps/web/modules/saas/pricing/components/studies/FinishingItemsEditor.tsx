"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import type { SmartBuildingConfig } from "../../lib/smart-building-types";
import type { SavedFinishingItem } from "../../lib/merge-quantities";
import { BuildingSetupWizard } from "../finishing/BuildingSetupWizard";
import { QuantitiesDashboard } from "../finishing/QuantitiesDashboard";
import type { CascadeChange } from "../finishing/CascadeNotification";
import { StudyEditorSkeleton } from "@saas/shared/components/skeletons";

interface FinishingItemsEditorProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

export function FinishingItemsEditor({
	organizationId,
	organizationSlug,
	studyId,
}: FinishingItemsEditorProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/pricing/studies/${studyId}`;
	const [showWizard, setShowWizard] = useState<boolean | null>(null);
	const [pendingCascade, setPendingCascade] = useState<{
		changes: CascadeChange[];
		skippedManualCount: number;
	} | null>(null);

	const { data: study, isLoading } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: {
				id: studyId,
				organizationId,
			},
		}),
	);

	const { data: finishingItems = [] } = useQuery(
		orpc.pricing.studies.getFinishingItems.queryOptions({
			input: {
				costStudyId: studyId,
				organizationId,
			},
		}),
	);

	const handleWizardComplete = useCallback(
		(cascadeInfo?: { changes: CascadeChange[]; skippedManualCount: number }) => {
			setShowWizard(false);
			if (cascadeInfo) {
				setPendingCascade(cascadeInfo);
			}
		},
		[],
	);

	const handleWizardSkip = useCallback(() => {
		setShowWizard(false);
	}, []);

	if (isLoading) {
		return <StudyEditorSkeleton />;
	}

	if (!study) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">{t("pricing.studies.notFound")}</p>
			</div>
		);
	}

	const smartConfig = (study as any).buildingConfig as SmartBuildingConfig | null;
	const isWizardComplete = smartConfig?.isComplete === true;

	// Map finishing items to SavedFinishingItem shape
	const savedItems: SavedFinishingItem[] = (finishingItems as any[]).map(
		(item: any) => ({
			id: item.id,
			category: item.category,
			subCategory: item.subCategory,
			name: item.name,
			floorId: item.floorId,
			floorName: item.floorName,
			area: item.area != null ? Number(item.area) : null,
			quantity: item.quantity != null ? Number(item.quantity) : null,
			length: item.length != null ? Number(item.length) : null,
			unit: item.unit,
			wastagePercent:
				item.wastagePercent != null
					? Number(item.wastagePercent)
					: null,
			materialPrice:
				item.materialPrice != null
					? Number(item.materialPrice)
					: null,
			laborPrice:
				item.laborPrice != null ? Number(item.laborPrice) : null,
			materialCost: null,
			laborCost: null,
			totalCost: Number(item.totalCost),
			dataSource: item.dataSource,
			sourceFormula: item.sourceFormula,
			isEnabled: item.isEnabled,
			groupKey: item.groupKey,
			scope: item.scope,
			sortOrder: item.sortOrder,
			calculationData: item.calculationData as Record<
				string,
				unknown
			> | null,
			specData: item.specData ?? undefined,
		}),
	);

	// Show wizard if: explicitly requested, or no config yet
	const shouldShowWizard =
		showWizard === true ||
		(showWizard === null && !isWizardComplete && !smartConfig?.floors?.length);

	if (shouldShowWizard) {
		return (
			<div className="space-y-4">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href={basePath}>
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
				</div>
				<BuildingSetupWizard
					organizationId={organizationId}
					studyId={studyId}
					initialConfig={smartConfig}
					savedItems={savedItems}
					onComplete={handleWizardComplete}
					onSkip={handleWizardSkip}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href={basePath}>
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<h1 className="text-xl font-bold">
					{t("pricing.studies.finishing.title")}
				</h1>
			</div>

			{/* Quantities Dashboard */}
			<QuantitiesDashboard
				organizationId={organizationId}
				studyId={studyId}
				config={smartConfig}
				savedItems={savedItems}
				initialCascade={pendingCascade}
				onEditConfig={() => setShowWizard(true)}
			/>
		</div>
	);
}
