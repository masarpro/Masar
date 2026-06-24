"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
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
	percent: number | null;
	amount: number | null;
	dueDate?: string | Date | null;
}

interface EditPaymentTermDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	projectId: string;
	contractValue: number;
	term: Term;
}

const TERM_TYPES = [
	"ADVANCE",
	"MILESTONE",
	"MONTHLY",
	"COMPLETION",
	"CUSTOM",
] as const;

function toDateInputValue(date: string | Date | null | undefined): string {
	if (!date) return "";
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toISOString().split("T")[0];
}

export function EditPaymentTermDialog({
	open,
	onOpenChange,
	organizationId,
	projectId,
	contractValue,
	term,
}: EditPaymentTermDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [type, setType] = useState(term.type);
	const [label, setLabel] = useState(term.label ?? "");
	const [percent, setPercent] = useState(term.percent?.toString() ?? "");
	const [amount, setAmount] = useState(term.amount?.toString() ?? "");
	const [dueDate, setDueDate] = useState(toDateInputValue(term.dueDate));

	const updateMutation = useMutation({
		...orpc.projectContract.updatePaymentTerm.mutationOptions(),
		onSuccess: () => {
			toast.success(t("projectPayments.termUpdated"));
			queryClient.invalidateQueries({
				queryKey: orpc.projectPayments.key(),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.projectContract.key(),
			});
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message || t("projectPayments.termUpdateError"));
		},
	});

	// Keep percent ↔ amount in sync against the contract value
	function handlePercentChange(value: string) {
		setPercent(value);
		if (contractValue > 0) {
			const pct = Number.parseFloat(value);
			setAmount(
				!Number.isNaN(pct) && value !== ""
					? ((contractValue * pct) / 100).toFixed(2)
					: "",
			);
		}
	}

	function handleAmountChange(value: string) {
		setAmount(value);
		if (contractValue > 0) {
			const amt = Number.parseFloat(value);
			setPercent(
				!Number.isNaN(amt) && value !== ""
					? ((amt / contractValue) * 100).toFixed(2)
					: "",
			);
		}
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		const parsedAmount = amount ? Number.parseFloat(amount) : null;
		const parsedPercent = percent ? Number.parseFloat(percent) : null;

		if (parsedAmount == null && parsedPercent == null) {
			toast.error(t("projectPayments.termAmountOrPercentRequired"));
			return;
		}

		updateMutation.mutate({
			organizationId,
			projectId,
			termId: term.id,
			type: type as
				| "ADVANCE"
				| "MILESTONE"
				| "MONTHLY"
				| "COMPLETION"
				| "CUSTOM",
			label: label || null,
			percent: parsedPercent,
			amount: parsedAmount,
			dueDate: dueDate ? new Date(dueDate) : null,
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{t("projectPayments.editTerm")}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Type */}
					<div className="space-y-2">
						<Label>{t("projectPayments.termType")}</Label>
						<Select value={type} onValueChange={setType}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{TERM_TYPES.map((value) => (
									<SelectItem key={value} value={value}>
										{t(`projectPayments.termTypes.${value}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Label */}
					<div className="space-y-2">
						<Label>{t("projectPayments.termLabel")}</Label>
						<Input
							value={label}
							onChange={(e: any) => setLabel(e.target.value)}
							placeholder={t("projectPayments.termLabelPlaceholder")}
						/>
					</div>

					{/* Percent + Amount */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label>{t("projectPayments.termPercent")}</Label>
							<Input
								type="number"
								step="0.01"
								min="0"
								max="100"
								value={percent}
								onChange={(e: any) =>
									handlePercentChange(e.target.value)
								}
								placeholder="%"
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("projectPayments.amount")}</Label>
							<Input
								type="number"
								step="0.01"
								min="0"
								value={amount}
								onChange={(e: any) =>
									handleAmountChange(e.target.value)
								}
								placeholder="0"
							/>
						</div>
					</div>

					{/* Due Date */}
					<div className="space-y-2">
						<Label>{t("projectPayments.termDueDate")}</Label>
						<Input
							type="date"
							value={dueDate}
							onChange={(e: any) => setDueDate(e.target.value)}
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
								<Loader2 className="ms-1.5 h-4 w-4 animate-spin" />
							) : (
								<Save className="ms-1.5 h-4 w-4" />
							)}
							{t("common.save")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
