"use client";

import {
	forwardRef,
	useCallback,
	useImperativeHandle,
	useMemo,
	useState,
} from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@ui/components/badge";
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
import { Switch } from "@ui/components/switch";
import { Textarea } from "@ui/components/textarea";
import {
	Calculator,
	CreditCard,
	FileSignature,
	Plus,
	Shield,
	Trash2,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────
const PAYMENT_METHODS = [
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
] as const;

const TERM_TYPES = [
	"ADVANCE",
	"MILESTONE",
	"MONTHLY",
	"COMPLETION",
	"CUSTOM",
] as const;

const CONTRACT_STATUSES = [
	"DRAFT",
	"ACTIVE",
	"SUSPENDED",
	"CLOSED",
] as const;

// ─── Types ──────────────────────────────────────────────────
type PaymentTermRow = {
	id: string;
	dbId?: string; // database ID for existing terms
	type: (typeof TERM_TYPES)[number];
	label: string;
	percent: string;
};

export interface ContractFormData {
	contractValue: number;
	contractStatus: string;
	includesVat: boolean;
	vatPercent: number | null;
	totalWithVat: number;
	signedDate: string;
	startDate: string;
	endDate: string;
	paymentMethod: string;
	scopeOfWork: string;
	contractNotes: string;
	retentionPercent: number | null;
	retentionCap: number | null;
	retentionReleaseDays: number | null;
	performanceBondPercent: number | null;
	performanceBondAmount: number | null;
	insuranceRequired: boolean;
	insuranceDetails: string;
	penaltyPercent: number | null;
	penaltyCapPercent: number | null;
	paymentTerms: Array<{
		id?: string;
		type: string;
		label: string | null;
		percent: number | null;
		amount: number | null;
		sortOrder: number;
	}>;
}

export interface ContractFormRef {
	getFormData(): ContractFormData;
}

interface ContractFormSectionsProps {
	contractNo?: string;
	initialData?: {
		value?: number;
		status?: string;
		includesVat?: boolean;
		vatPercent?: number | null;
		signedDate?: string | Date | null;
		startDate?: string | Date | null;
		endDate?: string | Date | null;
		paymentMethod?: string | null;
		scopeOfWork?: string | null;
		notes?: string | null;
		retentionPercent?: number | null;
		retentionCap?: number | null;
		retentionReleaseDays?: number | null;
		performanceBondPercent?: number | null;
		performanceBondAmount?: number | null;
		insuranceRequired?: boolean;
		insuranceDetails?: string | null;
		penaltyPercent?: number | null;
		penaltyCapPercent?: number | null;
		paymentTerms?: Array<{
			id?: string;
			type: string;
			label?: string | null;
			percent?: number | null;
			amount?: number | null;
		}>;
	};
}

// ─── Helpers ────────────────────────────────────────────────
function formatNumber(num: number): string {
	return num.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

function toDateInputValue(date: string | Date | null | undefined): string {
	if (!date) return "";
	const d = new Date(date);
	return d.toISOString().split("T")[0];
}

// ─── Component ──────────────────────────────────────────────
export const ContractFormSections = forwardRef<
	ContractFormRef,
	ContractFormSectionsProps
>(({ contractNo, initialData }, ref) => {
	const t = useTranslations();

	// ─── State ──────────────────────────────────────────
	const [formData, setFormData] = useState({
		contractValue: initialData?.value?.toString() ?? "",
		contractStatus: initialData?.status ?? "DRAFT",
		signedDate: toDateInputValue(initialData?.signedDate),
		startDate: toDateInputValue(initialData?.startDate),
		endDate: toDateInputValue(initialData?.endDate),
		contractNotes: initialData?.notes ?? "",
		paymentMethod: initialData?.paymentMethod ?? "",
		scopeOfWork: initialData?.scopeOfWork ?? "",
		includesVat: initialData?.includesVat ?? false,
		retentionPercent: initialData?.retentionPercent?.toString() ?? "",
		retentionCap: initialData?.retentionCap?.toString() ?? "",
		retentionReleaseDays:
			initialData?.retentionReleaseDays?.toString() ?? "",
		performanceBondPercent:
			initialData?.performanceBondPercent?.toString() ?? "",
		insuranceRequired: initialData?.insuranceRequired ?? false,
		insuranceDetails: initialData?.insuranceDetails ?? "",
		penaltyPercent: initialData?.penaltyPercent?.toString() ?? "",
		penaltyCapPercent: initialData?.penaltyCapPercent?.toString() ?? "",
	});

	const [paymentTerms, setPaymentTerms] = useState<PaymentTermRow[]>(
		initialData?.paymentTerms?.map((term) => ({
			id: term.id ?? crypto.randomUUID(),
			dbId: term.id ?? undefined,
			type: term.type as (typeof TERM_TYPES)[number],
			label: term.label ?? "",
			percent: term.percent?.toString() ?? "",
		})) ?? [],
	);

	// ─── Computed values ────────────────────────────────
	const contractValue = useMemo(() => {
		const val = parseFloat(formData.contractValue);
		return isNaN(val) ? 0 : val;
	}, [formData.contractValue]);

	const vatAmount = useMemo(() => {
		if (!formData.includesVat) return 0;
		return contractValue * 0.15;
	}, [contractValue, formData.includesVat]);

	const totalWithVat = useMemo(
		() => contractValue + vatAmount,
		[contractValue, vatAmount],
	);

	const retentionPercent = useMemo(() => {
		const val = parseFloat(formData.retentionPercent);
		return isNaN(val) ? 0 : val;
	}, [formData.retentionPercent]);

	const retentionAmount = useMemo(() => {
		const amount = (totalWithVat * retentionPercent) / 100;
		const cap = parseFloat(formData.retentionCap);
		if (!isNaN(cap) && cap > 0 && amount > cap) return cap;
		return amount;
	}, [totalWithVat, retentionPercent, formData.retentionCap]);

	const performanceBondPercent = useMemo(() => {
		const val = parseFloat(formData.performanceBondPercent);
		return isNaN(val) ? 0 : val;
	}, [formData.performanceBondPercent]);

	const performanceBondAmount = useMemo(
		() => (totalWithVat * performanceBondPercent) / 100,
		[totalWithVat, performanceBondPercent],
	);

	const termsTotalPercent = useMemo(
		() =>
			paymentTerms.reduce((sum, term) => {
				const pct = parseFloat(term.percent);
				return sum + (isNaN(pct) ? 0 : pct);
			}, 0),
		[paymentTerms],
	);

	const termsTotalAmount = useMemo(
		() => (totalWithVat * termsTotalPercent) / 100,
		[totalWithVat, termsTotalPercent],
	);

	// ─── Handlers ───────────────────────────────────────
	const updateField = useCallback(
		(field: string, value: string | boolean) => {
			setFormData((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	const addPaymentTerm = useCallback(() => {
		setPaymentTerms((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				type: "MILESTONE" as const,
				label: "",
				percent: "",
			},
		]);
	}, []);

	const removePaymentTerm = useCallback((id: string) => {
		setPaymentTerms((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const updatePaymentTerm = useCallback(
		(id: string, field: keyof PaymentTermRow, value: string) => {
			setPaymentTerms((prev) =>
				prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
			);
		},
		[],
	);

	// ─── Ref ────────────────────────────────────────────
	useImperativeHandle(ref, () => ({
		getFormData(): ContractFormData {
			const cv = parseFloat(formData.contractValue);
			return {
				contractValue: isNaN(cv) ? 0 : cv,
				contractStatus: formData.contractStatus,
				includesVat: formData.includesVat,
				vatPercent: formData.includesVat ? 15 : null,
				totalWithVat,
				signedDate: formData.signedDate,
				startDate: formData.startDate,
				endDate: formData.endDate,
				paymentMethod: formData.paymentMethod,
				scopeOfWork: formData.scopeOfWork,
				contractNotes: formData.contractNotes,
				retentionPercent: retentionPercent || null,
				retentionCap: formData.retentionCap
					? parseFloat(formData.retentionCap)
					: null,
				retentionReleaseDays: formData.retentionReleaseDays
					? parseInt(formData.retentionReleaseDays, 10)
					: null,
				performanceBondPercent: performanceBondPercent || null,
				performanceBondAmount: performanceBondAmount || null,
				insuranceRequired: formData.insuranceRequired,
				insuranceDetails: formData.insuranceDetails,
				penaltyPercent: formData.penaltyPercent
					? parseFloat(formData.penaltyPercent)
					: null,
				penaltyCapPercent: formData.penaltyCapPercent
					? parseFloat(formData.penaltyCapPercent)
					: null,
				paymentTerms: paymentTerms.map((term, idx) => {
					const pct = parseFloat(term.percent);
					return {
						id: term.dbId,
						type: term.type,
						label: term.label || null,
						percent: isNaN(pct) ? null : pct,
						amount:
							!isNaN(pct) ? (totalWithVat * pct) / 100 : null,
						sortOrder: idx,
					};
				}),
			};
		},
	}));

	// ─── Render ─────────────────────────────────────────
	return (
		<div className="space-y-6">
			{/* ═══ Section: Contract Details ══════════════════ */}
			<div className="overflow-hidden rounded-2xl border border-teal-200/50 bg-teal-50/50 dark:border-teal-800/30 dark:bg-teal-950/20">
				<div className="border-b border-teal-200/50 p-5 dark:border-teal-800/30">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-teal-100 p-2.5 dark:bg-teal-900/50">
								<FileSignature className="h-5 w-5 text-teal-600 dark:text-teal-400" />
							</div>
							<h2 className="text-lg font-medium text-teal-900 dark:text-teal-100">
								{t("projects.createProject.contractInfo")}
							</h2>
						</div>
						{contractNo && (
							<Badge
								variant="outline"
								className="rounded-lg border-teal-200 bg-teal-50 px-3 py-1 font-mono text-sm text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300"
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
									value={formData.contractValue}
									onChange={(e) =>
										updateField(
											"contractValue",
											e.target.value,
										)
									}
									placeholder="0.00"
									className="rounded-xl border-teal-200/60 bg-white pl-12 dark:border-teal-800/40 dark:bg-slate-900/50"
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
								value={formData.contractStatus}
								onValueChange={(value) =>
									updateField("contractStatus", value)
								}
							>
								<SelectTrigger className="rounded-xl border-teal-200/60 bg-white dark:border-teal-800/40 dark:bg-slate-900/50">
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
					<div className="rounded-xl border border-teal-200/40 bg-white/60 p-4 dark:border-teal-800/30 dark:bg-slate-900/30">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("projects.createProject.vatToggle")}
							</Label>
							<Switch
								checked={formData.includesVat}
								onCheckedChange={(checked) =>
									updateField("includesVat", checked)
								}
							/>
						</div>
						{formData.includesVat && contractValue > 0 && (
							<div className="mt-3 grid grid-cols-3 gap-3">
								<div className="rounded-lg bg-teal-50 p-3 dark:bg-teal-950/30">
									<p className="text-xs text-slate-500">
										{t(
											"projects.createProject.valueBeforeVat",
										)}
									</p>
									<p className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
										{formatNumber(contractValue)}
									</p>
								</div>
								<div className="rounded-lg bg-teal-50 p-3 dark:bg-teal-950/30">
									<p className="text-xs text-slate-500">
										{t("projects.createProject.vatAmount")}{" "}
										(15%)
									</p>
									<p className="font-mono text-sm font-semibold text-teal-700 dark:text-teal-300">
										+{formatNumber(vatAmount)}
									</p>
								</div>
								<div className="rounded-lg bg-teal-100 p-3 dark:bg-teal-900/40">
									<p className="text-xs text-slate-500">
										{t(
											"projects.createProject.valueWithVat",
										)}
									</p>
									<p className="font-mono text-sm font-bold text-teal-800 dark:text-teal-200">
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
								value={formData.signedDate}
								onChange={(e) =>
									updateField("signedDate", e.target.value)
								}
								className="rounded-xl border-teal-200/60 bg-white dark:border-teal-800/40 dark:bg-slate-900/50"
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("projects.createProject.startDate")}
							</Label>
							<Input
								type="date"
								value={formData.startDate}
								onChange={(e) =>
									updateField("startDate", e.target.value)
								}
								className="rounded-xl border-teal-200/60 bg-white dark:border-teal-800/40 dark:bg-slate-900/50"
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("projects.createProject.endDate")}
							</Label>
							<Input
								type="date"
								value={formData.endDate}
								onChange={(e) =>
									updateField("endDate", e.target.value)
								}
								className="rounded-xl border-teal-200/60 bg-white dark:border-teal-800/40 dark:bg-slate-900/50"
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
								value={formData.paymentMethod}
								onValueChange={(value) =>
									updateField("paymentMethod", value)
								}
							>
								<SelectTrigger className="rounded-xl border-teal-200/60 bg-white dark:border-teal-800/40 dark:bg-slate-900/50">
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
							value={formData.scopeOfWork}
							onChange={(e) =>
								updateField("scopeOfWork", e.target.value)
							}
							placeholder={t(
								"projects.createProject.scopeOfWorkPlaceholder",
							)}
							rows={3}
							className="rounded-xl border-teal-200/60 bg-white dark:border-teal-800/40 dark:bg-slate-900/50"
						/>
					</div>

					{/* Contract Notes */}
					<div className="space-y-2">
						<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
							{t("projects.createProject.contractNotes")}
						</Label>
						<Textarea
							value={formData.contractNotes}
							onChange={(e) =>
								updateField("contractNotes", e.target.value)
							}
							rows={2}
							className="rounded-xl border-teal-200/60 bg-white dark:border-teal-800/40 dark:bg-slate-900/50"
						/>
					</div>
				</div>
			</div>

			{/* ═══ Section: Payment Terms ═════════════════════ */}
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
							onClick={addPaymentTerm}
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

					{paymentTerms.map((term) => {
						const termPct = parseFloat(term.percent);
						const termAmount = !isNaN(termPct)
							? (totalWithVat * termPct) / 100
							: 0;

						return (
							<div
								key={term.id}
								className="grid grid-cols-[1fr_1.5fr_0.7fr_1fr_auto] items-end gap-3 rounded-xl border border-violet-100 bg-white p-3 dark:border-violet-800/30 dark:bg-slate-900/40"
							>
								<div className="space-y-1">
									<Label className="text-xs text-slate-500">
										{t(
											"projects.createProject.termType",
										)}
									</Label>
									<Select
										value={term.type}
										onValueChange={(val) =>
											updatePaymentTerm(
												term.id,
												"type",
												val,
											)
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
										{t(
											"projects.createProject.termLabel",
										)}
									</Label>
									<Input
										value={term.label}
										onChange={(e) =>
											updatePaymentTerm(
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
										{t(
											"projects.createProject.termPercent",
										)}
									</Label>
									<div className="relative">
										<Input
											type="number"
											step="0.01"
											min="0"
											max="100"
											value={term.percent}
											onChange={(e) =>
												updatePaymentTerm(
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
										{t(
											"projects.createProject.termAmount",
										)}
									</Label>
									<div className="flex h-9 items-center rounded-lg bg-violet-50 px-3 font-mono text-xs font-medium text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
										{termAmount > 0
											? formatNumber(termAmount)
											: "—"}
									</div>
								</div>

								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() =>
										removePaymentTerm(term.id)
									}
									className="h-9 w-9 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						);
					})}

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
									{formatNumber(termsTotalAmount)} ر.س
								</span>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* ═══ Section: Guarantees & Retention ════════════ */}
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
										value={formData.retentionPercent}
										onChange={(e) =>
											updateField(
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
										: "—"}
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
										value={formData.retentionCap}
										onChange={(e) =>
											updateField(
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
									value={formData.retentionReleaseDays}
									onChange={(e) =>
										updateField(
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
										value={
											formData.performanceBondPercent
										}
										onChange={(e) =>
											updateField(
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
										: "—"}
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
								checked={formData.insuranceRequired}
								onCheckedChange={(checked) =>
									updateField("insuranceRequired", checked)
								}
							/>
						</div>
						{formData.insuranceRequired && (
							<div className="mt-3">
								<Textarea
									value={formData.insuranceDetails}
									onChange={(e) =>
										updateField(
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
										value={formData.penaltyPercent}
										onChange={(e) =>
											updateField(
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
										value={formData.penaltyCapPercent}
										onChange={(e) =>
											updateField(
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

			{/* ═══ Fixed Summary Strip ════════════════════════ */}
			{contractValue > 0 && (
				<div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
					<div className="mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto px-4 py-3">
						<Calculator className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
						<span className="shrink-0 text-xs font-medium text-slate-500">
							{t("projects.createProject.summaryStrip")}:
						</span>

						<div className="shrink-0 rounded-md bg-teal-50 px-2.5 py-1 dark:bg-teal-950/30">
							<span className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-300">
								{formatNumber(contractValue)}
							</span>
						</div>

						{formData.includesVat && (
							<>
								<span className="text-xs text-slate-400">
									+
								</span>
								<div className="shrink-0 rounded-md bg-teal-50 px-2.5 py-1 dark:bg-teal-950/30">
									<span className="text-[10px] text-slate-400">
										VAT{" "}
									</span>
									<span className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-300">
										{formatNumber(vatAmount)}
									</span>
								</div>
								<span className="text-xs text-slate-400">
									=
								</span>
								<div className="shrink-0 rounded-md bg-teal-100 px-2.5 py-1 dark:bg-teal-900/40">
									<span className="font-mono text-xs font-bold text-teal-800 dark:text-teal-200">
										{formatNumber(totalWithVat)}
									</span>
								</div>
							</>
						)}

						<div className="mx-1 h-4 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />

						{retentionAmount > 0 && (
							<div className="shrink-0 rounded-md bg-amber-50 px-2.5 py-1 dark:bg-amber-950/30">
								<span className="text-[10px] text-slate-400">
									{t(
										"projects.createProject.retentionInfo",
									)}{" "}
								</span>
								<span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
									{formatNumber(retentionAmount)}
								</span>
							</div>
						)}

						{performanceBondAmount > 0 && (
							<div className="shrink-0 rounded-md bg-amber-50 px-2.5 py-1 dark:bg-amber-950/30">
								<span className="text-[10px] text-slate-400">
									{t(
										"projects.createProject.performanceBond",
									)}{" "}
								</span>
								<span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
									{formatNumber(performanceBondAmount)}
								</span>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
});

ContractFormSections.displayName = "ContractFormSections";
