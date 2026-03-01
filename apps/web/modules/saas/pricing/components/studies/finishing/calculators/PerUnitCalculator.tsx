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

interface PerUnitCalculatorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onApply: (result: CalculatorResult) => void;
	unitLabel?: string;
}

export function PerUnitCalculator({
	open,
	onOpenChange,
	onApply,
	unitLabel = "عدد",
}: PerUnitCalculatorProps) {
	const t = useTranslations("pricing.studies.finishing.calculator");
	const [qty, setQty] = useState(0);

	const handleApply = () => {
		onApply({
			quantity: qty,
			calculationData: { method: "PER_UNIT", quantity: qty },
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-xs">
				<DialogHeader>
					<DialogTitle>{t("perUnit")}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-1">
						<Label>الكمية ({unitLabel})</Label>
						<Input
							type="number"
							value={qty || ""}
							onChange={(e) => setQty(parseInt(e.target.value) || 0)}
							autoFocus
						/>
					</div>
					<div className="rounded-lg bg-muted p-3 text-center">
						<p className="text-2xl font-bold">
							{qty} {unitLabel}
						</p>
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
