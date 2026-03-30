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
		<div className="overflow-hidden rounded-2xl border border-violet-200/50 bg-violet-50/50 dark:border-violet-800/30 dark:bg-violet-950/20">
			<div className="border-b border-violet-200/50 p-5 dark:border-violet-800/30">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-violet-100 p-2.5 dark:bg-violet-900/50">
							<CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
						</div>
						<h2 className="text-lg font-medium text-violet-900 dark:text-violet-100">
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
						className="rounded-lg border-violet-200 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-900/30"
					>
						<Plus className="ml-1 h-4 w-4" />
						{t("projects.createProject.addPaymentTerm")}
					</Button>
				</div>
			</div>

			<div className="space-y-3 p-5">
				{paymentTerms.length === 0 && (
					<div className="rounded-xl border border-dashed border-violet-200 py-8 text-center text-sm text-slate-400 dark:border-violet-800/40">
						{t("projects.createProject.addPaymentTerm")}
					</div>
				)}

				{paymentTerms.map((term) => (
					<div
						key={term.id}
						className="grid grid-cols-[1fr_1.5fr_0.7fr_1fr_auto] items-end gap-3 rounded-xl border border-violet-100 bg-white p-3 dark:border-violet-800/30 dark:bg-slate-900/40"
					>
						<div className="space-y-1">
							<Label className="text-xs text-slate-500">
								{t("projects.createProject.termType")}
							</Label>
							<Select
								value={term.type}
								onValueChange={(val) =>
									onUpdateTerm(term.id, "type", val)
								}
							>
								<SelectTrigger className="h-9 rounded-lg border-violet-200/60 bg-violet-50/50 text-xs dark:border-violet-800/40 dark:bg-slate-800/50">
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
							<Label className="text-xs text-slate-500">
								{t("projects.createProject.termLabel")}
							</Label>
							<Input
								value={term.label}
								onChange={(e) =>
									onUpdateTerm(
										term.id,
										"label",
										e.target.value,
									)
								}
								className="h-9 rounded-lg border-violet-200/60 bg-violet-50/50 text-xs dark:border-violet-800/40 dark:bg-slate-800/50"
							/>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-slate-500">
								{t("projects.createProject.termPercent")}
							</Label>
							<div className="relative">
								<Input
									type="number"
									step="0.01"
									min="0"
									max="100"
									value={term.percent}
									onChange={(e) =>
										onUpdateTerm(
											term.id,
											"percent",
											e.target.value,
										)
									}
									className="h-9 rounded-lg border-violet-200/60 bg-violet-50/50 pl-6 text-xs dark:border-violet-800/40 dark:bg-slate-800/50"
								/>
								<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
									%
								</span>
							</div>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-slate-500">
								{t("projects.createProject.termAmount")}
							</Label>
							<div className="relative">
								<Input
									type="number"
									step="0.01"
									min="0"
									value={term.amount}
									onChange={(e) =>
										onUpdateTerm(
											term.id,
											"amount",
											e.target.value,
										)
									}
									className="h-9 rounded-lg border-violet-200/60 bg-violet-50/50 pl-12 font-mono text-xs dark:border-violet-800/40 dark:bg-slate-800/50"
								/>
								<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
									{t("common.sar")}
								</span>
							</div>
						</div>

						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => onRemoveTerm(term.id)}
							className="h-9 w-9 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				))}

				{paymentTerms.length > 0 && (
					<div
						className={`flex items-center justify-between rounded-xl px-4 py-3 ${
							Math.abs(termsTotalPercent - 100) < 0.01
								? "bg-green-50 dark:bg-green-950/20"
								: termsTotalPercent > 100
									? "bg-red-50 dark:bg-red-950/20"
									: "bg-violet-50 dark:bg-violet-950/20"
						}`}
					>
						<span className="text-sm font-medium text-slate-600 dark:text-slate-300">
							{t("projects.createProject.totalPercent")}
						</span>
						<div className="flex items-center gap-4">
							<span
								className={`font-mono text-sm font-bold ${
									Math.abs(termsTotalPercent - 100) < 0.01
										? "text-green-700 dark:text-green-400"
										: termsTotalPercent > 100
											? "text-red-700 dark:text-red-400"
											: "text-violet-700 dark:text-violet-400"
								}`}
							>
								{termsTotalPercent.toFixed(1)}%
							</span>
							<span className="font-mono text-sm text-slate-600 dark:text-slate-400">
								{formatNumber(termsTotalAmount)} {t("common.sar")}
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
});
