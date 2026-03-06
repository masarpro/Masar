"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { getGroupedCategories } from "../../lib/finishing-categories";
import type { BuildingConfig } from "../../lib/finishing-types";
import { BuildingConfigPanel } from "./finishing/BuildingConfigPanel";
import { FinishingGroupSection } from "./finishing/FinishingGroupSection";
import { FinishingSummary } from "./finishing/FinishingSummary";
import { QuickAddTemplates } from "./finishing/QuickAddTemplates";

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
	const [templatesOpen, setTemplatesOpen] = useState(false);

	const { data: study, isLoading } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: {
				id: studyId,
				organizationId,
			},
		}),
	);

	if (isLoading) {
		return null;
	}

	if (!study) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">{t("pricing.studies.notFound")}</p>
			</div>
		);
	}

	const buildingConfig = study.buildingConfig as BuildingConfig | null;
	const finishingItems = study.finishingItems.map((item) => ({
		...item,
		area: item.area != null ? Number(item.area) : null,
		quantity: item.quantity != null ? Number(item.quantity) : null,
		length: item.length != null ? Number(item.length) : null,
		totalCost: Number(item.totalCost),
		wastagePercent: item.wastagePercent != null ? Number(item.wastagePercent) : null,
		materialPrice: item.materialPrice != null ? Number(item.materialPrice) : null,
		laborPrice: item.laborPrice != null ? Number(item.laborPrice) : null,
		calculationData: item.calculationData as Record<string, unknown> | null,
	}));
	const groupedCategories = getGroupedCategories();

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

			{/* Building Config */}
			<BuildingConfigPanel
				organizationId={organizationId}
				studyId={studyId}
				initialConfig={buildingConfig}
			/>

			{/* Summary */}
			<FinishingSummary
				totalItems={finishingItems.length}
				totalCost={Number(study.finishingCost)}
			/>

			{/* Quick Templates */}
			<Button
				variant="outline"
				onClick={() => setTemplatesOpen(true)}
				className="w-full sm:w-auto"
			>
				<FileText className="h-4 w-4 me-2" />
				{t("pricing.studies.finishing.quickTemplates")}
			</Button>

			{/* Groups */}
			<div className="space-y-8">
				{groupedCategories.map(({ group, categories }) => (
					<FinishingGroupSection
						key={group.id}
						group={group}
						categories={categories}
						items={finishingItems}
						organizationId={organizationId}
						studyId={studyId}
						buildingConfig={buildingConfig}
					/>
				))}
			</div>

			{/* Quick Templates Dialog */}
			<QuickAddTemplates
				open={templatesOpen}
				onOpenChange={setTemplatesOpen}
				organizationId={organizationId}
				studyId={studyId}
				buildingConfig={buildingConfig}
			/>
		</div>
	);
}
