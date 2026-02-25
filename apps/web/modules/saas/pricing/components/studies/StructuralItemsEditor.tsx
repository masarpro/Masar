"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { StudyHeaderCard } from "./StudyHeaderCard";
import { SummaryStatsCards } from "./SummaryStatsCards";
import { StructuralAccordion } from "./StructuralAccordion";

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

	const { data: study, isLoading, refetch } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: {
				id: studyId,
				organizationId,
			},
		}),
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
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
		concrete: study.structuralItems.reduce(
			(sum, item) => sum + (item.concreteVolume || 0),
			0
		),
		rebar: study.structuralItems.reduce(
			(sum, item) => sum + (item.steelWeight || 0),
			0
		),
	};

	return (
		<div className="space-y-6">
			{/* Navigation */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href={basePath}>
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-bold">{t("pricing.studies.structural.title")}</h1>
					<p className="text-muted-foreground text-sm">
						{t("pricing.studies.structural.subtitle")}
					</p>
				</div>
			</div>

			{/* Study Header */}
			<StudyHeaderCard study={study} />

			{/* Summary Stats */}
			<SummaryStatsCards structural={structuralStats} />

			{/* Structural Items Accordion */}
			<div className="space-y-4">
				<StructuralAccordion
					studyId={studyId}
					organizationId={organizationId}
					items={study.structuralItems.map((item) => ({
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
		</div>
	);
}
