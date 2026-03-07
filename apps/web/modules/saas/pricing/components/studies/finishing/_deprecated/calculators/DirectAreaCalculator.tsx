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

interface DirectAreaCalculatorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onApply: (result: CalculatorResult) => void;
}

export function DirectAreaCalculator({
	open,
	onOpenChange,
	onApply,
}: DirectAreaCalculatorProps) {
	const t = useTranslations("pricing.studies.finishing.calculator");
	const [useDirectArea, setUseDirectArea] = useState(true);
	const [directArea, setDirectArea] = useState(0);
	const [length, setLength] = useState(0);
	const [width, setWidth] = useState(0);

	const calculatedArea = useDirectArea ? directArea : length * width;

	const handleApply = () => {
		onApply({
			area: Math.round(calculatedArea * 100) / 100,
			calculationData: {
				method: "DIRECT_AREA",
				...(useDirectArea
					? { directArea }
					: { length, width }),
			},
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>{t("directArea")}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="flex gap-2">
						<Button
							variant={useDirectArea ? "primary" : "outline"}
							size="sm"
							onClick={() => setUseDirectArea(true)}
						>
							مساحة مباشرة
						</Button>
						<Button
							variant={!useDirectArea ? "primary" : "outline"}
							size="sm"
							onClick={() => setUseDirectArea(false)}
						>
							طول × عرض
						</Button>
					</div>

					{useDirectArea ? (
						<div className="space-y-1">
							<Label>{t("totalArea")} (م²)</Label>
							<Input
								type="number"
								value={directArea || ""}
								onChange={(e) => setDirectArea(parseFloat(e.target.value) || 0)}
								autoFocus
							/>
						</div>
					) : (
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<Label>الطول (م)</Label>
								<Input
									type="number"
									value={length || ""}
									onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
									autoFocus
								/>
							</div>
							<div className="space-y-1">
								<Label>العرض (م)</Label>
								<Input
									type="number"
									value={width || ""}
									onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
								/>
							</div>
						</div>
					)}

					<div className="rounded-lg bg-muted p-3 text-center">
						<p className="text-sm text-muted-foreground">{t("totalArea")}</p>
						<p className="text-2xl font-bold">{calculatedArea.toFixed(2)} م²</p>
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
