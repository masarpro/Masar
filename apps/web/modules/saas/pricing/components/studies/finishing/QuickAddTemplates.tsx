"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type { BuildingConfig } from "../../../lib/finishing-types";
import { generateVillaTemplate } from "../../../lib/finishing-templates";
import { formatCurrency } from "../../../lib/utils";

interface QuickAddTemplatesProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	studyId: string;
	buildingConfig?: BuildingConfig | null;
}

type QualityPreset = "ECONOMY" | "STANDARD" | "PREMIUM";

export function QuickAddTemplates({
	open,
	onOpenChange,
	organizationId,
	studyId,
	buildingConfig,
}: QuickAddTemplatesProps) {
	const t = useTranslations("pricing.studies.finishing");
	const queryClient = useQueryClient();
	const [quality, setQuality] = useState<QualityPreset>("STANDARD");

	const createBatchMutation = useMutation(
		orpc.pricing.studies.finishingItem.createBatch.mutationOptions({
			onSuccess: () => {
				toast.success(t("templateApplied"));
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
				onOpenChange(false);
			},
			onError: () => {
				toast.error(t("itemSaveError"));
			},
		}),
	);

	if (!buildingConfig || buildingConfig.floors.length === 0) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>{t("quickTemplates")}</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground py-4 text-center">
						يرجى إعداد أدوار المبنى أولاً في إعدادات المبنى أعلاه
					</p>
					<DialogFooter>
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							إغلاق
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	const previewItems = generateVillaTemplate(buildingConfig, quality);
	const totalCost = previewItems.reduce((sum, item) => sum + item.totalCost, 0);

	const handleApply = () => {
		createBatchMutation.mutate({
			organizationId,
			costStudyId: studyId,
			items: previewItems,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t("quickTemplates")}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Quality selector */}
					<div className="space-y-1">
						<label className="text-sm font-medium">{t("qualityLevel")}</label>
						<Select
							value={quality}
							onValueChange={(v) => setQuality(v as QualityPreset)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ECONOMY">{t("quality.ECONOMY")}</SelectItem>
								<SelectItem value="STANDARD">
									{t("quality.STANDARD")}
								</SelectItem>
								<SelectItem value="PREMIUM">{t("quality.PREMIUM")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Preview */}
					<div className="space-y-1">
						<p className="text-sm font-medium">
							معاينة ({previewItems.length} بند)
						</p>
						<div className="max-h-60 overflow-y-auto rounded-lg border">
							{previewItems.map((item, index) => (
								<div
									key={index}
									className="flex items-center justify-between border-b px-3 py-1.5 text-xs last:border-0"
								>
									<span className="truncate max-w-[60%]">{item.name}</span>
									<span className="text-muted-foreground">
										{formatCurrency(item.totalCost)}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Total */}
					<div className="rounded-lg bg-muted p-3 text-center">
						<p className="text-sm text-muted-foreground">التكلفة الإجمالية</p>
						<p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={createBatchMutation.isPending}
					>
						إلغاء
					</Button>
					<Button
						onClick={handleApply}
						disabled={createBatchMutation.isPending}
					>
						{createBatchMutation.isPending ? "جارٍ التطبيق..." : "تطبيق القالب"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
