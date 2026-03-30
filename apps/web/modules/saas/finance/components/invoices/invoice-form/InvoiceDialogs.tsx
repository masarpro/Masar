"use client";

import { useTranslations } from "next-intl";
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
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@ui/components/dialog";
import { Eye, Plus } from "lucide-react";
import { InlineClientForm } from "../../clients/InlineClientForm";
import type { Client } from "../../shared/ClientSelector";

// ─── Preview Dialog ──────────────────────────────────────────

interface PreviewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function PreviewDialog({ open, onOpenChange }: PreviewDialogProps) {
	const t = useTranslations();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-0 rounded-2xl">
				<DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
					<DialogTitle className="flex items-center gap-2">
						<Eye className="h-5 w-5" />
						{t("finance.actions.preview")}
					</DialogTitle>
				</DialogHeader>
				<div className="bg-slate-100 dark:bg-slate-900 p-4 min-h-[60vh]">
					<div className="bg-white dark:bg-card rounded-xl shadow-lg overflow-hidden p-8">
						<div className="text-center text-muted-foreground py-16">{t("finance.invoices.previewAvailableAfterSave")}</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Issue Confirmation Dialog ──────────────────────────────

interface IssueConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function IssueConfirmDialog({ open, onOpenChange, onConfirm }: IssueConfirmDialogProps) {
	const t = useTranslations();

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="rounded-2xl">
				<AlertDialogHeader>
					<AlertDialogTitle>{t("finance.invoices.issueConfirmTitle")}</AlertDialogTitle>
					<AlertDialogDescription>{t("finance.invoices.issueConfirmDescription")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} className="rounded-xl">{t("finance.invoices.issueConfirmButton")}</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

// ─── New Client Dialog ──────────────────────────────────────

interface NewClientDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	onClientCreated: (client: Client) => void;
}

export function NewClientDialog({ open, onOpenChange, organizationId, onClientCreated }: NewClientDialogProps) {
	const t = useTranslations();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t("finance.clients.addClient")}</DialogTitle>
				</DialogHeader>
				<InlineClientForm
					organizationId={organizationId}
					onSuccess={(client) => { onClientCreated(client); onOpenChange(false); }}
					onCancel={() => onOpenChange(false)}
				/>
			</DialogContent>
		</Dialog>
	);
}

// ─── Add Payment Dialog ─────────────────────────────────────

interface AddPaymentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	remainingAmount: number;
	paymentAmount: string;
	paymentDate: string;
	paymentMethod: string;
	paymentReference: string;
	paymentNotes: string;
	isPending: boolean;
	onPaymentAmountChange: (value: string) => void;
	onPaymentDateChange: (value: string) => void;
	onPaymentMethodChange: (value: string) => void;
	onPaymentReferenceChange: (value: string) => void;
	onPaymentNotesChange: (value: string) => void;
	onSubmit: () => void;
}

export function AddPaymentDialog({
	open,
	onOpenChange,
	remainingAmount,
	paymentAmount,
	paymentDate,
	paymentMethod,
	paymentReference,
	paymentNotes,
	isPending,
	onPaymentAmountChange,
	onPaymentDateChange,
	onPaymentMethodChange,
	onPaymentReferenceChange,
	onPaymentNotesChange,
	onSubmit,
}: AddPaymentDialogProps) {
	const t = useTranslations();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md rounded-2xl">
				<DialogHeader>
					<DialogTitle>{t("finance.invoices.addPayment")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<Label>{t("finance.invoices.paymentAmount")} *</Label>
						<Input
							type="number"
							step="0.01"
							min="0"
							max={remainingAmount}
							value={paymentAmount}
							onChange={(e) => onPaymentAmountChange(e.target.value)}
							placeholder={t("finance.invoices.maxAmount")}
							className="rounded-xl mt-1"
						/>
					</div>
					<div>
						<Label>{t("finance.invoices.paymentDate")} *</Label>
						<Input
							type="date"
							value={paymentDate}
							onChange={(e) => onPaymentDateChange(e.target.value)}
							className="rounded-xl mt-1"
						/>
					</div>
					<div>
						<Label>{t("finance.invoices.paymentMethod")}</Label>
						<Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
							<SelectTrigger className="rounded-xl mt-1">
								<SelectValue placeholder={t("finance.invoices.selectPaymentMethod")} />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="CASH">{t("finance.paymentMethods.cash")}</SelectItem>
								<SelectItem value="BANK_TRANSFER">{t("finance.paymentMethods.bankTransfer")}</SelectItem>
								<SelectItem value="CHECK">{t("finance.paymentMethods.check")}</SelectItem>
								<SelectItem value="CREDIT_CARD">{t("finance.paymentMethods.creditCard")}</SelectItem>
								<SelectItem value="OTHER">{t("finance.paymentMethods.other")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label>{t("finance.invoices.referenceNo")}</Label>
						<Input
							value={paymentReference}
							onChange={(e) => onPaymentReferenceChange(e.target.value)}
							placeholder={t("finance.invoices.referenceNoPlaceholder")}
							className="rounded-xl mt-1"
						/>
					</div>
					<div>
						<Label>{t("finance.invoices.paymentNotes")}</Label>
						<Textarea
							value={paymentNotes}
							onChange={(e) => onPaymentNotesChange(e.target.value)}
							rows={2}
							className="rounded-xl mt-1"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
						{t("common.cancel")}
					</Button>
					<Button
						onClick={onSubmit}
						disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || isPending}
						className="rounded-xl"
					>
						<Plus className="h-4 w-4 me-2" />
						{isPending ? t("common.saving") : t("finance.invoices.addPayment")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ─── Delete Payment Confirmation ────────────────────────────

interface DeletePaymentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isPending: boolean;
	onConfirm: () => void;
}

export function DeletePaymentDialog({ open, onOpenChange, isPending, onConfirm }: DeletePaymentDialogProps) {
	const t = useTranslations();

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="rounded-2xl">
				<AlertDialogHeader>
					<AlertDialogTitle>{t("finance.invoices.deletePaymentTitle")}</AlertDialogTitle>
					<AlertDialogDescription>{t("finance.invoices.deletePaymentDescription")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={isPending}
						className="rounded-xl bg-red-600 hover:bg-red-700"
					>
						{isPending ? t("common.deleting") : t("common.delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
