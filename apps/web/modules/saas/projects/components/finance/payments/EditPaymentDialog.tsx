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

interface Payment {
	id: string;
	paymentNo: string;
	amount: number;
	date: string | Date;
	paymentMethod: string;
	referenceNo?: string | null;
	description?: string | null;
	note?: string | null;
	destinationAccount?: { id: string; name: string } | null;
}

interface EditPaymentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	projectId: string;
	payment: Payment;
}

const PAYMENT_METHODS = [
	{ value: "BANK_TRANSFER", label: "تحويل بنكي" },
	{ value: "CASH", label: "نقدي" },
	{ value: "CHEQUE", label: "شيك" },
	{ value: "CREDIT_CARD", label: "بطاقة ائتمان" },
	{ value: "OTHER", label: "أخرى" },
] as const;

export function EditPaymentDialog({
	open,
	onOpenChange,
	organizationId,
	projectId,
	payment,
}: EditPaymentDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const dateStr = typeof payment.date === "string"
		? payment.date.split("T")[0]
		: new Date(payment.date).toISOString().split("T")[0];

	const [amount, setAmount] = useState(String(payment.amount));
	const [date, setDate] = useState(dateStr);
	const [paymentMethod, setPaymentMethod] = useState(payment.paymentMethod);
	const [referenceNo, setReferenceNo] = useState(payment.referenceNo ?? "");
	const [description, setDescription] = useState(payment.description ?? "");
	const [destinationAccountId, setDestinationAccountId] = useState(
		payment.destinationAccount?.id ?? "",
	);
	const [note, setNote] = useState(payment.note ?? "");

	const { data: bankAccounts } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId },
		}),
	);

	const accounts = bankAccounts?.accounts ?? [];

	const updateMutation = useMutation({
		...orpc.projectPayments.update.mutationOptions(),
		onSuccess: () => {
			toast.success(t("projectPayments.paymentUpdated"));
			queryClient.invalidateQueries({ queryKey: ["projectPayments"] });
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message || t("projectPayments.updateError"));
		},
	});

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const parsedAmount = parseFloat(amount);
		if (!parsedAmount || parsedAmount <= 0) {
			toast.error(t("projectPayments.invalidAmount"));
			return;
		}

		updateMutation.mutate({
			organizationId,
			projectId,
			paymentId: payment.id,
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
					<DialogTitle>
						{t("projectPayments.editPayment")} - {payment.paymentNo}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Amount */}
					<div className="space-y-2">
						<Label>{t("projectPayments.amount")} *</Label>
						<Input
							type="number"
							step="0.01"
							min="0.01"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							required
						/>
					</div>

					{/* Date */}
					<div className="space-y-2">
						<Label>{t("projectPayments.date")} *</Label>
						<Input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
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
								{PAYMENT_METHODS.map((m) => (
									<SelectItem key={m.value} value={m.value}>
										{m.label}
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
							onChange={(e) => setReferenceNo(e.target.value)}
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
									{accounts.map((account) => (
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
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					{/* Note */}
					<div className="space-y-2">
						<Label>{t("projectPayments.note")}</Label>
						<Textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
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
							disabled={updateMutation.isPending}
							className="bg-sky-600 hover:bg-sky-700"
						>
							{updateMutation.isPending ? (
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
