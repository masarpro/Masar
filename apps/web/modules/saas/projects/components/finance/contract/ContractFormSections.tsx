"use client";

import {
	forwardRef,
	useCallback,
	useImperativeHandle,
	useMemo,
	useState,
} from "react";
import { useTranslations } from "next-intl";
import { Calculator } from "lucide-react";
import { ContractDetailsSection } from "./ContractDetailsSection";
import {
	PaymentTermsEditor,
	type PaymentTermRow,
} from "./PaymentTermsEditor";
import { ContractNotesSection } from "./ContractNotesSection";

// ─── Constants (shared with sub-components) ─────────────────
export const PAYMENT_METHODS = [
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
] as const;

export const TERM_TYPES = [
	"ADVANCE",
	"MILESTONE",
	"MONTHLY",
	"COMPLETION",
	"CUSTOM",
] as const;

export const CONTRACT_STATUSES = [
	"DRAFT",
	"ACTIVE",
	"SUSPENDED",
	"CLOSED",
] as const;

// ─── Types (shared with sub-components) ─────────────────────
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

// ─── Helpers (exported for sub-components) ──────────────────
export function formatNumber(num: number): string {
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
			amount: term.amount?.toString() ?? "",
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
		() =>
			paymentTerms.reduce((sum, term) => {
				const amt = parseFloat(term.amount);
				return sum + (isNaN(amt) ? 0 : amt);
			}, 0),
		[paymentTerms],
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
				amount: "",
			},
		]);
	}, []);

	const removePaymentTerm = useCallback((id: string) => {
		setPaymentTerms((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const updatePaymentTerm = useCallback(
		(id: string, field: keyof PaymentTermRow, value: string) => {
			setPaymentTerms((prev) =>
				prev.map((t) => {
					if (t.id !== id) return t;
					const updated = { ...t, [field]: value };

					if (field === "percent" && totalWithVat > 0) {
						const pct = parseFloat(value);
						updated.amount =
							!isNaN(pct) && value !== ""
								? ((totalWithVat * pct) / 100).toFixed(2)
								: "";
					} else if (field === "amount" && totalWithVat > 0) {
						const amt = parseFloat(value);
						updated.percent =
							!isNaN(amt) && value !== ""
								? ((amt / totalWithVat) * 100).toFixed(2)
								: "";
					}

					return updated;
				}),
			);
		},
		[totalWithVat],
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
					const amt = parseFloat(term.amount);
					return {
						id: term.dbId,
						type: term.type,
						label: term.label || null,
						percent: isNaN(pct) ? null : pct,
						amount: isNaN(amt) ? null : amt,
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
			<ContractDetailsSection
				contractNo={contractNo}
				contractValue={formData.contractValue}
				contractStatus={formData.contractStatus}
				includesVat={formData.includesVat}
				signedDate={formData.signedDate}
				startDate={formData.startDate}
				endDate={formData.endDate}
				paymentMethod={formData.paymentMethod}
				scopeOfWork={formData.scopeOfWork}
				contractNotes={formData.contractNotes}
				numericContractValue={contractValue}
				vatAmount={vatAmount}
				totalWithVat={totalWithVat}
				onFieldChange={updateField}
			/>

			{/* ═══ Section: Guarantees & Retention ═══════════ */}
			<ContractNotesSection
				retentionPercent={formData.retentionPercent}
				retentionCap={formData.retentionCap}
				retentionReleaseDays={formData.retentionReleaseDays}
				performanceBondPercent={formData.performanceBondPercent}
				insuranceRequired={formData.insuranceRequired}
				insuranceDetails={formData.insuranceDetails}
				penaltyPercent={formData.penaltyPercent}
				penaltyCapPercent={formData.penaltyCapPercent}
				retentionAmount={retentionAmount}
				performanceBondAmount={performanceBondAmount}
				onFieldChange={updateField}
			/>

			{/* ═══ Section: Payment Terms ═════════════════════ */}
			<PaymentTermsEditor
				paymentTerms={paymentTerms}
				termsTotalPercent={termsTotalPercent}
				termsTotalAmount={termsTotalAmount}
				onAddTerm={addPaymentTerm}
				onRemoveTerm={removePaymentTerm}
				onUpdateTerm={updatePaymentTerm}
			/>

			{/* ═══ Fixed Summary Strip ════════════════════════ */}
			{contractValue > 0 && (
				<div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
					<div className="mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto px-4 py-3">
						<Calculator className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
						<span className="shrink-0 text-xs font-medium text-slate-500">
							{t("projects.createProject.summaryStrip")}:
						</span>

						<div className="shrink-0 rounded-md bg-sky-50 px-2.5 py-1 dark:bg-sky-950/30">
							<span className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-300">
								{formatNumber(contractValue)}
							</span>
						</div>

						{formData.includesVat && (
							<>
								<span className="text-xs text-slate-400">
									+
								</span>
								<div className="shrink-0 rounded-md bg-sky-50 px-2.5 py-1 dark:bg-sky-950/30">
									<span className="text-[10px] text-slate-400">
										VAT{" "}
									</span>
									<span className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-300">
										{formatNumber(vatAmount)}
									</span>
								</div>
								<span className="text-xs text-slate-400">
									=
								</span>
								<div className="shrink-0 rounded-md bg-sky-100 px-2.5 py-1 dark:bg-sky-900/40">
									<span className="font-mono text-xs font-bold text-sky-800 dark:text-sky-200">
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
