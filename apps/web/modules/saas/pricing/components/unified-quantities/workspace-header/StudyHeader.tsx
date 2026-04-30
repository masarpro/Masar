"use client";

import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { FileText, Settings2 } from "lucide-react";
import { useStudyTotals } from "../hooks/useStudyTotals";
import type { QuantityItem } from "../types";
import { GlobalMarkupControl } from "./GlobalMarkupControl";
import { MiniPnLCard } from "./MiniPnLCard";

interface Props {
	costStudyId: string;
	organizationId: string;
	items: QuantityItem[];
	globalMarkupPercent: number;
	onGenerateQuote: () => void;
	onOpenContext: () => void;
}

export function StudyHeader({
	costStudyId,
	organizationId,
	items,
	globalMarkupPercent,
	onGenerateQuote,
	onOpenContext,
}: Props) {
	const { totals } = useStudyTotals({ costStudyId, organizationId });

	const totalMaterialCost = Number(totals?.totalMaterialCost ?? 0);
	const totalLaborCost = Number(totals?.totalLaborCost ?? 0);
	const totalGrossCost = Number(totals?.totalGrossCost ?? 0);
	const totalSellAmount = Number(totals?.totalSellAmount ?? 0);
	const totalProfitAmount = Number(totals?.totalProfitAmount ?? 0);
	const totalProfitPercent = Number(totals?.totalProfitPercent ?? 0);

	const customMarkupCount = items.filter((i) => i.hasCustomMarkup).length;

	return (
		<div className="space-y-3">
			<MiniPnLCard
				totalMaterialCost={totalMaterialCost}
				totalLaborCost={totalLaborCost}
				totalGrossCost={totalGrossCost}
				totalSellAmount={totalSellAmount}
				totalProfitAmount={totalProfitAmount}
				totalProfitPercent={totalProfitPercent}
			/>

			<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
				<div className="md:col-span-2">
					<GlobalMarkupControl
						costStudyId={costStudyId}
						organizationId={organizationId}
						currentValue={globalMarkupPercent}
						customMarkupCount={customMarkupCount}
					/>
				</div>

				<Card className="flex flex-col gap-2 p-4">
					<Button
						onClick={onGenerateQuote}
						size="lg"
						className="bg-emerald-600 hover:bg-emerald-700"
						disabled={items.length === 0}
					>
						<FileText className="me-2 h-5 w-5" />
						إنشاء عرض سعر
					</Button>
					<Button
						onClick={onOpenContext}
						variant="outline"
						size="sm"
					>
						<Settings2 className="me-2 h-4 w-4" />
						السياق المشترك
					</Button>
				</Card>
			</div>
		</div>
	);
}
