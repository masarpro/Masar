"use client";

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
	Save,
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
		if (!items || !contract) return null;

		const retentionPercent = Number(contract.retentionPercent ?? 10);
		const vatPercent = Number(contract.vatPercent ?? 15);
		const advancePercent = Number(contract.advancePaymentPercent ?? 0);

		let grossAmount = 0;
		for (const item of items) {
			const qty = itemQtys[item.id] ?? 0;
			grossAmount += qty * item.unitPrice;
		}

		const retentionDeduction = grossAmount * (retentionPercent / 100);
		const advanceDeduction = grossAmount * (advancePercent / 100);
		const taxableAmount = grossAmount - retentionDeduction - advanceDeduction;
		const vatAmount = taxableAmount > 0 ? taxableAmount * (vatPercent / 100) : 0;
		const netAmount = grossAmount - retentionDeduction - advanceDeduction + vatAmount;

		return {
			grossAmount,
			retentionPercent,
			retentionDeduction,
			advancePercent,
			advanceDeduction,
			vatPercent,
			vatAmount,
			netAmount,
		};
	}, [items, contract, itemQtys]);

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
		return Object.values(itemQtys).some((q) => q > 0);
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

		createMutation.mutate({
			organizationId,
			projectId,
			contractId: subcontractId,
			title,
			periodStart: new Date(periodStart),
			periodEnd: new Date(periodEnd),
			claimType,
			notes: notes || undefined,
			items: claimItems,
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
					معلومات المستخلص
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
					جدول البنود
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
								التالي
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
						<div className="rounded-xl border border-dashed p-12 text-center">
							<p className="text-muted-foreground">
								لا توجد بنود في هذا العقد. أضف بنود أولاً من صفحة البنود.
							</p>
							<Button
								variant="outline"
								className="mt-4"
								onClick={() => router.push(`${basePath}/items`)}
							>
								الذهاب لصفحة البنود
							</Button>
						</div>
					) : (
						<div className="rounded-xl border overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/50">
										<TableHead className="w-48">البند</TableHead>
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

					{/* Action buttons */}
					<div className="flex items-center justify-between">
						<Button variant="outline" onClick={() => setStep(1)}>
							<ArrowRight className="h-4 w-4 me-2" />
							رجوع
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
