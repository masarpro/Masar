"use client";

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
			<div className="overflow-hidden rounded-2xl border-2 bg-card">
				<div className="border-b-2 p-5">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-chart-4/15 p-2.5">
								<FileSignature className="h-5 w-5 text-chart-4" />
							</div>
							<h2 className="text-lg font-medium text-card-foreground">
								{t("projects.createProject.contractInfo")}
							</h2>
						</div>
						{contractNo && (
							<Badge
								variant="outline"
								className="rounded-lg border-chart-4 bg-chart-4/15 px-3 py-1 font-mono text-sm text-chart-4"
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
							<Label className="text-sm font-medium text-foreground">
								{t("projects.createProject.contractValue")} *
							</Label>
							<div className="relative">
								<Input
									type="number"
									step="0.01"
									min="0"
									value={contractValue}
									onChange={(e: any) =>
										onFieldChange(
											"contractValue",
											e.target.value,
										)
									}
									placeholder="0.00"
									className="rounded-xl pe-12"
								/>
								<span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
									{t("common.sar")}
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="text-sm font-medium text-foreground">
								{t("projects.createProject.contractStatus")}
							</Label>
							<Select
								value={contractStatus}
								onValueChange={(value: any) =>
									onFieldChange("contractStatus", value)
								}
							>
								<SelectTrigger className="rounded-xl">
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
					<div className="rounded-xl border-2 bg-card p-4">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-medium text-foreground">
								{t("projects.createProject.vatToggle")}
							</Label>
							<Switch
								checked={includesVat}
								onCheckedChange={(checked: any) =>
									onFieldChange("includesVat", checked)
								}
							/>
						</div>
						{includesVat && numericContractValue > 0 && (
							<div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div className="rounded-lg bg-chart-4/15 p-3">
									<p className="text-xs text-muted-foreground">
										{t(
											"projects.createProject.valueBeforeVat",
										)}
									</p>
									<p className="font-mono text-sm font-semibold text-card-foreground">
										{formatNumber(numericContractValue)}
									</p>
								</div>
								<div className="rounded-lg bg-chart-4/15 p-3">
									<p className="text-xs text-muted-foreground">
										{t("projects.createProject.vatAmount")}{" "}
										(15%)
									</p>
									<p className="font-mono text-sm font-semibold text-chart-4">
										+{formatNumber(vatAmount)}
									</p>
								</div>
								<div className="rounded-lg bg-chart-4/15 p-3">
									<p className="text-xs text-muted-foreground">
										{t(
											"projects.createProject.valueWithVat",
										)}
									</p>
									<p className="font-mono text-sm font-bold text-chart-4">
										{formatNumber(totalWithVat)}
									</p>
								</div>
							</div>
						)}
					</div>

					{/* Dates */}
					<div className="grid gap-5 sm:grid-cols-3">
						<div className="space-y-2">
							<Label className="text-sm font-medium text-foreground">
								{t("projects.createProject.signedDate")}
							</Label>
							<Input
								type="date"
								value={signedDate}
								onChange={(e: any) =>
									onFieldChange("signedDate", e.target.value)
								}
								className="rounded-xl"
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium text-foreground">
								{t("projects.createProject.startDate")}
							</Label>
							<Input
								type="date"
								value={startDate}
								onChange={(e: any) =>
									onFieldChange("startDate", e.target.value)
								}
								className="rounded-xl"
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium text-foreground">
								{t("projects.createProject.endDate")}
							</Label>
							<Input
								type="date"
								value={endDate}
								onChange={(e: any) =>
									onFieldChange("endDate", e.target.value)
								}
								className="rounded-xl"
							/>
						</div>
					</div>

					{/* Payment method */}
					<div className="grid gap-5 sm:grid-cols-2">
						<div className="space-y-2">
							<Label className="text-sm font-medium text-foreground">
								{t("projects.createProject.paymentMethod")}
							</Label>
							<Select
								value={paymentMethod}
								onValueChange={(value: any) =>
									onFieldChange("paymentMethod", value)
								}
							>
								<SelectTrigger className="rounded-xl">
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
						<Label className="text-sm font-medium text-foreground">
							{t("projects.createProject.scopeOfWork")}
						</Label>
						<Textarea
							value={scopeOfWork}
							onChange={(e: any) =>
								onFieldChange("scopeOfWork", e.target.value)
							}
							placeholder={t(
								"projects.createProject.scopeOfWorkPlaceholder",
							)}
							rows={3}
							className="rounded-xl"
						/>
					</div>

					{/* Contract Notes */}
					<div className="space-y-2">
						<Label className="text-sm font-medium text-foreground">
							{t("projects.createProject.contractNotes")}
						</Label>
						<Textarea
							value={contractNotes}
							onChange={(e: any) =>
								onFieldChange("contractNotes", e.target.value)
							}
							rows={2}
							className="rounded-xl"
						/>
					</div>
				</div>
			</div>
		);
	},
);
