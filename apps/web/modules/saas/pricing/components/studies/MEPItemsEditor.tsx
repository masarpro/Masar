"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { StudyEditorSkeleton } from "@saas/shared/components/skeletons";
import type { SmartBuildingConfig } from "../../lib/smart-building-types";
import { deriveMEPQuantities } from "../../lib/mep-derivation-engine";
import { mergeMEPQuantities } from "../../lib/mep-merge";
import type { MEPMergedItem } from "../../types/mep";
import { MEPBuildingRequired } from "../mep/MEPBuildingRequired";
import { MEPDashboard } from "../mep/MEPDashboard";
import { MEPItemDialog } from "../mep/MEPItemDialog";

interface MEPItemsEditorProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

export function MEPItemsEditor({
	organizationId,
	organizationSlug,
	studyId,
}: MEPItemsEditorProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [isRederiving, setIsRederiving] = useState(false);
	const [editingItem, setEditingItem] = useState<MEPMergedItem | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);

	const { data: study, isLoading } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: {
				id: studyId,
				organizationId,
			},
		}),
	);

	// ─── Mutations ───
	const toggleMutation = useMutation(
		orpc.pricing.studies.mepItem.toggleEnabled.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
			},
		}),
	);

	const createBatchMutation = useMutation(
		orpc.pricing.studies.mepItem.createBatch.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
			},
		}),
	);

	const createSingleMutation = useMutation(
		orpc.pricing.studies.mepItem.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
				toast.success("تم إضافة البند بنجاح");
			},
			onError: () => {
				toast.error("حدث خطأ أثناء إضافة البند");
			},
		}),
	);

	// ─── Derived + Merged items ───
	const buildingConfig = study?.buildingConfig as SmartBuildingConfig | null;

	const derived = useMemo(() => {
		if (!buildingConfig?.floors?.length) return [];
		return deriveMEPQuantities(
			buildingConfig,
			(study as any)?.projectType || "RESIDENTIAL",
		);
	}, [buildingConfig, study]);

	const savedItems = useMemo(() => {
		if (!study?.mepItems) return [];
		return study.mepItems.map((item) => ({
			...item,
			quantity: Number(item.quantity),
			materialPrice: Number(item.materialPrice),
			laborPrice: Number(item.laborPrice),
			wastagePercent: Number(item.wastagePercent),
			materialCost: Number(item.materialCost),
			laborCost: Number(item.laborCost),
			totalCost: Number(item.totalCost),
			itemType: item.itemType ?? null,
			calculationData:
				(item.calculationData as Record<string, any> | null) ?? null,
			specData:
				(item.specData as Record<string, any> | null) ?? null,
		}));
	}, [study?.mepItems]);

	const merged = useMemo(
		() => mergeMEPQuantities(derived, savedItems),
		[derived, savedItems],
	);

	// ─── Handlers ───
	const handleToggleEnabled = useCallback(
		(item: MEPMergedItem, enabled: boolean) => {
			if (!item.id) {
				toast.error("لا يمكن تعديل بند غير محفوظ");
				return;
			}
			toggleMutation.mutate({
				id: item.id,
				costStudyId: studyId,
				organizationId,
				isEnabled: enabled,
			});
		},
		[toggleMutation, studyId, organizationId],
	);

	const handleEdit = useCallback((item: MEPMergedItem) => {
		setEditingItem(item);
		setEditDialogOpen(true);
	}, []);

	const handleAddManual = useCallback(
		(item: {
			category: string;
			subCategory: string;
			name: string;
			quantity: number;
			unit: string;
			materialPrice: number;
			laborPrice: number;
		}) => {
			createSingleMutation.mutate({
				organizationId,
				costStudyId: studyId,
				category: item.category,
				subCategory: item.subCategory,
				name: item.name,
				quantity: item.quantity,
				unit: item.unit,
				materialPrice: item.materialPrice,
				laborPrice: item.laborPrice,
				wastagePercent: 10,
				calculationMethod: "manual",
				dataSource: "manual",
				isEnabled: true,
			});
		},
		[createSingleMutation, organizationId, studyId],
	);

	const handleRederive = useCallback(async () => {
		if (!buildingConfig?.floors?.length) return;

		setIsRederiving(true);
		try {
			// Find new items that haven't been saved yet
			const newItems = merged.filter((i) => i.isNew && !i.isSaved);

			if (newItems.length === 0) {
				toast.info("جميع البنود محفوظة بالفعل");
				setIsRederiving(false);
				return;
			}

			await createBatchMutation.mutateAsync({
				organizationId,
				costStudyId: studyId,
				items: newItems.map((item) => ({
					category: item.category,
					subCategory: item.subCategory,
					itemType: item.itemType || undefined,
					name: item.name,
					floorId: item.floorId,
					floorName: item.floorName,
					roomId: item.roomId,
					roomName: item.roomName,
					scope: item.scope,
					quantity: item.quantity,
					unit: item.unit,
					materialPrice: item.materialPrice,
					laborPrice: item.laborPrice,
					wastagePercent: item.wastagePercent,
					calculationMethod: "auto_derived",
					dataSource: "auto",
					sourceFormula: item.sourceFormula,
					groupKey: item.groupKey,
					qualityLevel: item.qualityLevel,
					isEnabled: true,
				})),
			});

			toast.success(`تم حفظ ${newItems.length} بند جديد`);
		} catch {
			toast.error("حدث خطأ أثناء حفظ البنود");
		} finally {
			setIsRederiving(false);
		}
	}, [
		buildingConfig,
		merged,
		createBatchMutation,
		organizationId,
		studyId,
	]);

	// ─── Loading / Not Found ───
	if (isLoading) {
		return <StudyEditorSkeleton />;
	}

	if (!study) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">
					{t("pricing.studies.notFound")}
				</p>
			</div>
		);
	}

	// ─── No Building Config ───
	if (!buildingConfig?.floors?.length) {
		return (
			<MEPBuildingRequired
				studyId={studyId}
				organizationSlug={organizationSlug}
			/>
		);
	}

	// ─── Check for new unsaved items (cascade notification) ───
	const hasNewItems = merged.some((i) => i.isNew && !i.isSaved);

	// ─── Main Dashboard ───
	return (
		<>
			<MEPDashboard
				mergedItems={merged}
				onToggleEnabled={handleToggleEnabled}
				onEdit={handleEdit}
				onRederive={handleRederive}
				isRederiving={isRederiving}
				onAddManual={handleAddManual}
				hasNewItems={hasNewItems}
			/>
			<MEPItemDialog
				item={editingItem}
				studyId={studyId}
				organizationId={organizationId}
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
			/>
		</>
	);
}
