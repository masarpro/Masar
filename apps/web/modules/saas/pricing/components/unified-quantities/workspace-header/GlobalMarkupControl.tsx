"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@ui/components/alert-dialog";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { Label } from "@ui/components/label";
import { Slider } from "@ui/components/slider";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Pin } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";

interface Props {
	costStudyId: string;
	organizationId: string;
	currentValue: number;
	customMarkupCount: number;
}

export function GlobalMarkupControl({
	costStudyId,
	organizationId,
	currentValue,
	customMarkupCount,
}: Props) {
	const queryClient = useQueryClient();
	const [local, setLocal] = useState(currentValue);
	const [confirmOpen, setConfirmOpen] = useState(false);

	useEffect(() => {
		setLocal(currentValue);
	}, [currentValue]);

	const mutation = useMutation(
		orpc.unifiedQuantities.pricing.updateGlobalMarkup.mutationOptions({
			onSuccess: (result: any) => {
				queryClient.invalidateQueries({
					queryKey: orpc.unifiedQuantities.getItems.key(),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.unifiedQuantities.pricing.getStudyTotals.key(),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.pricing.studies.getById.key(),
				});
				const count = result?.updatedCount ?? 0;
				toast.success(`تم تحديث ${count} بند`);
			},
			onError: (err: Error) =>
				toast.error("فشل تحديث الربح العام: " + err.message),
		}),
	);

	const debouncedApply = useDebouncedCallback((v: number) => {
		mutation.mutate({
			costStudyId,
			organizationId,
			globalMarkupPercent: v,
			applyMode: "non_custom_only",
		} as never);
	}, 600);

	const handleSlider = (next: number) => {
		setLocal(next);
		debouncedApply(next);
	};

	const handleApplyToAll = () => {
		mutation.mutate({
			costStudyId,
			organizationId,
			globalMarkupPercent: local,
			applyMode: "all_items",
		} as never);
		setConfirmOpen(false);
	};

	return (
		<Card className="space-y-3 p-4">
			<div className="flex items-center justify-between">
				<Label className="text-sm font-semibold">نسبة الربح العامة</Label>
				<span className="text-2xl font-bold tabular-nums text-violet-700 dark:text-violet-300">
					{local.toFixed(0)}%
				</span>
			</div>

			<Slider
				value={[local]}
				onValueChange={(v) => handleSlider(v[0] ?? 0)}
				min={0}
				max={100}
				step={1}
			/>

			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span>تُطبَّق تلقائياً على البنود غير المخصصة</span>
				<span className="tabular-nums">
					{local.toFixed(0)}% من 100%
				</span>
			</div>

			{customMarkupCount > 0 && (
				<div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
					<AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
					<div className="flex-1">
						<p className="font-medium">
							{customMarkupCount} بند بهامش خاص
						</p>
						<p className="mt-0.5">
							هذه البنود لن تتأثر بالشريط أعلاه إلا لو ضغطت "طبّق على
							الكل".
						</p>
					</div>
				</div>
			)}

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="w-full"
						disabled={customMarkupCount === 0}
					>
						<Pin className="me-2 h-4 w-4" />
						طبّق على الكل (يمسح التخصيصات)
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>تأكيد التطبيق على الكل</AlertDialogTitle>
						<AlertDialogDescription>
							سيُطبَّق هامش {local.toFixed(0)}% على جميع البنود ويُمسح{" "}
							<strong>{customMarkupCount}</strong> هامش مخصّص. هذا الإجراء
							غير قابل للتراجع.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>إلغاء</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleApplyToAll}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							نعم، طبّق على الكل
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
}
