"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { Textarea } from "@ui/components/textarea";
import { Shield } from "lucide-react";
import { formatNumber } from "./ContractFormSections";

// ─── Types ──────────────────────────────────────────────────
export interface ContractNotesSectionProps {
	retentionPercent: string;
	retentionCap: string;
	retentionReleaseDays: string;
	performanceBondPercent: string;
	insuranceRequired: boolean;
	insuranceDetails: string;
	penaltyPercent: string;
	penaltyCapPercent: string;
	/** Computed retention amount */
	retentionAmount: number;
	/** Computed performance bond amount */
	performanceBondAmount: number;
	onFieldChange: (field: string, value: string | boolean) => void;
}

// ─── Component ──────────────────────────────────────────────
export const ContractNotesSection = React.memo(function ContractNotesSection({
	retentionPercent,
	retentionCap,
	retentionReleaseDays,
	performanceBondPercent,
	insuranceRequired,
	insuranceDetails,
	penaltyPercent,
	penaltyCapPercent,
	retentionAmount,
	performanceBondAmount,
	onFieldChange,
}: ContractNotesSectionProps) {
	const t = useTranslations();

	return (
		<div className="overflow-hidden rounded-2xl border border-amber-200/50 bg-amber-50/50 dark:border-amber-800/30 dark:bg-amber-950/20">
			<div className="border-b border-amber-200/50 p-5 dark:border-amber-800/30">
				<div className="flex items-center gap-3">
					<div className="rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/50">
						<Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
					</div>
					<h2 className="text-lg font-medium text-amber-900 dark:text-amber-100">
						{t("projects.createProject.guaranteesSection")}
					</h2>
				</div>
			</div>

			<div className="space-y-5 p-5">
				{/* Retention */}
				<div className="rounded-xl border border-amber-200/40 bg-white/60 p-4 dark:border-amber-800/30 dark:bg-slate-900/30">
					<Label className="mb-3 block text-sm font-medium text-amber-800 dark:text-amber-200">
						{t("projects.createProject.retentionInfo")}
					</Label>
					<div className="grid gap-4 sm:grid-cols-4">
						<div className="space-y-1">
							<Label className="text-xs text-slate-500">
								{t(
									"projects.createProject.retentionPercent",
								)}
							</Label>
							<div className="relative">
								<Input
									type="number"
									step="0.01"
									min="0"
									max="100"
									value={retentionPercent}
									onChange={(e) =>
										onFieldChange(
											"retentionPercent",
											e.target.value,
										)
									}
									placeholder="10"
									className="h-9 rounded-lg border-amber-200/60 bg-amber-50/30 pl-6 text-sm dark:border-amber-800/40 dark:bg-slate-800/50"
								/>
								<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
									%
								</span>
							</div>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-slate-500">
								{t(
									"projects.createProject.retentionAmount",
								)}
							</Label>
							<div className="flex h-9 items-center rounded-lg bg-amber-50 px-3 font-mono text-sm font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
								{retentionAmount > 0
									? formatNumber(retentionAmount)
									: "\u2014"}
							</div>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-slate-500">
								{t(
									"projects.createProject.retentionCap",
								)}
							</Label>
							<div className="relative">
								<Input
									type="number"
									step="0.01"
									min="0"
									value={retentionCap}
									onChange={(e) =>
										onFieldChange(
											"retentionCap",
											e.target.value,
										)
									}
									placeholder="0.00"
									className="h-9 rounded-lg border-amber-200/60 bg-amber-50/30 pl-12 text-sm dark:border-amber-800/40 dark:bg-slate-800/50"
								/>
								<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
									ر.س
								</span>
							</div>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-slate-500">
								{t(
									"projects.createProject.retentionReleaseDays",
								)}
							</Label>
							<Input
								type="number"
								min="0"
								value={retentionReleaseDays}
								onChange={(e) =>
									onFieldChange(
										"retentionReleaseDays",
										e.target.value,
									)
								}
								placeholder="365"
								className="h-9 rounded-lg border-amber-200/60 bg-amber-50/30 text-sm dark:border-amber-800/40 dark:bg-slate-800/50"
							/>
						</div>
					</div>
				</div>

				{/* Performance Bond */}
				<div className="rounded-xl border border-amber-200/40 bg-white/60 p-4 dark:border-amber-800/30 dark:bg-slate-900/30">
					<Label className="mb-3 block text-sm font-medium text-amber-800 dark:text-amber-200">
						{t("projects.createProject.performanceBond")}
					</Label>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1">
							<Label className="text-xs text-slate-500">
								{t(
									"projects.createProject.performanceBondPercent",
								)}
							</Label>
							<div className="relative">
								<Input
									type="number"
									step="0.01"
									min="0"
									max="100"
									value={performanceBondPercent}
									onChange={(e) =>
										onFieldChange(
											"performanceBondPercent",
											e.target.value,
										)
									}
									placeholder="5"
									className="h-9 rounded-lg border-amber-200/60 bg-amber-50/30 pl-6 text-sm dark:border-amber-800/40 dark:bg-slate-800/50"
								/>
								<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
									%
								</span>
							</div>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-slate-500">
								{t(
									"projects.createProject.performanceBondAmount",
								)}
							</Label>
							<div className="flex h-9 items-center rounded-lg bg-amber-50 px-3 font-mono text-sm font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
								{performanceBondAmount > 0
									? formatNumber(performanceBondAmount)
									: "\u2014"}
							</div>
						</div>
					</div>
				</div>

				{/* Insurance */}
				<div className="rounded-xl border border-amber-200/40 bg-white/60 p-4 dark:border-amber-800/30 dark:bg-slate-900/30">
					<div className="flex items-center justify-between">
						<Label className="text-sm font-medium text-amber-800 dark:text-amber-200">
							{t(
								"projects.createProject.insuranceRequired",
							)}
						</Label>
						<Switch
							checked={insuranceRequired}
							onCheckedChange={(checked) =>
								onFieldChange("insuranceRequired", checked)
							}
						/>
					</div>
					{insuranceRequired && (
						<div className="mt-3">
							<Textarea
								value={insuranceDetails}
								onChange={(e) =>
									onFieldChange(
										"insuranceDetails",
										e.target.value,
									)
								}
								placeholder={t(
									"projects.createProject.insuranceDetailsPlaceholder",
								)}
								rows={2}
								className="rounded-lg border-amber-200/60 bg-amber-50/30 text-sm dark:border-amber-800/40 dark:bg-slate-800/50"
							/>
						</div>
					)}
				</div>

				{/* Penalties */}
				<div className="rounded-xl border border-amber-200/40 bg-white/60 p-4 dark:border-amber-800/30 dark:bg-slate-900/30">
					<Label className="mb-3 block text-sm font-medium text-amber-800 dark:text-amber-200">
						{t("projects.createProject.penalties")}
					</Label>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1">
							<Label className="text-xs text-slate-500">
								{t(
									"projects.createProject.penaltyPercent",
								)}
							</Label>
							<div className="relative">
								<Input
									type="number"
									step="0.01"
									min="0"
									max="100"
									value={penaltyPercent}
									onChange={(e) =>
										onFieldChange(
											"penaltyPercent",
											e.target.value,
										)
									}
									placeholder="0.5"
									className="h-9 rounded-lg border-amber-200/60 bg-amber-50/30 pl-6 text-sm dark:border-amber-800/40 dark:bg-slate-800/50"
								/>
								<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
									%
								</span>
							</div>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-slate-500">
								{t(
									"projects.createProject.penaltyCapPercent",
								)}
							</Label>
							<div className="relative">
								<Input
									type="number"
									step="0.01"
									min="0"
									max="100"
									value={penaltyCapPercent}
									onChange={(e) =>
										onFieldChange(
											"penaltyCapPercent",
											e.target.value,
										)
									}
									placeholder="10"
									className="h-9 rounded-lg border-amber-200/60 bg-amber-50/30 pl-6 text-sm dark:border-amber-800/40 dark:bg-slate-800/50"
								/>
								<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
									%
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
});
