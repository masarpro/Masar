"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { TERM_TYPES, formatNumber } from "./ContractFormSections";

// ─── Types ──────────────────────────────────────────────────
export type PaymentTermRow = {
	id: string;
	dbId?: string;
	type: (typeof TERM_TYPES)[number];
	label: string;
	percent: string;
	amount: string;
};

export interface PaymentTermsEditorProps {
	paymentTerms: PaymentTermRow[];
	termsTotalPercent: number;
	termsTotalAmount: number;
	onAddTerm: () => void;
	onRemoveTerm: (id: string) => void;
	onUpdateTerm: (
		id: string,
		field: keyof PaymentTermRow,
		value: string,
	) => void;
}

// ─── Component ──────────────────────────────────────────────
export const PaymentTermsEditor = React.memo(function PaymentTermsEditor({
	paymentTerms,
	termsTotalPercent,
	termsTotalAmount,
	onAddTerm,
	onRemoveTerm,
	onUpdateTerm,
}: PaymentTermsEditorProps) {
	const t = useTranslations();

	return (
		<div className="overflow-hidden rounded-2xl border-2 bg-card">
			<div className="border-b-2 p-5">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-chart-4/15 p-2.5">
							<CreditCard className="h-5 w-5 text-chart-4" />
						</div>
						<h2 className="text-lg font-medium text-card-foreground">
							{t(
								"projects.createProject.paymentTermsSection",
							)}
						</h2>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onAddTerm}
						className="rounded-lg border-chart-4/30 text-chart-4 hover:bg-chart-4/10"
					>
						<Plus className="me-1 h-4 w-4" />
						{t("projects.createProject.addPaymentTerm")}
					</Button>
				</div>
			</div>

			<div className="space-y-3 p-5">
				{paymentTerms.length === 0 && (
					<div className="rounded-xl border-2 border-dashed py-8 text-center text-sm text-muted-foreground">
						{t("projects.createProject.addPaymentTerm")}
					</div>
				)}

				{paymentTerms.map((term) => (
					<div
						key={term.id}
						className="grid grid-cols-[1fr_1.5fr_0.7fr_1fr_auto] items-end gap-3 rounded-xl border-2 bg-card p-3"
					>
						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">
								{t("projects.createProject.termType")}
							</Label>
							<Select
								value={term.type}
								onValueChange={(val: any) =>
									onUpdateTerm(term.id, "type", val)
								}
							>
								<SelectTrigger className="h-9 rounded-lg text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{TERM_TYPES.map((tt) => (
										<SelectItem
											key={tt}
											value={tt}
											className="rounded-lg text-xs"
										>
											{t(
												`projects.createProject.termTypes.${tt}`,
											)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">
								{t("projects.createProject.termLabel")}
							</Label>
							<Input
								value={term.label}
								onChange={(e: any) =>
									onUpdateTerm(
										term.id,
										"label",
										e.target.value,
									)
								}
								className="h-9 rounded-lg text-xs"
							/>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">
								{t("projects.createProject.termPercent")}
							</Label>
							<div className="relative">
								<Input
									type="number"
									step="0.01"
									min="0"
									max="100"
									value={term.percent}
									onChange={(e: any) =>
										onUpdateTerm(
											term.id,
											"percent",
											e.target.value,
										)
									}
									className="h-9 rounded-lg pe-6 text-xs"
								/>
								<span className="absolute end-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
									%
								</span>
							</div>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">
								{t("projects.createProject.termAmount")}
							</Label>
							<div className="relative">
								<Input
									type="number"
									step="0.01"
									min="0"
									value={term.amount}
									onChange={(e: any) =>
										onUpdateTerm(
											term.id,
											"amount",
											e.target.value,
										)
									}
									className="h-9 rounded-lg pe-12 font-mono text-xs"
								/>
								<span className="absolute end-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
									{t("common.sar")}
								</span>
							</div>
						</div>

						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => onRemoveTerm(term.id)}
							className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				))}

				{paymentTerms.length > 0 && (
					<div
						className={`flex items-center justify-between rounded-xl px-4 py-3 ${
							Math.abs(termsTotalPercent - 100) < 0.01
								? "bg-success/10"
								: termsTotalPercent > 100
									? "bg-destructive/10"
									: "bg-muted"
						}`}
					>
						<span className="text-sm font-medium text-foreground">
							{t("projects.createProject.totalPercent")}
						</span>
						<div className="flex items-center gap-4">
							<span
								className={`font-mono text-sm font-bold ${
									Math.abs(termsTotalPercent - 100) < 0.01
										? "text-success"
										: termsTotalPercent > 100
											? "text-destructive"
											: "text-chart-4"
								}`}
							>
								{termsTotalPercent.toFixed(1)}%
							</span>
							<span className="font-mono text-sm text-muted-foreground">
								{formatNumber(termsTotalAmount)} {t("common.sar")}
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
});
