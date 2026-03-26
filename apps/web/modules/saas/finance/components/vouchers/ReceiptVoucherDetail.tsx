"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
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
import { Textarea } from "@ui/components/textarea";
import { toast } from "sonner";
import {
	ArrowRight,
	Printer,
	Ban,
	Send,
	Pencil,
	FileCheck,
	Calendar,
	User,
	Building,
	CreditCard,
	Link2,
} from "lucide-react";
import { formatDate } from "@shared/lib/formatters";
import { Currency } from "../shared/Currency";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

interface ReceiptVoucherDetailProps {
	organizationId: string;
	organizationSlug: string;
	voucherId: string;
}

const STATUS_COLORS: Record<string, string> = {
	DRAFT: "bg-gray-100 text-gray-700",
	ISSUED: "bg-green-100 text-green-700",
	CANCELLED: "bg-red-100 text-red-700",
};

export function ReceiptVoucherDetail({
	organizationId,
	organizationSlug,
	voucherId,
}: ReceiptVoucherDetailProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [cancelReason, setCancelReason] = useState("");
	const [showIssueDialog, setShowIssueDialog] = useState(false);

	const basePath = `/app/${organizationSlug}/finance/receipt-vouchers`;

	const { data: rawVoucher, isLoading } = useQuery(
		orpc.finance.receipts.getById.queryOptions({
			input: { organizationId, id: voucherId },
		}),
	);
	const voucher = rawVoucher as any;

	const issueMutation = useMutation({
		mutationFn: () =>
			orpcClient.finance.receipts.issue({ organizationId, id: voucherId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["finance", "receipts"] });
			toast.success(t("finance.receiptVouchers.actions.issue"));
			setShowIssueDialog(false);
		},
		onError: () => toast.error(t("common.error")),
	});

	const cancelMutation = useMutation({
		mutationFn: () =>
			orpcClient.finance.receipts.cancel({
				organizationId,
				id: voucherId,
				cancelReason,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["finance", "receipts"] });
			toast.success(t("finance.receiptVouchers.actions.cancel"));
			setShowCancelDialog(false);
			setCancelReason("");
		},
		onError: () => toast.error(t("common.error")),
	});

	const printMutation = useMutation({
		mutationFn: () =>
			orpcClient.finance.receipts.print({ organizationId, id: voucherId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["finance", "receipts"] });
			window.print();
		},
	});

	if (isLoading || !voucher) {
		return <ListTableSkeleton rows={6} cols={2} />;
	}

	const isManual = !voucher.paymentId && !voucher.invoicePaymentId && !voucher.projectPaymentId;

	return (
		<div className="space-y-6">
			{/* ═══ Print-only formal receipt voucher ═══ */}
			<div className="hidden print:block print:space-y-4">
				<div className="text-center border-b-2 border-black pb-3 mb-4">
					<h1 className="text-2xl font-bold">{t("print.receiptVoucher")}</h1>
					<p className="text-sm text-gray-500">RECEIPT VOUCHER</p>
				</div>
				<div className="flex justify-between text-sm mb-4">
					<div><span className="font-medium">{t("finance.receiptVouchers.voucherNo")}:</span> <span className="font-mono">{voucher.voucherNo}</span></div>
					<div><span className="font-medium">{t("finance.receiptVouchers.date")}:</span> {formatDate(voucher.date)}</div>
				</div>
				<table className="w-full border-collapse text-sm">
					<tbody>
						<tr className="border border-gray-400">
							<td className="p-2 font-medium bg-gray-50 w-1/4 border-e border-gray-400">{t("finance.receiptVouchers.receivedFrom")}</td>
							<td className="p-2">{voucher.receivedFrom}</td>
						</tr>
						<tr className="border border-gray-400">
							<td className="p-2 font-medium bg-gray-50 border-e border-gray-400">{t("finance.receiptVouchers.amount")}</td>
							<td className="p-2 font-bold text-lg">{new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR" }).format(Number(voucher.amount))}</td>
						</tr>
						{voucher.amountInWords && (
							<tr className="border border-gray-400">
								<td className="p-2 font-medium bg-gray-50 border-e border-gray-400">{t("finance.receiptVouchers.amountInWords")}</td>
								<td className="p-2 font-medium">{voucher.amountInWords} {t("print.only")}</td>
							</tr>
						)}
						<tr className="border border-gray-400">
							<td className="p-2 font-medium bg-gray-50 border-e border-gray-400">{t("finance.receiptVouchers.paymentMethod")}</td>
							<td className="p-2">{t(`finance.payments.methods.${voucher.paymentMethod}`)}</td>
						</tr>
						{voucher.checkNumber && (
							<tr className="border border-gray-400">
								<td className="p-2 font-medium bg-gray-50 border-e border-gray-400">{t("finance.receiptVouchers.checkNumber")}</td>
								<td className="p-2">{voucher.checkNumber}</td>
							</tr>
						)}
						{voucher.transferRef && (
							<tr className="border border-gray-400">
								<td className="p-2 font-medium bg-gray-50 border-e border-gray-400">{t("finance.receiptVouchers.transferRef")}</td>
								<td className="p-2">{voucher.transferRef}</td>
							</tr>
						)}
						{voucher.description && (
							<tr className="border border-gray-400">
								<td className="p-2 font-medium bg-gray-50 border-e border-gray-400">{t("finance.receiptVouchers.description")}</td>
								<td className="p-2">{voucher.description}</td>
							</tr>
						)}
					</tbody>
				</table>
				{/* Signature boxes */}
				<div className="mt-16 grid grid-cols-2 gap-8 text-center text-sm">
					<div>
						<div className="border-b border-black mx-8 mb-1" />
						<p>{t("print.receiver")}</p>
					</div>
					<div>
						<div className="border-b border-black mx-8 mb-1" />
						<p>{t("print.financialManager")}</p>
					</div>
				</div>
			</div>
			{/* ═══ End print-only section ═══ */}

			{/* Header — hidden on print */}
			<div className="flex items-center justify-between print:hidden">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => router.push(basePath)}
					>
						<ArrowRight className="h-4 w-4" />
					</Button>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold font-mono">
								{voucher.voucherNo}
							</h1>
							<Badge className={STATUS_COLORS[voucher.status] ?? ""}>
								{t(`finance.receiptVouchers.statuses.${voucher.status}`)}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground">
							{isManual
								? t("finance.receiptVouchers.manualVoucher")
								: t("finance.receiptVouchers.autoGenerated")}
						</p>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex gap-2">
					{voucher.status === "DRAFT" && (
						<>
							<Button
								variant="outline"
								onClick={() =>
									router.push(`${basePath}/${voucherId}`)
								}
							>
								<Pencil className="me-2 h-4 w-4" />
								{t("finance.receiptVouchers.actions.edit")}
							</Button>
							<Button onClick={() => setShowIssueDialog(true)}>
								<Send className="me-2 h-4 w-4" />
								{t("finance.receiptVouchers.actions.issue")}
							</Button>
						</>
					)}
					{voucher.status === "ISSUED" && (
						<Button variant="outline" onClick={() => printMutation.mutate()}>
							<Printer className="me-2 h-4 w-4" />
							{t("finance.receiptVouchers.actions.print")}
						</Button>
					)}
					{(voucher.status === "DRAFT" || voucher.status === "ISSUED") && (
						<Button
							variant="error"
							onClick={() => setShowCancelDialog(true)}
						>
							<Ban className="me-2 h-4 w-4" />
							{t("finance.receiptVouchers.actions.cancel")}
						</Button>
					)}
				</div>
			</div>

			{/* Main Info */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileCheck className="h-5 w-5" />
							{t("finance.receiptVouchers.receiptVoucher")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<InfoRow
							label={t("finance.receiptVouchers.date")}
							value={formatDate(voucher.date)}
							icon={<Calendar className="h-4 w-4" />}
						/>
						<InfoRow
							label={t("finance.receiptVouchers.amount")}
							value={<Currency amount={Number(voucher.amount)} />}
						/>
						{voucher.amountInWords && (
							<InfoRow
								label={t("finance.receiptVouchers.amountInWords")}
								value={voucher.amountInWords}
							/>
						)}
						<InfoRow
							label={t("finance.receiptVouchers.receivedFrom")}
							value={voucher.receivedFrom}
							icon={<User className="h-4 w-4" />}
						/>
						<InfoRow
							label={t("finance.receiptVouchers.paymentMethod")}
							value={t(`finance.payments.methods.${voucher.paymentMethod}`)}
							icon={<CreditCard className="h-4 w-4" />}
						/>
						{voucher.checkNumber && (
							<InfoRow
								label={t("finance.receiptVouchers.checkNumber")}
								value={voucher.checkNumber}
							/>
						)}
						{voucher.transferRef && (
							<InfoRow
								label={t("finance.receiptVouchers.transferRef")}
								value={voucher.transferRef}
							/>
						)}
						{voucher.destinationAccount && (
							<InfoRow
								label={t("finance.receiptVouchers.destinationAccount")}
								value={voucher.destinationAccount.name}
								icon={<Building className="h-4 w-4" />}
							/>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Link2 className="h-5 w-5" />
							{t("finance.receiptVouchers.linkedTo")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{voucher.client && (
							<InfoRow
								label={t("finance.payments.selectClient")}
								value={voucher.client.name}
							/>
						)}
						{voucher.project && (
							<InfoRow
								label={t("finance.payments.selectProject")}
								value={voucher.project.name}
							/>
						)}
						{voucher.payment && (
							<InfoRow
								label={t("finance.payments.title")}
								value={voucher.payment.paymentNo}
							/>
						)}
						{voucher.invoicePayment?.invoice && (
							<InfoRow
								label={t("finance.invoices.title")}
								value={voucher.invoicePayment.invoice.invoiceNo}
							/>
						)}
						{voucher.projectPayment && (
							<InfoRow
								label={t("finance.payments.title")}
								value={voucher.projectPayment.paymentNo}
							/>
						)}
						{voucher.description && (
							<InfoRow
								label={t("finance.receiptVouchers.description")}
								value={voucher.description}
							/>
						)}
						{voucher.notes && (
							<InfoRow
								label={t("finance.receiptVouchers.notes")}
								value={voucher.notes}
							/>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Audit Info */}
			<Card>
				<CardContent className="flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground">
					<span>
						{t("common.createdBy")}: {voucher.createdBy?.name}
					</span>
					<span>
						{t("common.createdAt")}: {formatDate(voucher.createdAt)}
					</span>
					<span>
						{t("finance.receiptVouchers.printCount")}: {voucher.printCount}
					</span>
					{voucher.status === "CANCELLED" && (
						<>
							<span className="text-red-600">
								{t("finance.receiptVouchers.cancelledAt")}:{" "}
								{voucher.cancelledAt ? formatDate(voucher.cancelledAt) : ""}
							</span>
							<span className="text-red-600">
								{t("finance.receiptVouchers.cancelReason")}: {voucher.cancelReason}
							</span>
						</>
					)}
				</CardContent>
			</Card>

			{/* Issue Dialog */}
			<AlertDialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("finance.receiptVouchers.actions.issue")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.receiptVouchers.issueConfirm")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => issueMutation.mutate()}
							disabled={issueMutation.isPending}
						>
							{t("finance.receiptVouchers.actions.issue")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Cancel Dialog */}
			<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("finance.receiptVouchers.cancelDialog.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.receiptVouchers.cancelDialog.description")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="py-4">
						<Textarea
							placeholder={t("finance.receiptVouchers.cancelDialog.reasonPlaceholder")}
							value={cancelReason}
							onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelReason(e.target.value)}
							rows={3}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => cancelMutation.mutate()}
							disabled={cancelMutation.isPending || !cancelReason.trim()}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("finance.receiptVouchers.cancelDialog.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

// Helper component for info rows
function InfoRow({
	label,
	value,
	icon,
}: {
	label: string;
	value: React.ReactNode;
	icon?: React.ReactNode;
}) {
	return (
		<div className="flex items-start justify-between gap-2">
			<span className="flex items-center gap-2 text-sm text-muted-foreground">
				{icon}
				{label}
			</span>
			<span className="text-sm font-medium text-end">{value}</span>
		</div>
	);
}
