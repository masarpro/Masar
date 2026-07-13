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
		<div className="overflow-hidden rounded-2xl border-2 bg-card">
			<div className="border-b-2 p-5">
				<div className="flex items-center gap-3">
					<div className="rounded-xl bg-chart-1/15 p-2.5">
						<Shield className="h-5 w-5 text-chart-1" />
					</div>
					<h2 className="text-lg font-medium text-card-foreground">
						{t("projects.createProject.guaranteesSection")}
					</h2>
				</div>
			</div>

			<div className="space-y-5 p-5">
				{/* Retention */}
				<div className="rounded-xl border-2 bg-card p-4">
					<Label className="mb-3 block text-sm font-medium text-card-foreground">
						{t("projects.createProject.retentionInfo")}
					</Label>
					<div className="grid gap-4 sm:grid-cols-4">
						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">
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
									onChange={(e: any) =>
										onFieldChange(
											"retentionPercent",
											e.target.value,
										)
									}
									placeholder="10"
									className="h-9 rounded-lg pe-6 text-sm"
								/>
								<span className="absolute end-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
									%
								</span>
							</div>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">
								{t(
									"projects.createProject.retentionAmount",
								)}
							</Label>
							<div className="flex h-9 items-center rounded-lg bg-chart-1/15 px-3 font-mono text-sm font-medium text-chart-1">
								{retentionAmount > 0
									? formatNumber(retentionAmount)
									: "\u2014"}
							</div>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">
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
									onChange={(e: any) =>
										onFieldChange(
											"retentionCap",
											e.target.value,
										)
									}
									placeholder="0.00"
									className="h-9 rounded-lg pe-12 text-sm"
								/>
								<span className="absolute end-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
									{t("common.sar")}
								</span>
							</div>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">
								{t(
									"projects.createProject.retentionReleaseDays",
								)}
							</Label>
							<Input
								type="number"
								min="0"
								value={retentionReleaseDays}
								onChange={(e: any) =>
									onFieldChange(
										"retentionReleaseDays",
										e.target.value,
									)
								}
								placeholder="365"
								className="h-9 rounded-lg text-sm"
							/>
						</div>
					</div>
				</div>

				{/* Performance Bond */}
				<div className="rounded-xl border-2 bg-card p-4">
					<Label className="mb-3 block text-sm font-medium text-card-foreground">
						{t("projects.createProject.performanceBond")}
					</Label>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">
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
									onChange={(e: any) =>
										onFieldChange(
											"performanceBondPercent",
											e.target.value,
										)
									}
									placeholder="5"
									className="h-9 rounded-lg pe-6 text-sm"
								/>
								<span className="absolute end-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
									%
								</span>
							</div>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">
								{t(
									"projects.createProject.performanceBondAmount",
								)}
							</Label>
							<div className="flex h-9 items-center rounded-lg bg-chart-1/15 px-3 font-mono text-sm font-medium text-chart-1">
								{performanceBondAmount > 0
									? formatNumber(performanceBondAmount)
									: "\u2014"}
							</div>
						</div>
					</div>
				</div>

				{/* Insurance */}
				<div className="rounded-xl border-2 bg-card p-4">
					<div className="flex items-center justify-between">
						<Label className="text-sm font-medium text-card-foreground">
							{t(
								"projects.createProject.insuranceRequired",
							)}
						</Label>
						<Switch
							checked={insuranceRequired}
							onCheckedChange={(checked: any) =>
								onFieldChange("insuranceRequired", checked)
							}
						/>
					</div>
					{insuranceRequired && (
						<div className="mt-3">
							<Textarea
								value={insuranceDetails}
								onChange={(e: any) =>
									onFieldChange(
										"insuranceDetails",
										e.target.value,
									)
								}
								placeholder={t(
									"projects.createProject.insuranceDetailsPlaceholder",
								)}
								rows={2}
								className="rounded-lg text-sm"
							/>
						</div>
					)}
				</div>

				{/* Penalties */}
				<div className="rounded-xl border-2 bg-card p-4">
					<Label className="mb-3 block text-sm font-medium text-card-foreground">
						{t("projects.createProject.penalties")}
					</Label>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">
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
									onChange={(e: any) =>
										onFieldChange(
											"penaltyPercent",
											e.target.value,
										)
									}
									placeholder="0.5"
									className="h-9 rounded-lg pe-6 text-sm"
								/>
								<span className="absolute end-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
									%
								</span>
							</div>
						</div>

						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">
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
									onChange={(e: any) =>
										onFieldChange(
											"penaltyCapPercent",
											e.target.value,
										)
									}
									placeholder="10"
									className="h-9 rounded-lg pe-6 text-sm"
								/>
								<span className="absolute end-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
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
