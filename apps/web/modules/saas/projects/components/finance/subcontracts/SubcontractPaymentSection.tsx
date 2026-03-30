"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
	ArrowUpDown,
	Banknote,
	Plus,
	Search,
} from "lucide-react";
import { formatCurrency } from "./subcontract-shared";
import { SubcontractInlinePaymentForm } from "./SubcontractInlinePaymentForm";
import { SubcontractPaymentTermsProgress } from "./SubcontractPaymentTermsProgress";

// ─── Types ──────────────────────────────────────────────────────────

interface Payment {
	id: string;
	paymentNo?: string | null;
	date: Date | string;
	amount: number;
	status: string;
	paymentMethod?: string | null;
	referenceNo?: string | null;
	description?: string | null;
	claimId?: string | null;
	term?: { label?: string | null; type?: string | null } | null;
	sourceAccount?: { name?: string | null } | null;
}

interface ApprovedClaim {
	id: string;
	claimNo: number;
	netAmount: number;
	paidAmount: number;
}

interface TermProgress {
	id: string;
	label?: string | null;
	type: string;
	amount: number;
	paidAmount: number;
	remainingAmount: number;
	progressPercent: number;
	isComplete: boolean;
}

interface TermsProgressData {
	terms: TermProgress[];
	nextIncompleteTermId?: string | null;
}

interface BankAccount {
	id: string;
	name: string;
	bankName?: string | null;
	balance: unknown;
	isActive: boolean;
	[key: string]: unknown;
}

export interface SubcontractPaymentSectionProps {
	payments: Payment[] | null | undefined;
	termsProgress: TermsProgressData | null | undefined;
	accounts: BankAccount[];
	approvedClaims?: ApprovedClaim[];
	claimsLookup?: Map<string, number>;
	totalPaid: number;
	remaining: number;
	adjustedValue: number;
	progress: number;
	isOverBudget: boolean;
	onSubmitPayment: (data: {
		amount: number;
		date: string;
		sourceAccountId: string;
		paymentMethod: string;
		referenceNo: string;
		description: string;
		termId: string;
		claimId?: string;
	}) => void;
	isSubmittingPayment: boolean;
}

export const SubcontractPaymentSection = React.memo(function SubcontractPaymentSection({
	payments,
	termsProgress,
	accounts,
	approvedClaims,
	claimsLookup,
	totalPaid,
	remaining,
	progress,
	isOverBudget,
	onSubmitPayment,
	isSubmittingPayment,
}: SubcontractPaymentSectionProps) {
	const t = useTranslations();

	const [paymentSearch, setPaymentSearch] = useState("");
	const [paymentSortBy, setPaymentSortBy] = useState<"date" | "amount" | "term">("date");
	const [paymentSortOrder, setPaymentSortOrder] = useState<"asc" | "desc">("desc");
	const [showPaymentForm, setShowPaymentForm] = useState(false);

	// Build a claimId → claimNo lookup for badge display
	// Uses claimsLookup (all claims) if provided, otherwise falls back to approvedClaims
	const claimMap = useMemo(() => {
		if (claimsLookup) return claimsLookup;
		const map = new Map<string, number>();
		if (approvedClaims) {
			for (const c of approvedClaims) {
				map.set(c.id, c.claimNo);
			}
		}
		return map;
	}, [claimsLookup, approvedClaims]);

	// Filter & sort payments
	const filteredPayments = useMemo(() => {
		const list = payments ?? [];
		let result = list;

		if (paymentSearch.trim()) {
			const q = paymentSearch.trim().toLowerCase();
			result = result.filter(
				(p) =>
					p.paymentNo?.toLowerCase().includes(q) ||
					p.referenceNo?.toLowerCase().includes(q) ||
					p.description?.toLowerCase().includes(q) ||
					p.term?.label?.toLowerCase().includes(q) ||
					p.sourceAccount?.name?.toLowerCase().includes(q) ||
					String(p.amount).includes(q),
			);
		}

		result = [...result].sort((a, b) => {
			if (paymentSortBy === "amount") {
				return paymentSortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount;
			}
			if (paymentSortBy === "term") {
				const aLabel = a.term?.label ?? "";
				const bLabel = b.term?.label ?? "";
				return paymentSortOrder === "desc"
					? bLabel.localeCompare(aLabel, "ar")
					: aLabel.localeCompare(bLabel, "ar");
			}
			const aDate = new Date(a.date).getTime();
			const bDate = new Date(b.date).getTime();
			return paymentSortOrder === "desc" ? bDate - aDate : aDate - bDate;
		});

		return result;
	}, [payments, paymentSearch, paymentSortBy, paymentSortOrder]);

	return (
		<>
			{/* Payments Table */}
			<div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-700/30 dark:bg-slate-900/50">
				<div className="flex flex-col gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="rounded-lg bg-sky-100 p-2 dark:bg-sky-900/30">
								<Banknote className="h-5 w-5 text-sky-600 dark:text-sky-400" />
							</div>
							<div>
								<h2 className="font-semibold text-slate-800 dark:text-slate-200">
									{t("subcontracts.detail.paymentsHistory")}
								</h2>
								<p className="text-xs text-slate-500">
									{payments?.length ?? 0} {t("subcontracts.detail.paymentsCount")}
								</p>
							</div>
						</div>
						<Button
							size="sm"
							className="rounded-xl bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600"
							onClick={() => setShowPaymentForm(!showPaymentForm)}
						>
							<Plus className="ml-1.5 h-4 w-4" />
							{t("subcontracts.detail.addPayment")}
						</Button>
					</div>

					{/* Search + Sort bar */}
					{(payments?.length ?? 0) > 0 && (
						<div className="flex items-center gap-2">
							<div className="relative max-w-xs flex-1">
								<Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
								<Input
									placeholder={t("subcontracts.detail.searchPayments")}
									value={paymentSearch}
									onChange={(e) => setPaymentSearch(e.target.value)}
									className="h-8 rounded-lg ps-9 text-xs"
								/>
							</div>
							<div className="flex items-center gap-1">
								{(["date", "amount", "term"] as const).map((field) => (
									<Button
										key={field}
										variant={paymentSortBy === field ? "primary" : "outline"}
										size="sm"
										className={`h-8 rounded-lg px-2.5 text-[11px] ${
											paymentSortBy === field
												? "bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300"
												: ""
										}`}
										onClick={() => {
											if (paymentSortBy === field) {
												setPaymentSortOrder((o) => (o === "desc" ? "asc" : "desc"));
											} else {
												setPaymentSortBy(field);
												setPaymentSortOrder("desc");
											}
										}}
									>
										<ArrowUpDown className="me-1 h-3 w-3" />
										{t(`subcontracts.detail.sortBy${field.charAt(0).toUpperCase() + field.slice(1)}`)}
									</Button>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Payments table body */}
				{filteredPayments.length > 0 ? (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="text-start">#</TableHead>
									<TableHead className="text-start">{t("subcontracts.payment.date")}</TableHead>
									<TableHead className="text-start">{t("subcontracts.payment.amount")}</TableHead>
									<TableHead className="text-start">{t("subcontracts.payment.paymentMethod")}</TableHead>
									<TableHead className="text-start">{t("subcontracts.payment.selectTerm")}</TableHead>
									<TableHead className="text-start">{t("claims.linkToClaim")}</TableHead>
									<TableHead className="text-start">{t("subcontracts.payment.sourceAccount")}</TableHead>
									<TableHead className="text-start">{t("subcontracts.payment.referenceNo")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredPayments.map((payment) => (
									<TableRow key={payment.id}>
										<TableCell className="font-mono text-xs text-slate-500">
											{payment.paymentNo}
										</TableCell>
										<TableCell className="text-sm">
											{format(new Date(payment.date), "dd/MM/yyyy", { locale: ar })}
										</TableCell>
										<TableCell className="font-semibold text-red-600 dark:text-red-400">
											{formatCurrency(payment.amount)}
										</TableCell>
										<TableCell className="text-xs">
											{payment.paymentMethod
												? t(`subcontracts.paymentMethods.${payment.paymentMethod}`)
												: "-"}
										</TableCell>
										<TableCell>
											{payment.term ? (
												<Badge variant="outline" className="rounded-lg text-[10px]">
													{payment.term.label || t(`subcontracts.termTypes.${payment.term.type}`)}
												</Badge>
											) : (
												<span className="text-xs text-slate-400">-</span>
											)}
										</TableCell>
										<TableCell>
											{payment.claimId && claimMap.has(payment.claimId) ? (
												<Badge variant="secondary" className="rounded-lg text-[10px]">
													{t("claims.linkedToClaim", { claimNo: String(claimMap.get(payment.claimId) ?? 0) })}
												</Badge>
											) : (
												<span className="text-xs text-slate-400">-</span>
											)}
										</TableCell>
										<TableCell className="text-xs text-slate-500">
											{payment.sourceAccount?.name ?? "-"}
										</TableCell>
										<TableCell className="font-mono text-xs text-slate-500" dir="ltr">
											{payment.referenceNo ?? "-"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>

						{/* Totals row */}
						<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
							<span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
								{t("subcontracts.detail.paymentsTotalLabel")}
							</span>
							<div className="flex items-center gap-6 text-sm">
								<span>
									<span className="text-slate-500">{t("subcontracts.detail.totalPaid")}: </span>
									<span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(totalPaid)}</span>
								</span>
								<span>
									<span className="text-slate-500">{t("subcontracts.detail.remaining")}: </span>
									<span className={`font-bold ${isOverBudget ? "text-red-600" : "text-sky-600"}`}>{formatCurrency(remaining)}</span>
								</span>
							</div>
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-10 text-center">
						<div className="mb-3 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
							{paymentSearch ? (
								<Search className="h-8 w-8 text-slate-400" />
							) : (
								<Banknote className="h-8 w-8 text-slate-400" />
							)}
						</div>
						<p className="text-sm text-slate-500">
							{paymentSearch
								? t("subcontracts.detail.noSearchResults")
								: t("subcontracts.detail.noPayments")}
						</p>
					</div>
				)}

				{/* Inline Payment Form */}
				{showPaymentForm && (
					<SubcontractInlinePaymentForm
						termsProgress={termsProgress}
						accounts={accounts}
						remaining={remaining}
						approvedClaims={approvedClaims}
						onSubmit={onSubmitPayment}
						onCancel={() => setShowPaymentForm(false)}
						isSubmitting={isSubmittingPayment}
					/>
				)}
			</div>

			{/* Payment Terms Progress */}
			{termsProgress && termsProgress.terms.length > 0 && (
				<SubcontractPaymentTermsProgress
					termsProgress={termsProgress}
					progress={progress}
				/>
			)}
		</>
	);
});
