"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { SummaryStatsCards } from "./SummaryStatsCards";
import { StructuralAccordion } from "./StructuralAccordion";
import { BOQSummaryTable } from "./BOQSummaryTable";
import { StudyEditorSkeleton } from "@saas/shared/components/skeletons";

interface StructuralItemsEditorProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

export function StructuralItemsEditor({
	organizationId,
	organizationSlug,
	studyId,
}: StructuralItemsEditorProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/pricing/studies/${studyId}`;

	const { data: study, isLoading: studyLoading } = useQuery<any>(
		orpc.pricing.studies.getById.queryOptions({
			input: {
				id: studyId,
				organizationId,
			},
		}),
	);

	const { data: structuralItems = [], refetch } = useQuery<any>(
		orpc.pricing.studies.getStructuralItems.queryOptions({
			input: {
				costStudyId: studyId,
				organizationId,
			},
		}),
	);

	if (studyLoading) {
		return <StudyEditorSkeleton />;
	}

	if (!study) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">{t("pricing.studies.notFound")}</p>
			</div>
		);
	}

	// Calculate summary stats
	const structuralStats = {
		concrete: structuralItems.reduce(
			(sum: any, item: any) => sum + (item.concreteVolume || 0),
			0
		),
		rebar: structuralItems.reduce(
			(sum: any, item: any) => sum + (item.steelWeight || 0),
			0
		),
		blocks: structuralItems
			.filter((item: any) => item.category === "blocks")
			.reduce((sum: any, item: any) => sum + (item.quantity || 0), 0),
		formwork: structuralItems
			.filter((item: any) => item.category !== "blocks" && item.category !== "plainConcrete")
			.reduce((sum: any, item: any) => {
				const dims = (item.dimensions as Record<string, number>) || {};
				return sum + (dims.formworkArea || 0);
			}, 0),
	};

	return (
		<div className="space-y-6">
			{/* Summary Stats */}
			<SummaryStatsCards structural={structuralStats} />

			{/* Structural Items Accordion */}
			<div className="space-y-4">
				<StructuralAccordion
					studyId={studyId}
					organizationId={organizationId}
					items={structuralItems.map((item: any) => ({
						id: item.id,
						category: item.category,
						name: item.name,
						quantity: item.quantity,
						dimensions: (item.dimensions as Record<string, number>) || {},
						concreteVolume: item.concreteVolume || 0,
						steelWeight: item.steelWeight || 0,
						totalCost: item.totalCost || 0,
						subCategory: item.subCategory,
					}))}
					onUpdate={refetch}
				/>
			</div>

			{/* BOQ Summary Table */}
			{structuralItems.length > 0 && (
				<BOQSummaryTable
					items={structuralItems.map((item: any) => ({
						id: item.id,
						category: item.category,
						subCategory: item.subCategory,
						name: item.name,
						quantity: item.quantity,
						dimensions: (item.dimensions as Record<string, number>) || {},
						concreteVolume: item.concreteVolume || 0,
						steelWeight: item.steelWeight || 0,
						totalCost: item.totalCost || 0,
					}))}
					studyId={studyId}
					organizationId={organizationId}
					studyName={(study as any)?.name}
				/>
			)}
		</div>
	);
}
