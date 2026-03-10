"use client";

import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	useProjectBOQUnpriced,
	useBulkUpdatePrices,
} from "@saas/projects/hooks/use-project-boq";

function formatCurrency(value: number): string {
	return value.toLocaleString("ar-SA", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

interface PricingModeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	projectId: string;
}

export function PricingModeDialog({
	open,
	onOpenChange,
	organizationId,
	projectId,
}: PricingModeDialogProps) {
	const t = useTranslations("projectBoq");
	const { data: items, isLoading } = useProjectBOQUnpriced(
		organizationId,
		projectId,
	);
	const updatePricesMutation = useBulkUpdatePrices();

	const [prices, setPrices] = useState<Record<string, string>>({});

	// Reset prices when items change
	useEffect(() => {
		if (items) {
			setPrices({});
		}
	}, [items]);

	const handleSubmit = async () => {
		const priceEntries = Object.entries(prices)
			.filter(([_, val]) => val && Number(val) > 0)
			.map(([itemId, val]) => ({
				itemId,
				unitPrice: Number(val),
			}));

		if (priceEntries.length === 0) return;

		try {
			const result = await updatePricesMutation.mutateAsync({
				organizationId,
				projectId,
				prices: priceEntries,
			});
			toast.success(t("toast.pricesUpdated", { count: result.updatedCount }));
			onOpenChange(false);
		} catch {
			// Error handled by mutation
		}
	};

	// Calculate total after pricing
	const totalAfterPricing = (items ?? []).reduce((sum, item) => {
		const price = prices[item.id] ? Number(prices[item.id]) : 0;
		return sum + item.quantity * price;
	}, 0);

	const pricedCount = Object.values(prices).filter(
		(v) => v && Number(v) > 0,
	).length;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-3xl p-0 gap-0 rounded-2xl overflow-hidden max-h-[90vh]">
				<DialogHeader className="bg-white dark:bg-slate-900 border-b px-5 py-4">
					<DialogTitle>{t("pricing.title")}</DialogTitle>
					{items && (
						<p className="text-sm text-slate-500">
							{t("pricing.unpricedCount", { count: items.length })}
						</p>
					)}
				</DialogHeader>

				<div className="overflow-y-auto max-h-[60vh]">
					{isLoading ? (
						<div className="flex items-center justify-center py-10">
							<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
						</div>
					) : items && items.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow className="bg-slate-50 dark:bg-slate-800/50">
									<TableHead className="min-w-[200px]">{t("table.description")}</TableHead>
									<TableHead className="w-20">{t("table.unit")}</TableHead>
									<TableHead className="w-24 text-end">{t("table.quantity")}</TableHead>
									<TableHead className="w-32 text-end">{t("table.unitPrice")}</TableHead>
									<TableHead className="w-32 text-end">{t("table.totalPrice")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((item) => {
									const priceVal = prices[item.id] ? Number(prices[item.id]) : 0;
									const lineTotal = item.quantity * priceVal;
									return (
										<TableRow key={item.id}>
											<TableCell className="text-sm">
												<div>{item.description}</div>
												{item.specifications && (
													<div className="text-xs text-slate-400 mt-0.5 truncate max-w-[250px]">
														{item.specifications}
													</div>
												)}
											</TableCell>
											<TableCell className="text-sm text-slate-500">{item.unit}</TableCell>
											<TableCell className="text-end text-sm">
												{item.quantity.toLocaleString("ar-SA")}
											</TableCell>
											<TableCell>
												<Input
													type="number"
													min="0"
													step="any"
													value={prices[item.id] ?? ""}
													onChange={(e) =>
														setPrices((prev) => ({
															...prev,
															[item.id]: e.target.value,
														}))
													}
													className="rounded-lg h-8 text-sm text-end w-28 ms-auto"
												/>
											</TableCell>
											<TableCell className="text-end text-sm font-medium">
												{priceVal > 0 ? formatCurrency(lineTotal) : "—"}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					) : (
						<div className="py-10 text-center text-slate-400">
							{t("emptyState.title")}
						</div>
					)}
				</div>

				<div className="bg-slate-50 dark:bg-slate-800/50 border-t px-5 py-3 flex items-center justify-between">
					<div className="text-sm">
						<span className="text-slate-500">{t("pricing.totalAfterPricing")}:</span>{" "}
						<span className="font-semibold text-slate-900 dark:text-slate-100">
							{formatCurrency(totalAfterPricing)} ر.س
						</span>
					</div>
					<div className="flex gap-3">
						<Button
							variant="outline"
							className="rounded-xl"
							onClick={() => onOpenChange(false)}
						>
							{t("actions.cancel")}
						</Button>
						<Button
							className="rounded-xl"
							disabled={updatePricesMutation.isPending || pricedCount === 0}
							onClick={handleSubmit}
						>
							{updatePricesMutation.isPending && (
								<Loader2 className="h-4 w-4 me-2 animate-spin" />
							)}
							{t("pricing.savePrices")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
