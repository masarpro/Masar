"use client";
// TODO(i18n): Extract hardcoded Arabic strings to translation keys

import React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@ui/components/badge";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Switch } from "@ui/components/switch";
import { Textarea } from "@ui/components/textarea";
import { FileSignature } from "lucide-react";
import {
	PAYMENT_METHODS,
	CONTRACT_STATUSES,
	formatNumber,
} from "./ContractFormSections";

// ─── Types ──────────────────────────────────────────────────
export interface ContractDetailsSectionProps {
	contractNo?: string;
	contractValue: string;
	contractStatus: string;
	includesVat: boolean;
	signedDate: string;
	startDate: string;
	endDate: string;
	paymentMethod: string;
	scopeOfWork: string;
	contractNotes: string;
	/** Parsed numeric contract value */
	numericContractValue: number;
	vatAmount: number;
	totalWithVat: number;
	onFieldChange: (field: string, value: string | boolean) => void;
}

// ─── Component ──────────────────────────────────────────────
export const ContractDetailsSection = React.memo(
	function ContractDetailsSection({
		contractNo,
		contractValue,
		contractStatus,
		includesVat,
		signedDate,
		startDate,
		endDate,
		paymentMethod,
		scopeOfWork,
		contractNotes,
		numericContractValue,
		vatAmount,
		totalWithVat,
		onFieldChange,
	}: ContractDetailsSectionProps) {
		const t = useTranslations();

		return (
			<div className="overflow-hidden rounded-2xl border border-sky-200/50 bg-sky-50/50 dark:border-sky-800/30 dark:bg-sky-950/20">
				<div className="border-b border-sky-200/50 p-5 dark:border-sky-800/30">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-sky-100 p-2.5 dark:bg-sky-900/50">
								<FileSignature className="h-5 w-5 text-sky-600 dark:text-sky-400" />
							</div>
							<h2 className="text-lg font-medium text-sky-900 dark:text-sky-100">
								{t("projects.createProject.contractInfo")}
							</h2>
						</div>
						{contractNo && (
							<Badge
								variant="outline"
								className="rounded-lg border-sky-200 bg-sky-50 px-3 py-1 font-mono text-sm text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
							>
								{contractNo}
							</Badge>
						)}
					</div>
				</div>

				<div className="space-y-5 p-5">
					{/* Contract value + Status */}
					<div className="grid gap-5 sm:grid-cols-2">
						<div className="space-y-2">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("projects.createProject.contractValue")} *
							</Label>
							<div className="relative">
								<Input
									type="number"
									step="0.01"
									min="0"
									value={contractValue}
									onChange={(e) =>
										onFieldChange(
											"contractValue",
											e.target.value,
										)
									}
									placeholder="0.00"
									className="rounded-xl border-sky-200/60 bg-white pl-12 dark:border-sky-800/40 dark:bg-slate-900/50"
								/>
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
									ر.س
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("projects.createProject.contractStatus")}
							</Label>
							<Select
								value={contractStatus}
								onValueChange={(value) =>
									onFieldChange("contractStatus", value)
								}
							>
								<SelectTrigger className="rounded-xl border-sky-200/60 bg-white dark:border-sky-800/40 dark:bg-slate-900/50">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{CONTRACT_STATUSES.map((status) => (
										<SelectItem
											key={status}
											value={status}
											className="rounded-lg"
										>
											{t(
												`projects.createProject.contractStatuses.${status}`,
											)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* VAT toggle */}
					<div className="rounded-xl border border-sky-200/40 bg-white/60 p-4 dark:border-sky-800/30 dark:bg-slate-900/30">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("projects.createProject.vatToggle")}
							</Label>
							<Switch
								checked={includesVat}
								onCheckedChange={(checked) =>
									onFieldChange("includesVat", checked)
								}
							/>
						</div>
						{includesVat && numericContractValue > 0 && (
							<div className="mt-3 grid grid-cols-3 gap-3">
								<div className="rounded-lg bg-sky-50 p-3 dark:bg-sky-950/30">
									<p className="text-xs text-slate-500">
										{t(
											"projects.createProject.valueBeforeVat",
										)}
									</p>
									<p className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
										{formatNumber(numericContractValue)}
									</p>
								</div>
								<div className="rounded-lg bg-sky-50 p-3 dark:bg-sky-950/30">
									<p className="text-xs text-slate-500">
										{t("projects.createProject.vatAmount")}{" "}
										(15%)
									</p>
									<p className="font-mono text-sm font-semibold text-sky-700 dark:text-sky-300">
										+{formatNumber(vatAmount)}
									</p>
								</div>
								<div className="rounded-lg bg-sky-100 p-3 dark:bg-sky-900/40">
									<p className="text-xs text-slate-500">
										{t(
											"projects.createProject.valueWithVat",
										)}
									</p>
									<p className="font-mono text-sm font-bold text-sky-800 dark:text-sky-200">
										{formatNumber(totalWithVat)}
									</p>
								</div>
							</div>
						)}
					</div>

					{/* Dates */}
					<div className="grid gap-5 sm:grid-cols-3">
						<div className="space-y-2">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("projects.createProject.signedDate")}
							</Label>
							<Input
								type="date"
								value={signedDate}
								onChange={(e) =>
									onFieldChange("signedDate", e.target.value)
								}
								className="rounded-xl border-sky-200/60 bg-white dark:border-sky-800/40 dark:bg-slate-900/50"
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("projects.createProject.startDate")}
							</Label>
							<Input
								type="date"
								value={startDate}
								onChange={(e) =>
									onFieldChange("startDate", e.target.value)
								}
								className="rounded-xl border-sky-200/60 bg-white dark:border-sky-800/40 dark:bg-slate-900/50"
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("projects.createProject.endDate")}
							</Label>
							<Input
								type="date"
								value={endDate}
								onChange={(e) =>
									onFieldChange("endDate", e.target.value)
								}
								className="rounded-xl border-sky-200/60 bg-white dark:border-sky-800/40 dark:bg-slate-900/50"
							/>
						</div>
					</div>

					{/* Payment method */}
					<div className="grid gap-5 sm:grid-cols-2">
						<div className="space-y-2">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("projects.createProject.paymentMethod")}
							</Label>
							<Select
								value={paymentMethod}
								onValueChange={(value) =>
									onFieldChange("paymentMethod", value)
								}
							>
								<SelectTrigger className="rounded-xl border-sky-200/60 bg-white dark:border-sky-800/40 dark:bg-slate-900/50">
									<SelectValue
										placeholder={t(
											"projects.createProject.paymentMethod",
										)}
									/>
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{PAYMENT_METHODS.map((method) => (
										<SelectItem
											key={method}
											value={method}
											className="rounded-lg"
										>
											{t(
												`projects.createProject.paymentMethods.${method}`,
											)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Scope of work */}
					<div className="space-y-2">
						<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
							{t("projects.createProject.scopeOfWork")}
						</Label>
						<Textarea
							value={scopeOfWork}
							onChange={(e) =>
								onFieldChange("scopeOfWork", e.target.value)
							}
							placeholder={t(
								"projects.createProject.scopeOfWorkPlaceholder",
							)}
							rows={3}
							className="rounded-xl border-sky-200/60 bg-white dark:border-sky-800/40 dark:bg-slate-900/50"
						/>
					</div>

					{/* Contract Notes */}
					<div className="space-y-2">
						<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
							{t("projects.createProject.contractNotes")}
						</Label>
						<Textarea
							value={contractNotes}
							onChange={(e) =>
								onFieldChange("contractNotes", e.target.value)
							}
							rows={2}
							className="rounded-xl border-sky-200/60 bg-white dark:border-sky-800/40 dark:bg-slate-900/50"
						/>
					</div>
				</div>
			</div>
		);
	},
);
