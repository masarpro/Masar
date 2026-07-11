"use client";

import { useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { toast } from "sonner";
import type {
	StructuralBuildingConfig,
	StructuralFloorConfig,
} from "../types/structural-building-config";
import {
	configToFloorLabels,
	configToColumnFloorDefs,
} from "../types/structural-building-config";

interface UseStructuralBuildingConfigParams {
	organizationId: string;
	studyId: string;
}

export function useStructuralBuildingConfig({
	organizationId,
	studyId,
}: UseStructuralBuildingConfigParams) {
	const queryClient = useQueryClient();

	// Fetch existing specs (contains buildingConfig)
	const { data: specsData, isLoading } = useQuery(
		orpc.pricing.studies.structuralSpecs.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const buildingConfig = useMemo<StructuralBuildingConfig | null>(() => {
		const raw = (specsData as any)?.buildingConfig;
		if (!raw) return null;
		return raw as StructuralBuildingConfig;
	}, [specsData]);

	const isConfigComplete = buildingConfig?.isComplete === true;

	const enabledFloors = useMemo<StructuralFloorConfig[]>(() => {
		if (!buildingConfig) return [];
		return buildingConfig.floors
			.filter((f) => f.enabled)
			.sort((a, b) => a.sortOrder - b.sortOrder);
	}, [buildingConfig]);

	const floorLabels = useMemo<string[]>(() => {
		if (!buildingConfig) return [];
		return configToFloorLabels(buildingConfig);
	}, [buildingConfig]);

	const floorDefsForColumns = useMemo(() => {
		if (!buildingConfig) return [];
		return configToColumnFloorDefs(buildingConfig);
	}, [buildingConfig]);

	// Save mutation: merges buildingConfig into existing specs
	const saveMutation = useMutation(
		orpc.pricing.studies.structuralSpecs.set.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "structuralSpecs"]],
				});
			},
			onError: (e: any) => toast.error(e.message || "حدث خطأ في الحفظ"),
		}),
	);

	const saveBuildingConfig = useCallback(
		async (config: StructuralBuildingConfig) => {
			// نرسل buildingConfig فقط — الخادم يدمج على مستوى المفاتيح العليا،
			// وإرسال الكاش الكامل كان يسابق حفظ صفحة المواصفات (آخر كتابة تمسح الأخرى)
			await saveMutation.mutateAsync({
				organizationId,
				studyId,
				specs: { buildingConfig: config },
			});
		},
		[saveMutation, organizationId, studyId],
	);

	return {
		buildingConfig,
		isConfigComplete,
		enabledFloors,
		floorLabels,
		floorDefsForColumns,
		saveBuildingConfig,
		isSaving: saveMutation.isPending,
		isLoading,
	};
}
