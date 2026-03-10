"use client";

import { Checkbox } from "@ui/components/checkbox";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@ui/components/tooltip";
import { Bot, Pencil, Info } from "lucide-react";
import { formatNumber } from "../../lib/utils";
import type { MEPMergedItem } from "../../types/mep";
import { useTranslations } from "next-intl";

interface MEPItemRowProps {
	item: MEPMergedItem;
	onToggleEnabled: (item: MEPMergedItem, enabled: boolean) => void;
	onEdit: (item: MEPMergedItem) => void;
}

export function MEPItemRow({
	item,
	onToggleEnabled,
	onEdit,
}: MEPItemRowProps) {
	const isDisabled = !item.isEnabled;
	const t = useTranslations("pricing.studies.mep");

	return (
		<div
			className={`grid grid-cols-[32px_1fr_80px_60px_80px_32px] sm:grid-cols-[32px_1fr_80px_60px_80px_32px] items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
				isDisabled
					? "bg-muted/40 opacity-60"
					: "bg-card hover:bg-accent/50"
			}`}
		>
			{/* Checkbox */}
			<Checkbox
				checked={item.isEnabled}
				onCheckedChange={(checked) =>
					onToggleEnabled(item, checked === true)
				}
				className="h-4 w-4"
			/>

			{/* Name + source indicator */}
			<div className="flex items-center gap-1.5 min-w-0">
				<span className="truncate">{item.name}</span>
				{item.dataSource === "auto" && (
					<TooltipProvider delayDuration={200}>
						<Tooltip>
							<TooltipTrigger asChild>
								<Bot className="h-3.5 w-3.5 shrink-0 text-blue-500" />
							</TooltipTrigger>
							<TooltipContent side="top" className="max-w-xs text-xs">
								<p className="font-medium mb-1">{t("item.autoDerived")}</p>
								{item.sourceFormula && (
									<p className="text-muted-foreground">
										{item.sourceFormula}
									</p>
								)}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
				{item.isManualOverride && (
					<TooltipProvider delayDuration={200}>
						<Tooltip>
							<TooltipTrigger asChild>
								<Pencil className="h-3 w-3 shrink-0 text-amber-500" />
							</TooltipTrigger>
							<TooltipContent side="top" className="text-xs">
								{t("itemRow.manualOverride", { qty: formatNumber(item.derivedQuantity ?? 0, 1) })}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</div>

			{/* Quantity */}
			<span className="text-left tabular-nums" dir="ltr">
				{formatNumber(item.quantity, 1)}
			</span>

			{/* Unit */}
			<span className="text-muted-foreground">{item.unit}</span>

			{/* Source formula tooltip */}
			<div className="flex items-center justify-center">
				{item.sourceFormula && (
					<TooltipProvider delayDuration={200}>
						<Tooltip>
							<TooltipTrigger asChild>
								<Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
							</TooltipTrigger>
							<TooltipContent
								side="top"
								className="max-w-sm text-xs"
							>
								{item.sourceFormula}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</div>

			{/* Edit button */}
			<button
				type="button"
				onClick={() => onEdit(item)}
				className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
			>
				<Pencil className="h-3.5 w-3.5 text-muted-foreground" />
			</button>
		</div>
	);
}
