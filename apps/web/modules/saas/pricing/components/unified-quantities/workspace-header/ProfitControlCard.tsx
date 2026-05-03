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
import { Slider } from "@ui/components/slider";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Pin, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";

interface Props {
	costStudyId: string;
	organizationId: string;
	currentValue: number;
	customMarkupCount: number;
}

const QUICK_CHIPS = [15, 25, 30, 40, 50];

const fmt = (n: number) => n.toFixed(0);

export function ProfitControlCard({
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
	}, 500);

	const setValue = (next: number) => {
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

	const isQuickActive = useMemo(
		() => QUICK_CHIPS.find((c) => Math.abs(c - local) < 0.5) ?? null,
		[local],
	);

	return (
		<Card className="space-y-4 p-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
						<Sparkles className="h-5 w-5" />
					</div>
					<div>
						<p className="text-xs text-muted-foreground">هامش الربح العام</p>
						<p className="text-2xl font-bold tabular-nums leading-none text-violet-700 dark:text-violet-300">
							{fmt(local)}
							<span className="ms-0.5 text-base font-medium">%</span>
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-1.5">
					{QUICK_CHIPS.map((c) => {
						const active = isQuickActive === c;
						return (
							<button
								key={c}
								type="button"
								onClick={() => setValue(c)}
								className={`rounded-full border px-3 py-1 text-xs tabular-nums transition ${
									active
										? "border-violet-600 bg-violet-600 text-white"
										: "border-border bg-background hover:bg-muted"
								}`}
							>
								{c}%
							</button>
						);
					})}
				</div>
			</div>

			<div>
				<Slider
					value={[local]}
					onValueChange={(v) => setValue(v[0] ?? 0)}
					min={0}
					max={100}
					step={1}
				/>
				<div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground">
					<span>0%</span>
					<span>25%</span>
					<span>50%</span>
					<span>75%</span>
					<span>100%</span>
				</div>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-2 text-xs">
				<p className="text-muted-foreground">
					يُطبَّق تلقائياً على البنود التي تتبع الهامش العام.
				</p>

				{customMarkupCount > 0 && (
					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
							<AlertTriangle className="h-3.5 w-3.5" />
							<span className="tabular-nums">
								{customMarkupCount} بهامش خاص
							</span>
						</span>
						<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
							<AlertDialogTrigger asChild>
								<Button size="sm" variant="ghost">
									<Pin className="me-1 h-3.5 w-3.5" />
									طبّق على الكل
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										تأكيد التطبيق على الكل
									</AlertDialogTitle>
									<AlertDialogDescription>
										سيُطبَّق هامش {fmt(local)}% على جميع البنود
										ويُمسح <strong>{customMarkupCount}</strong> هامش
										مخصّص. هذا الإجراء غير قابل للتراجع.
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
					</div>
				)}
			</div>
		</Card>
	);
}
