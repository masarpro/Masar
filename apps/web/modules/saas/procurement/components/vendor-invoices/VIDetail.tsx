"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@ui/components/dialog";
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
import { toast } from "sonner";
import { CheckCircle, CreditCard, Building2, Calendar } from "lucide-react";
import { Currency } from "@saas/finance/components/shared/Currency";
import { formatDate } from "@shared/lib/formatters";

interface VIDetailProps {
	organizationId: string;
	organizationSlug: string;
	invoiceId: string;
}

const VI_STATUS_COLORS: Record<string, string> = {
	VI_DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
	VI_PENDING_APPROVAL: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
	VI_APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
	VI_PARTIALLY_PAID: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
	VI_PAID: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400",
	VI_DISPUTED: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400",
	VI_CANCELLED: "bg-red-100 text-red-500 dark:bg-red-900/50 dark:text-red-400",
};

export function VIDetail({ organizationId, organizationSlug, invoiceId }: VIDetailProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [showApproveDialog, setShowApproveDialog] = useState(false);
	const [showPayDialog, setShowPayDialog] = useState(false);
	const [payAmount, setPayAmount] = useState(0);
	const [bankAccountId, setBankAccountId] = useState("");
	const [referenceNo, setReferenceNo] = useState("");

	const { data: vi, isLoading } = useQuery(
		orpc.procurement.vendorInvoices.getById.queryOptions({
			input: { organizationId, invoiceId },
		}),
	);

	const { data: banksData } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId },
		}),
	);
	const banks = (banksData as any[]) ?? [];

	const approveMutation = useMutation({
		mutationFn: () => orpcClient.procurement.vendorInvoices.approve({ organizationId, invoiceId }),
		onSuccess: () => {
			toast.success(t("procurement.actions.approved"));
			queryClient.invalidateQueries({ queryKey: ["procurement"] });
			setShowApproveDialog(false);
		},
		onError: (e: any) => toast.error(e.message),
	});

	const payMutation = useMutation({
		mutationFn: () =>
			orpcClient.procurement.vendorInvoices.pay({
				organizationId,
				invoiceId,
				amount: payAmount,
				bankAccountId,
				referenceNo: referenceNo || undefined,
			}),
		onSuccess: () => {
			toast.success(t("procurement.actions.paid"));
			queryClient.invalidateQueries({ queryKey: ["procurement"] });
			queryClient.invalidateQueries({ queryKey: ["finance"] });
			setShowPayDialog(false);
		},
		onError: (e: any) => toast.error(e.message),
	});

	if (isLoading || !vi) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	const totalAmount = vi.totalAmount;
	const paidAmount = vi.paidAmount;
	const remaining = totalAmount - paidAmount;

	const canApprove = vi.status === "VI_PENDING_APPROVAL";
	const canPay = ["VI_APPROVED", "VI_PARTIALLY_PAID"].includes(vi.status);

	return (
		<div className="space-y-6">
			{/* Header */}
			<Card className="rounded-2xl">
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<div className="flex items-center gap-3 mb-2">
								<Badge variant="outline" className="rounded-lg font-mono text-base">{vi.invoiceNumber}</Badge>
								<Badge className={`rounded-lg border-0 ${VI_STATUS_COLORS[vi.status] ?? ""}`}>
									{t(`procurement.viStatuses.${vi.status}`)}
								</Badge>
							</div>
						</div>
						<div className="flex gap-2">
							{canApprove && (
								<Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowApproveDialog(true)}>
									<CheckCircle className="me-2 h-4 w-4" />{t("procurement.actions.approve")}
								</Button>
							)}
							{canPay && (
								<Button className="rounded-xl" onClick={() => { setPayAmount(remaining); setShowPayDialog(true); }}>
									<CreditCard className="me-2 h-4 w-4" />{t("procurement.registerPayment")}
								</Button>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
						<div>
							<p className="text-sm text-muted-foreground">{t("procurement.vendor")}</p>
							<p className="font-medium flex items-center gap-1">
								<Building2 className="h-3 w-3" />{vi.vendor?.name ?? "-"}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">{t("procurement.invoiceDate")}</p>
							<p className="font-medium flex items-center gap-1">
								<Calendar className="h-3 w-3" />{formatDate(new Date(vi.invoiceDate))}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">{t("procurement.dueDate")}</p>
							<p className="font-medium">{vi.dueDate ? formatDate(new Date(vi.dueDate)) : "-"}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">{t("procurement.project")}</p>
							<p className="font-medium">{vi.project?.name ?? "-"}</p>
						</div>
					</div>

					{/* Payment Summary */}
					<div className="mt-4 grid grid-cols-3 gap-4 p-4 bg-muted rounded-xl">
						<div className="text-center">
							<p className="text-sm text-muted-foreground">{t("procurement.grandTotal")}</p>
							<p className="text-xl font-semibold"><Currency amount={totalAmount} /></p>
						</div>
						<div className="text-center">
							<p className="text-sm text-muted-foreground">{t("procurement.paidAmount")}</p>
							<p className="text-xl font-semibold text-emerald-600"><Currency amount={paidAmount} /></p>
						</div>
						<div className="text-center">
							<p className="text-sm text-muted-foreground">{t("procurement.remainingAmount")}</p>
							<p className="text-xl font-semibold text-red-600"><Currency amount={remaining} /></p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Items */}
			<Card className="rounded-2xl">
				<CardHeader><CardTitle>{t("procurement.items")}</CardTitle></CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>#</TableHead>
								<TableHead>{t("procurement.itemName")}</TableHead>
								<TableHead>{t("procurement.unit")}</TableHead>
								<TableHead className="text-end">{t("procurement.quantity")}</TableHead>
								<TableHead className="text-end">{t("procurement.unitPrice")}</TableHead>
								<TableHead className="text-end">{t("procurement.totalPrice")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{vi.items?.map((item, index) => (
								<TableRow key={item.id}>
									<TableCell>{index + 1}</TableCell>
									<TableCell className="font-medium">{item.name}</TableCell>
									<TableCell>{item.unit}</TableCell>
									<TableCell className="text-end" dir="ltr">{item.quantity}</TableCell>
									<TableCell className="text-end"><Currency amount={item.unitPrice} /></TableCell>
									<TableCell className="text-end font-semibold"><Currency amount={item.totalPrice} /></TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Totals */}
			<Card className="rounded-2xl">
				<CardContent className="pt-6">
					<div className="space-y-2 text-sm max-w-xs ms-auto">
						<div className="flex justify-between"><span>{t("procurement.subtotal")}</span><Currency amount={vi.subtotal} /></div>
						<div className="flex justify-between"><span>{t("procurement.vat")} ({vi.vatPercent}%)</span><Currency amount={vi.vatAmount} /></div>
						<div className="flex justify-between text-lg font-semibold border-t pt-2"><span>{t("procurement.grandTotal")}</span><Currency amount={totalAmount} /></div>
					</div>
				</CardContent>
			</Card>

			{/* Approve Dialog */}
			<AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("procurement.actions.approve")}</AlertDialogTitle>
						<AlertDialogDescription>{t("procurement.actions.confirmApprove")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
							{t("procurement.actions.approve")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Pay Dialog */}
			<Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
				<DialogContent className="rounded-2xl">
					<DialogHeader>
						<DialogTitle>{t("procurement.registerPayment")}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>{t("procurement.paymentAmount")} *</Label>
							<Input
								type="number"
								min={0}
								max={remaining}
								value={payAmount}
								onChange={(e) => setPayAmount(Number(e.target.value))}
								className="rounded-xl"
								dir="ltr"
							/>
							<p className="text-xs text-muted-foreground">
								{t("procurement.remainingAmount")}: <Currency amount={remaining} />
							</p>
						</div>
						<div className="space-y-2">
							<Label>{t("procurement.bankAccount")} *</Label>
							<Select value={bankAccountId} onValueChange={setBankAccountId}>
								<SelectTrigger className="rounded-xl">
									<SelectValue placeholder={t("procurement.selectBankAccount")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{banks.map((b: any) => (
										<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>{t("procurement.referenceNo")}</Label>
							<Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} className="rounded-xl" dir="ltr" />
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" className="rounded-xl" onClick={() => setShowPayDialog(false)}>
							{t("common.cancel")}
						</Button>
						<Button
							className="rounded-xl"
							onClick={() => payMutation.mutate()}
							disabled={!payAmount || !bankAccountId || payMutation.isPending}
						>
							{payMutation.isPending ? t("common.saving") : t("procurement.registerPayment")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
