"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface Term {
	id: string;
	type: string;
	label: string | null;
	amount: number | null;
	paidAmount: number;
	status: string;
}

interface CreatePaymentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	projectId: string;
	terms: Term[];
	hasContract: boolean;
}

const PAYMENT_METHOD_VALUES = [
	"BANK_TRANSFER",
	"CASH",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
] as const;

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function CreatePaymentDialog({
	open,
	onOpenChange,
	organizationId,
	projectId,
	terms,
	hasContract,
}: CreatePaymentDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [contractTermId, setContractTermId] = useState<string>("");
	const [amount, setAmount] = useState("");
	const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
	const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
	const [referenceNo, setReferenceNo] = useState("");
	const [description, setDescription] = useState("");
	const [destinationAccountId, setDestinationAccountId] = useState<string>("");
	const [note, setNote] = useState("");

	const { data: bankAccounts } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId },
		}),
	);

	const accounts = bankAccounts?.accounts ?? [];

	const createMutation = useMutation({
		...orpc.projectPayments.create.mutationOptions(),
		onSuccess: () => {
			toast.success(t("projectPayments.paymentCreated"));
			queryClient.invalidateQueries({ queryKey: ["projectPayments"] });
			resetForm();
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message || t("projectPayments.createError"));
		},
	});

	function resetForm() {
		setContractTermId("");
		setAmount("");
		setDate(new Date().toISOString().split("T")[0]);
		setPaymentMethod("BANK_TRANSFER");
		setReferenceNo("");
		setDescription("");
		setDestinationAccountId("");
		setNote("");
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const parsedAmount = parseFloat(amount);
		if (!parsedAmount || parsedAmount <= 0) {
			toast.error(t("projectPayments.invalidAmount"));
			return;
		}

		createMutation.mutate({
			organizationId,
			projectId,
			contractTermId: contractTermId || null,
			amount: parsedAmount,
			date: new Date(date),
			paymentMethod: paymentMethod as "CASH" | "BANK_TRANSFER" | "CHEQUE" | "CREDIT_CARD" | "OTHER",
			referenceNo: referenceNo || null,
			description: description || null,
			destinationAccountId: destinationAccountId || null,
			note: note || null,
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{t("projectPayments.newPayment")}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Contract Term (optional) */}
					{hasContract && terms.length > 0 && (
						<div className="space-y-2">
							<Label>{t("projectPayments.selectTerm")}</Label>
							<Select value={contractTermId} onValueChange={setContractTermId}>
								<SelectTrigger>
									<SelectValue placeholder={t("projectPayments.freePayment")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="free">{t("projectPayments.freePayment")}</SelectItem>
									{terms
										.filter((term) => term.status !== "FULLY_PAID")
										.map((term) => (
											<SelectItem key={term.id} value={term.id}>
												{term.label ?? t(`projectPayments.termTypes.${term.type}`)}
												{term.amount != null && (
													<span className="text-xs text-slate-500">
														{" "}
														({formatCurrency(term.paidAmount)} / {formatCurrency(term.amount)})
													</span>
												)}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* Amount */}
					<div className="space-y-2">
						<Label>{t("projectPayments.amount")} *</Label>
						<Input
							type="number"
							step="0.01"
							min="0.01"
							value={amount}
							onChange={(e: any) => setAmount(e.target.value)}
							placeholder="0.00"
							required
						/>
					</div>

					{/* Date */}
					<div className="space-y-2">
						<Label>{t("projectPayments.date")} *</Label>
						<Input
							type="date"
							value={date}
							onChange={(e: any) => setDate(e.target.value)}
							required
						/>
					</div>

					{/* Payment Method */}
					<div className="space-y-2">
						<Label>{t("projectPayments.method")}</Label>
						<Select value={paymentMethod} onValueChange={setPaymentMethod}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PAYMENT_METHOD_VALUES.map((value) => (
									<SelectItem key={value} value={value}>
										{t(`projectPayments.paymentMethods.${value}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Reference No */}
					<div className="space-y-2">
						<Label>{t("projectPayments.referenceNo")}</Label>
						<Input
							value={referenceNo}
							onChange={(e: any) => setReferenceNo(e.target.value)}
							placeholder={t("projectPayments.referenceNoPlaceholder")}
						/>
					</div>

					{/* Destination Account */}
					{accounts.length > 0 && (
						<div className="space-y-2">
							<Label>{t("projectPayments.destinationAccount")}</Label>
							<Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
								<SelectTrigger>
									<SelectValue placeholder={t("projectPayments.selectAccount")} />
								</SelectTrigger>
								<SelectContent>
									{accounts.map((account: any) => (
										<SelectItem key={account.id} value={account.id}>
											{account.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* Description */}
					<div className="space-y-2">
						<Label>{t("projectPayments.description")}</Label>
						<Input
							value={description}
							onChange={(e: any) => setDescription(e.target.value)}
							placeholder={t("projectPayments.descriptionPlaceholder")}
						/>
					</div>

					{/* Note */}
					<div className="space-y-2">
						<Label>{t("projectPayments.note")}</Label>
						<Textarea
							value={note}
							onChange={(e: any) => setNote(e.target.value)}
							placeholder={t("projectPayments.notePlaceholder")}
							rows={2}
						/>
					</div>

					{/* Submit */}
					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("common.cancel")}
						</Button>
						<Button
							type="submit"
							disabled={createMutation.isPending}
							className="bg-sky-600 hover:bg-sky-700"
						>
							{createMutation.isPending ? (
								<Loader2 className="ml-1.5 h-4 w-4 animate-spin" />
							) : (
								<Save className="ml-1.5 h-4 w-4" />
							)}
							{t("projectPayments.savePayment")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
