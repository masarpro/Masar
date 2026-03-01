"use client";

import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CalculatorResult } from "../../../../lib/finishing-types";

interface LumpSumCalculatorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onApply: (result: CalculatorResult) => void;
}

export function LumpSumCalculator({
	open,
	onOpenChange,
	onApply,
}: LumpSumCalculatorProps) {
	const t = useTranslations("pricing.studies.finishing.calculator");
	const [materialPrice, setMaterialPrice] = useState(0);
	const [laborPrice, setLaborPrice] = useState(0);

	const total = materialPrice + laborPrice;

	const handleApply = () => {
		onApply({
			quantity: 1,
			calculationData: {
				method: "LUMP_SUM",
				materialPrice,
				laborPrice,
				total,
			},
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-xs">
				<DialogHeader>
					<DialogTitle>{t("lumpSum")}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-1">
						<Label>تكلفة المواد (ر.س)</Label>
						<Input
							type="number"
							value={materialPrice || ""}
							onChange={(e) => setMaterialPrice(parseFloat(e.target.value) || 0)}
							autoFocus
						/>
					</div>
					<div className="space-y-1">
						<Label>تكلفة التركيب (ر.س)</Label>
						<Input
							type="number"
							value={laborPrice || ""}
							onChange={(e) => setLaborPrice(parseFloat(e.target.value) || 0)}
						/>
					</div>
					<div className="rounded-lg bg-muted p-3 text-center">
						<p className="text-sm text-muted-foreground">الإجمالي</p>
						<p className="text-2xl font-bold">{total.toLocaleString("ar-SA")} ر.س</p>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						إلغاء
					</Button>
					<Button onClick={handleApply}>{t("apply")}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
