"use client";

import React, { useState, useMemo } from "react";
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
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { formatCurrency, PAYMENT_METHODS } from "./subcontract-shared";

interface TermProgress {
	id: string;
	label?: string | null;
	type: string;
	remainingAmount: number;
	isComplete: boolean;
}

interface TermsProgressData {
	terms: TermProgress[];
}

interface BankAccount {
	id: string;
	name: string;
	bankName?: string | null;
	balance: unknown;
	isActive: boolean;
	[key: string]: unknown;
}

export interface SubcontractInlinePaymentFormProps {
	termsProgress: TermsProgressData | null | undefined;
	accounts: BankAccount[];
	remaining: number;
	onSubmit: (data: {
		amount: number;
		date: string;
		sourceAccountId: string;
		paymentMethod: string;
		referenceNo: string;
		description: string;
		termId: string;
	}) => void;
	onCancel: () => void;
	isSubmitting: boolean;
}

export const SubcontractInlinePaymentForm = React.memo(function SubcontractInlinePaymentForm({
	termsProgress,
	accounts,
	remaining,
	onSubmit,
	onCancel,
	isSubmitting,
}: SubcontractInlinePaymentFormProps) {
	const t = useTranslations();

	const [payAmount, setPayAmount] = useState("");
	const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
	const [paySourceAccountId, setPaySourceAccountId] = useState("");
	const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
	const [payReferenceNo, setPayReferenceNo] = useState("");
	const [payDescription, setPayDescription] = useState("");
	const [payTermId, setPayTermId] = useState("");

	const selectedPayAccount = useMemo(
		() => accounts.find((a) => a.id === paySourceAccountId),
		[accounts, paySourceAccountId],
	);

	function resetForm() {
		setPayAmount("");
		setPayDate(new Date().toISOString().split("T")[0]);
		setPaySourceAccountId("");
		setPayMethod("BANK_TRANSFER");
		setPayReferenceNo("");
		setPayDescription("");
		setPayTermId("");
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		onSubmit({
			amount: Number.parseFloat(payAmount) || 0,
			date: payDate,
			sourceAccountId: paySourceAccountId,
			paymentMethod: payMethod,
			referenceNo: payReferenceNo,
			description: payDescription,
			termId: payTermId,
		});
		resetForm();
	}

	return (
		<div className="border-t border-sky-200 bg-sky-50/50 p-5 dark:border-sky-800/30 dark:bg-sky-950/10">
			<form onSubmit={handleSubmit} className="space-y-4">
				<h3 className="text-sm font-semibold text-sky-700 dark:text-sky-300">
					{t("subcontracts.detail.newPaymentForm")}
				</h3>

				{/* Over budget warning in form */}
				{payAmount && (Number.parseFloat(payAmount) || 0) > remaining && remaining > 0 && (
					<div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800/50 dark:bg-red-950/20 dark:text-red-400">
						<AlertTriangle className="h-3.5 w-3.5 shrink-0" />
						{t("subcontracts.detail.alerts.paymentExceedsRemaining")}
					</div>
				)}

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
					{/* Amount */}
					<div className="space-y-1.5">
						<Label className="text-xs">{t("subcontracts.payment.amount")} *</Label>
						<div className="relative">
							<Input
								type="number"
								step="0.01"
								min="0"
								value={payAmount}
								onChange={(e) => setPayAmount(e.target.value)}
								placeholder="0.00"
								className="rounded-lg pl-12"
								dir="ltr"
								required
							/>
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
								ر.س
							</span>
						</div>
					</div>

					{/* Date */}
					<div className="space-y-1.5">
						<Label className="text-xs">{t("subcontracts.payment.date")} *</Label>
						<Input
							type="date"
							value={payDate}
							onChange={(e) => setPayDate(e.target.value)}
							className="rounded-lg"
							required
						/>
					</div>

					{/* Payment Method */}
					<div className="space-y-1.5">
						<Label className="text-xs">{t("subcontracts.payment.paymentMethod")}</Label>
						<Select value={payMethod} onValueChange={setPayMethod}>
							<SelectTrigger className="rounded-lg text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PAYMENT_METHODS.map((method) => (
									<SelectItem key={method} value={method}>
										{t(`subcontracts.paymentMethods.${method}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Source Account */}
					<div className="space-y-1.5">
						<Label className="text-xs">{t("subcontracts.payment.sourceAccount")}</Label>
						<Select value={paySourceAccountId} onValueChange={setPaySourceAccountId}>
							<SelectTrigger className="rounded-lg text-xs">
								<SelectValue placeholder={t("subcontracts.payment.selectAccount")} />
							</SelectTrigger>
							<SelectContent>
								{accounts
									.filter((a) => a.isActive)
									.map((account) => (
										<SelectItem key={account.id} value={account.id}>
											{account.name}
											{account.bankName && ` - ${account.bankName}`}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					{/* Payment Term */}
					{termsProgress && termsProgress.terms.length > 0 && (
						<div className="space-y-1.5">
							<Label className="text-xs">{t("subcontracts.payment.selectTerm")}</Label>
							<Select
								value={payTermId || "_none"}
								onValueChange={(v) => {
									const actualValue = v === "_none" ? "" : v;
									setPayTermId(actualValue);
									if (actualValue) {
										const term = termsProgress.terms.find((tt) => tt.id === actualValue);
										if (term && !payAmount) {
											setPayAmount(String(Math.max(0, term.remainingAmount)));
										}
									}
								}}
							>
								<SelectTrigger className="rounded-lg text-xs">
									<SelectValue placeholder={t("subcontracts.payment.selectTermPlaceholder")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="_none">{t("subcontracts.payment.noTerm")}</SelectItem>
									{termsProgress.terms
										.filter((tt) => !tt.isComplete)
										.map((tt) => (
											<SelectItem key={tt.id} value={tt.id}>
												{tt.label || tt.type} - {t("subcontracts.payment.remaining")}: {formatCurrency(tt.remainingAmount)}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* Reference */}
					<div className="space-y-1.5">
						<Label className="text-xs">{t("subcontracts.payment.referenceNo")}</Label>
						<Input
							value={payReferenceNo}
							onChange={(e) => setPayReferenceNo(e.target.value)}
							className="rounded-lg"
							dir="ltr"
						/>
					</div>

					{/* Description */}
					<div className="space-y-1.5">
						<Label className="text-xs">{t("subcontracts.payment.description")}</Label>
						<Input
							value={payDescription}
							onChange={(e) => setPayDescription(e.target.value)}
							className="rounded-lg"
						/>
					</div>
				</div>

				{/* Selected account balance info */}
				{selectedPayAccount && (
					<div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs dark:border-slate-700 dark:bg-slate-800">
						<span className="text-slate-500">
							{selectedPayAccount.name}: {formatCurrency(Number(selectedPayAccount.balance))}
						</span>
						{payAmount && (
							<span className="text-slate-500">
								&larr; {formatCurrency(Number(selectedPayAccount.balance) - (Number.parseFloat(payAmount) || 0))}
							</span>
						)}
					</div>
				)}

				{/* Actions */}
				<div className="flex items-center justify-end gap-2">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="rounded-lg"
						onClick={() => {
							resetForm();
							onCancel();
						}}
					>
						{t("common.cancel")}
					</Button>
					<Button
						type="submit"
						size="sm"
						className="rounded-lg bg-sky-600 text-white hover:bg-sky-700"
						disabled={isSubmitting}
					>
						{isSubmitting ? (
							<Loader2 className="me-1.5 h-4 w-4 animate-spin" />
						) : (
							<Save className="me-1.5 h-4 w-4" />
						)}
						{t("subcontracts.payment.submit")}
					</Button>
				</div>
			</form>
		</div>
	);
});
