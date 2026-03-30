"use client";
// TODO(i18n): Extract hardcoded Arabic strings to translation keys

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Card, CardContent } from "@ui/components/card";
import { Progress } from "@ui/components/progress";
import { toast } from "sonner";
import {
	ArrowLeft,
	ArrowRight,
	Loader2,
	Plus,
	Save,
	Trash2,
} from "lucide-react";
import { FormPageSkeleton } from "@saas/shared/components/skeletons";
import { SubcontractTabs } from "./SubcontractTabs";

interface SubcontractClaimFormProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	subcontractId: string;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

function formatNumber(value: number, decimals = 2): string {
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: decimals,
	}).format(value);
}

export function SubcontractClaimForm({
	organizationId,
	organizationSlug,
	projectId,
	subcontractId,
}: SubcontractClaimFormProps) {
	const t = useTranslations("claims");
	const router = useRouter();
	const queryClient = useQueryClient();

	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance/subcontracts/${subcontractId}`;

	const [step, setStep] = useState(1);

	// Step 1 form fields
	const [title, setTitle] = useState("");
	const [claimType, setClaimType] = useState<"INTERIM" | "FINAL" | "RETENTION">("INTERIM");
	const [periodStart, setPeriodStart] = useState("");
	const [periodEnd, setPeriodEnd] = useState("");
	const [notes, setNotes] = useState("");

	// Step 2 item quantities - map of contractItemId → thisQty
	const [itemQtys, setItemQtys] = useState<Record<string, number>>({});
	const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

	// Manual items (not linked to contract items)
	interface ManualItem {
		id: string;
		description: string;
		unit: string;
		qty: number;
		unitPrice: number;
	}
	const [manualItems, setManualItems] = useState<ManualItem[]>([]);

	function addManualItem() {
		setManualItems((prev) => [
			...prev,
			{ id: crypto.randomUUID(), description: "", unit: "ls", qty: 1, unitPrice: 0 },
		]);
	}

	function updateManualItem(id: string, field: keyof ManualItem, value: string | number) {
		setManualItems((prev) =>
			prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
		);
	}

	function removeManualItem(id: string) {
		setManualItems((prev) => prev.filter((item) => item.id !== id));
	}

	// Penalty / deductions
	const [penaltyAmount, setPenaltyAmount] = useState(0);
	const [otherDeductions, setOtherDeductions] = useState(0);
	const [otherDeductionsNote, setOtherDeductionsNote] = useState("");

	// Fetch contract details
	const { data: contract } = useQuery(
		orpc.subcontracts.get.queryOptions({
			input: { organizationId, projectId, contractId: subcontractId },
		}),
	);

	// Fetch contract items (BOQ) with cumulative claimed quantities
	const { data: items, isLoading: itemsLoading } = useQuery(
		orpc.subcontracts.listItems.queryOptions({
			input: { organizationId, projectId, contractId: subcontractId },
		}),
	);

	// Create claim mutation
	const createMutation = useMutation({
		...orpc.subcontracts.createClaim.mutationOptions(),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			toast.success(t("actions.saveDraft") + " ✓");
			router.push(`${basePath}/claims/${data.id}`);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	// Compute financial summary in real-time
	const financialSummary = useMemo(() => {
		if (!contract) return null;

		const retentionPercent = Number(contract.retentionPercent ?? 10);
		const vatPercent = Number(contract.vatPercent ?? 15);
		const advancePercent = Number(contract.advancePaymentPercent ?? 0);

		let grossAmount = 0;
		if (items) {
			for (const item of items) {
				const qty = itemQtys[item.id] ?? 0;
				grossAmount += qty * item.unitPrice;
			}
		}
		// Add manual items
		for (const mi of manualItems) {
			grossAmount += (mi.qty || 0) * (mi.unitPrice || 0);
		}

		const retentionDeduction = grossAmount * (retentionPercent / 100);
		const advanceDeduction = grossAmount * (advancePercent / 100);
		const penaltyDed = penaltyAmount;
		const otherDed = otherDeductions;
		const taxableAmount = grossAmount - retentionDeduction - advanceDeduction - penaltyDed - otherDed;
		const vatAmount = taxableAmount > 0 ? taxableAmount * (vatPercent / 100) : 0;
		const netAmount = grossAmount - retentionDeduction - advanceDeduction - penaltyDed - otherDed + vatAmount;

		return {
			grossAmount,
			retentionPercent,
			retentionDeduction,
			advancePercent,
			advanceDeduction,
			penaltyDed,
			otherDed,
			vatPercent,
			vatAmount,
			netAmount,
		};
	}, [items, contract, itemQtys, manualItems, penaltyAmount, otherDeductions]);

	function handleQtyChange(itemId: string, contractQty: number, prevCumQty: number, value: string) {
		const qty = Number.parseFloat(value) || 0;
		const remaining = contractQty - prevCumQty;

		setItemQtys((prev) => ({ ...prev, [itemId]: qty }));

		if (qty > remaining) {
			setItemErrors((prev) => ({
				...prev,
				[itemId]: t("validation.qtyExceedsRemaining", {
					qty: formatNumber(qty, 3),
					remaining: formatNumber(remaining, 3),
				}),
			}));
		} else {
			setItemErrors((prev) => {
				const next = { ...prev };
				delete next[itemId];
				return next;
			});
		}
	}

	function canProceedToStep2(): boolean {
		return title.trim().length > 0 && periodStart !== "" && periodEnd !== "";
	}

	function hasAnyQty(): boolean {
		const hasContractItems = Object.values(itemQtys).some((q) => q > 0);
		const hasManualItems = manualItems.some((mi) => mi.description.trim() && mi.qty > 0 && mi.unitPrice > 0);
		return hasContractItems || hasManualItems;
	}

	function hasErrors(): boolean {
		return Object.keys(itemErrors).length > 0;
	}

	function handleSubmit(submitAfterSave: boolean) {
		if (!hasAnyQty()) {
			toast.error(t("validation.noItemsAdded"));
			return;
		}
		if (hasErrors()) {
			toast.error(t("validation.qtyExceedsRemaining", { qty: "", remaining: "" }));
			return;
		}

		const claimItems = Object.entries(itemQtys)
			.filter(([, qty]) => qty > 0)
			.map(([contractItemId, thisQty]) => ({
				contractItemId,
				thisQty,
			}));

		const validManualItems = manualItems
			.filter((mi) => mi.description.trim() && mi.qty > 0 && mi.unitPrice > 0)
			.map((mi) => ({
				description: mi.description.trim(),
				unit: mi.unit,
				qty: mi.qty,
				unitPrice: mi.unitPrice,
			}));

		createMutation.mutate({
			organizationId,
			projectId,
			contractId: subcontractId,
			title,
			periodStart: new Date(periodStart),
			periodEnd: new Date(periodEnd),
			claimType,
			notes: notes || undefined,
			penaltyAmount,
			otherDeductions,
			otherDeductionsNote: otherDeductionsNote || undefined,
			items: claimItems,
			manualItems: validManualItems,
		});
	}

	return (
		<div className="space-y-6">
			{/* Navigation Tabs */}
			<SubcontractTabs
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				projectId={projectId}
				subcontractId={subcontractId}
			/>

			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">{t("newClaim")}</h1>
					{contract && (
						<p className="text-muted-foreground mt-1">{contract.name}</p>
					)}
				</div>
			</div>

			{/* Stepper indicator */}
			<div className="flex items-center gap-4">
				<div
					className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
						step === 1
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground"
					}`}
				>
					<span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
						1
					</span>
					{t("steps.claimInfo")}
				</div>
				<div className="h-px flex-1 bg-border" />
				<div
					className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
						step === 2
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground"
					}`}
				>
					<span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
						2
					</span>
					{t("steps.itemsTable")}
				</div>
			</div>

			{/* Step 1 — Claim Info */}
			{step === 1 && (
				<Card>
					<CardContent className="p-6 space-y-5">
						<div className="space-y-2">
							<Label>{t("claimTitle")}</Label>
							<Input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="مستخلص خرسانة الدور الثالث"
							/>
						</div>

						<div className="space-y-2">
							<Label>{t("claimType")}</Label>
							<Select
								value={claimType}
								onValueChange={(v) =>
									setClaimType(v as "INTERIM" | "FINAL" | "RETENTION")
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="INTERIM">{t("interim")}</SelectItem>
									<SelectItem value="FINAL">{t("final")}</SelectItem>
									<SelectItem value="RETENTION">
										{t("retentionRelease")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>{t("periodFrom")}</Label>
								<Input
									type="date"
									value={periodStart}
									onChange={(e) => setPeriodStart(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>{t("periodTo")}</Label>
								<Input
									type="date"
									value={periodEnd}
									onChange={(e) => setPeriodEnd(e.target.value)}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label>{t("notes")}</Label>
							<Textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								rows={3}
							/>
						</div>

						<div className="flex justify-end">
							<Button
								onClick={() => setStep(2)}
								disabled={!canProceedToStep2()}
							>
								{t("next")}
								<ArrowLeft className="h-4 w-4 ms-2" />
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Step 2 — Items Table */}
			{step === 2 && (
				<>
					{itemsLoading ? <FormPageSkeleton /> : !items?.length ? (
						<div className="rounded-xl border border-dashed p-8 text-center">
							<p className="text-muted-foreground text-sm">
								{t("noContractItems")}
							</p>
							<Button
								variant="outline"
								size="sm"
								className="mt-3"
								onClick={() => router.push(`${basePath}/items`)}
							>
								{t("goToItems")}
							</Button>
						</div>
					) : (
						<div className="rounded-xl border overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/50">
										<TableHead className="w-48">{t("itemColumn")}</TableHead>
										<TableHead className="w-16 text-center">
											{t("items.contractQty")}
										</TableHead>
										<TableHead className="w-16 text-center text-muted-foreground">
											{t("items.prevCumulative")}
										</TableHead>
										<TableHead className="w-32 text-center font-bold">
											{t("items.thisQty")}
										</TableHead>
										<TableHead className="w-20 text-center">
											{t("items.completionPct")}
										</TableHead>
										<TableHead className="w-20 text-center">
											{t("items.remaining")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{items.map((item) => {
										const thisQty = itemQtys[item.id] ?? 0;
										const prevCum = item.totalCumulativeQty ?? 0;
										const contractQty = item.contractQty;
										const newCum = prevCum + thisQty;
										const remaining = contractQty - newCum;
										const completionPct =
											contractQty > 0
												? Math.round((newCum / contractQty) * 10000) / 100
												: 0;
										const hasError = !!itemErrors[item.id];

										return (
											<TableRow key={item.id}>
												<TableCell>
													<div className="font-medium text-sm">
														{item.description}
													</div>
													{item.itemCode && (
														<div className="text-xs text-muted-foreground font-mono">
															{item.itemCode}
														</div>
													)}
													<div className="text-xs text-muted-foreground">
														{item.isLumpSum ? "LS" : item.unit}
													</div>
												</TableCell>
												<TableCell
													className="text-center tabular-nums text-sm"
													dir="ltr"
												>
													{item.isLumpSum
														? "—"
														: formatNumber(contractQty, 3)}
												</TableCell>
												<TableCell
													className="text-center tabular-nums text-sm text-muted-foreground"
													dir="ltr"
												>
													{formatNumber(prevCum, 3)}
												</TableCell>
												<TableCell className="text-center">
													<Input
														type="number"
														step="any"
														min={0}
														className={`w-28 mx-auto text-center tabular-nums ${
															hasError
																? "border-destructive focus-visible:ring-destructive"
																: ""
														}`}
														dir="ltr"
														value={itemQtys[item.id] ?? ""}
														onChange={(e) =>
															handleQtyChange(
																item.id,
																contractQty,
																prevCum,
																e.target.value,
															)
														}
														placeholder="0"
													/>
													{hasError && (
														<p className="text-[10px] text-destructive mt-1">
															{itemErrors[item.id]}
														</p>
													)}
												</TableCell>
												<TableCell className="text-center">
													<div className="flex items-center gap-1.5">
														<Progress
															value={Math.min(completionPct, 100)}
															className="h-2 flex-1"
														/>
														<span
															className="text-xs tabular-nums text-muted-foreground w-10"
															dir="ltr"
														>
															{completionPct}%
														</span>
													</div>
												</TableCell>
												<TableCell
													className="text-center tabular-nums text-sm"
													dir="ltr"
												>
													{formatNumber(Math.max(remaining, 0), 3)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}

					{/* Manual Items Section */}
					<div className="rounded-xl border p-4 space-y-3">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-sm font-semibold">{t("manualItems")}</h3>
								<p className="text-xs text-muted-foreground">{t("manualItemsNote")}</p>
							</div>
							<Button variant="outline" size="sm" onClick={addManualItem}>
								<Plus className="h-4 w-4 me-1" />
								{t("addManualItem")}
							</Button>
						</div>
						{manualItems.length > 0 && (
							<div className="space-y-2">
								{manualItems.map((mi) => (
									<div key={mi.id} className="grid grid-cols-12 gap-2 items-end rounded-lg bg-muted/30 p-2">
										<div className="col-span-4">
											<Label className="text-xs">{t("manualItemDescription")}</Label>
											<Input
												value={mi.description}
												onChange={(e) => updateManualItem(mi.id, "description", e.target.value)}
												placeholder={t("manualItemDescription")}
												className="h-8 text-sm"
											/>
										</div>
										<div className="col-span-2">
											<Label className="text-xs">{t("manualItemUnit")}</Label>
											<Input
												value={mi.unit}
												onChange={(e) => updateManualItem(mi.id, "unit", e.target.value)}
												className="h-8 text-sm"
												dir="ltr"
											/>
										</div>
										<div className="col-span-2">
											<Label className="text-xs">{t("manualItemQty")}</Label>
											<Input
												type="number"
												step="any"
												min={0}
												value={mi.qty || ""}
												onChange={(e) => updateManualItem(mi.id, "qty", Number(e.target.value) || 0)}
												className="h-8 text-sm"
												dir="ltr"
											/>
										</div>
										<div className="col-span-2">
											<Label className="text-xs">{t("manualItemPrice")}</Label>
											<Input
												type="number"
												step="0.01"
												min={0}
												value={mi.unitPrice || ""}
												onChange={(e) => updateManualItem(mi.id, "unitPrice", Number(e.target.value) || 0)}
												className="h-8 text-sm"
												dir="ltr"
											/>
										</div>
										<div className="col-span-1 text-center">
											<Label className="text-xs">{t("manualItemAmount")}</Label>
											<p className="text-sm font-medium tabular-nums h-8 leading-8" dir="ltr">
												{formatNumber((mi.qty || 0) * (mi.unitPrice || 0))}
											</p>
										</div>
										<div className="col-span-1 flex justify-center">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-destructive"
												onClick={() => removeManualItem(mi.id)}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Financial Summary */}
					{financialSummary && financialSummary.grossAmount > 0 && (
						<Card>
							<CardContent className="p-5">
								<div className="space-y-3 text-sm">
									<div className="flex justify-between">
										<span>{t("grossAmount")}:</span>
										<span className="font-bold tabular-nums" dir="ltr">
											{formatCurrency(financialSummary.grossAmount)}
										</span>
									</div>
									<div className="flex justify-between text-muted-foreground">
										<span>
											(-) {t("retentionDeduction")} ({financialSummary.retentionPercent}%):
										</span>
										<span className="tabular-nums" dir="ltr">
											{formatCurrency(financialSummary.retentionDeduction)}
										</span>
									</div>
									{financialSummary.advancePercent > 0 && (
										<div className="flex justify-between text-muted-foreground">
											<span>
												(-) {t("advanceDeduction")} ({financialSummary.advancePercent}%):
											</span>
											<span className="tabular-nums" dir="ltr">
												{formatCurrency(financialSummary.advanceDeduction)}
											</span>
										</div>
									)}
									{financialSummary.penaltyDed > 0 && (
										<div className="flex justify-between text-sm">
											<span>(-) {t("penaltyAmount")}:</span>
											<span className="font-medium text-red-600">{formatCurrency(financialSummary.penaltyDed)}</span>
										</div>
									)}
									{financialSummary.otherDed > 0 && (
										<div className="flex justify-between text-sm">
											<span>(-) {t("otherDeductions")}:</span>
											<span className="font-medium text-red-600">{formatCurrency(financialSummary.otherDed)}</span>
										</div>
									)}
									<div className="flex justify-between text-muted-foreground">
										<span>
											(+) {t("vatAmount")} ({financialSummary.vatPercent}%):
										</span>
										<span className="tabular-nums" dir="ltr">
											{formatCurrency(financialSummary.vatAmount)}
										</span>
									</div>
									<div className="border-t pt-3 flex justify-between text-base font-bold">
										<span>{t("netAmount")}:</span>
										<span className="tabular-nums" dir="ltr">
											{formatCurrency(financialSummary.netAmount)}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Additional Deductions (collapsible) */}
					<details className="rounded-lg border p-3">
						<summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
							{t("additionalDeductions")} ▾
						</summary>
						<div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="space-y-1.5">
								<Label className="text-xs">{t("penaltyAmount")}</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={penaltyAmount || ""}
									onChange={(e) => setPenaltyAmount(Number.parseFloat(e.target.value) || 0)}
									placeholder="0.00"
									className="rounded-lg"
									dir="ltr"
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs">{t("otherDeductions")}</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={otherDeductions || ""}
									onChange={(e) => setOtherDeductions(Number.parseFloat(e.target.value) || 0)}
									placeholder="0.00"
									className="rounded-lg"
									dir="ltr"
								/>
							</div>
							{otherDeductions > 0 && (
								<div className="space-y-1.5 sm:col-span-2">
									<Label className="text-xs">{t("otherDeductionsNote")}</Label>
									<Input
										value={otherDeductionsNote}
										onChange={(e) => setOtherDeductionsNote(e.target.value)}
										placeholder={t("notesPlaceholder")}
										className="rounded-lg"
									/>
								</div>
							)}
						</div>
					</details>

					{/* Action buttons */}
					<div className="flex items-center justify-between">
						<Button variant="outline" onClick={() => setStep(1)}>
							<ArrowRight className="h-4 w-4 me-2" />
							{t("back")}
						</Button>
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() => handleSubmit(false)}
								disabled={
									createMutation.isPending || !hasAnyQty() || hasErrors()
								}
							>
								{createMutation.isPending && (
									<Loader2 className="h-4 w-4 animate-spin me-2" />
								)}
								<Save className="h-4 w-4 me-2" />
								{t("actions.saveDraft")}
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
