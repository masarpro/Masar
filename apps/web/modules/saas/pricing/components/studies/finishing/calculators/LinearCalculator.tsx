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

interface LinearCalculatorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onApply: (result: CalculatorResult) => void;
}

export function LinearCalculator({
	open,
	onOpenChange,
	onApply,
}: LinearCalculatorProps) {
	const t = useTranslations("pricing.studies.finishing.calculator");
	const [totalLength, setTotalLength] = useState(0);

	const handleApply = () => {
		onApply({
			length: totalLength,
			calculationData: { method: "LINEAR", totalLength },
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-xs">
				<DialogHeader>
					<DialogTitle>{t("linear")}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-1">
						<Label>إجمالي الطول (م.ط)</Label>
						<Input
							type="number"
							value={totalLength || ""}
							onChange={(e) => setTotalLength(parseFloat(e.target.value) || 0)}
							autoFocus
						/>
					</div>
					<div className="rounded-lg bg-muted p-3 text-center">
						<p className="text-2xl font-bold">{totalLength.toFixed(2)} م.ط</p>
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
