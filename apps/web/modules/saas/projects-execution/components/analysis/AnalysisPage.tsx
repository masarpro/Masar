"use client";

import { useState } from "react";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { apiClient } from "@shared/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SCurveChart } from "./SCurveChart";
import { DelayAnalysisView } from "./DelayAnalysisView";
import { PlannedVsActualTable } from "./PlannedVsActualTable";

interface AnalysisPageProps {
	projectId: string;
}

export function AnalysisPage({ projectId }: AnalysisPageProps) {
	const t = useTranslations();
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const { data: delayData, isLoading: isLoadingDelay } = useQuery({
		queryKey: [
			"project-execution-delay-analysis",
			organizationId,
			projectId,
		],
		queryFn: async () => {
			if (!organizationId) return null;
			return apiClient.projectExecution.getDelayAnalysis({
				organizationId,
				projectId,
			});
		},
		enabled: !!organizationId,
	});

	const { data: pvActualData, isLoading: isLoadingPvActual } = useQuery({
		queryKey: [
			"project-execution-planned-vs-actual",
			organizationId,
			projectId,
		],
		queryFn: async () => {
			if (!organizationId) return null;
			return apiClient.projectExecution.getPlannedVsActual({
				organizationId,
				projectId,
			});
		},
		enabled: !!organizationId,
	});

	// Build S-Curve data from planned vs actual
	const sCurveData =
		(pvActualData as any)?.sCurve ??
		(pvActualData as any)?.data?.map((d: any) => ({
			date: d.date,
			planned: d.plannedProgress ?? 0,
			actual: d.actualProgress ?? 0,
		})) ??
		[];

	const delayItems =
		(delayData as any)?.activities ??
		(delayData as any)?.delays ??
		[];

	const pvActualItems =
		(pvActualData as any)?.activities ??
		(pvActualData as any)?.comparison ??
		[];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between gap-4 flex-wrap">
				<div>
					<h2 className="text-lg font-semibold">
						{t("execution.analysis.title")}
					</h2>
					<p className="text-sm text-muted-foreground">
						{t("execution.analysis.subtitle")}
					</p>
				</div>
				<Button variant="outline" size="sm" asChild>
					<Link
						href={`/app/${organizationSlug}/projects/${projectId}/execution`}
					>
						<ArrowRightIcon className="h-4 w-4 me-1" />
						{t("execution.analysis.backToExecution")}
					</Link>
				</Button>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="sCurve">
				<TabsList>
					<TabsTrigger value="sCurve">
						{t("execution.analysis.tabs.sCurve")}
					</TabsTrigger>
					<TabsTrigger value="delay">
						{t("execution.analysis.tabs.delayAnalysis")}
					</TabsTrigger>
					<TabsTrigger value="pvActual">
						{t("execution.analysis.tabs.plannedVsActual")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="sCurve" className="mt-4">
					<div className="rounded-lg border p-4">
						<h3 className="font-medium mb-4">
							{t("execution.analysis.sCurve.title")}
						</h3>
						<SCurveChart data={sCurveData} />
					</div>
				</TabsContent>

				<TabsContent value="delay" className="mt-4">
					{isLoadingDelay ? (
						<div className="h-48 rounded-lg bg-muted animate-pulse" />
					) : (
						<DelayAnalysisView data={delayItems} />
					)}
				</TabsContent>

				<TabsContent value="pvActual" className="mt-4">
					{isLoadingPvActual ? (
						<div className="h-48 rounded-lg bg-muted animate-pulse" />
					) : (
						<PlannedVsActualTable data={pvActualItems} />
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
