"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
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
import { Badge } from "@ui/components/badge";
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
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@ui/components/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	TableFooter,
} from "@ui/components/table";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Progress } from "@ui/components/progress";
import { toast } from "sonner";
import {
	Banknote,
	Check,
	CheckCircle,
	Loader2,
	RotateCcw,
	Send,
	Trash2,
	X,
} from "lucide-react";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";
import { SubcontractTabs } from "./SubcontractTabs";

interface SubcontractClaimDetailViewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	subcontractId: string;
	claimId: string;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

function formatNumber(value: number, decimals = 2): string {
	return new Intl.NumberFormat("ar-SA", {
		minimumFractionDigits: 0,
		maximumFractionDigits: decimals,
	}).format(value);
}

function formatDate(date: string | Date): string {
	return new Intl.DateTimeFormat("ar-SA", {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(new Date(date));
}

const statusColors: Record<string, string> = {
	DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
	SUBMITTED: "bg-blue-50 text-blue-700 border-blue-200",
	UNDER_REVIEW: "bg-orange-50 text-orange-700 border-orange-200",
	APPROVED: "bg-sky-50 text-sky-700 border-sky-200",
	PARTIALLY_PAID: "bg-yellow-50 text-yellow-700 border-yellow-200",
	PAID: "bg-green-100 text-green-800 border-green-300",
	REJECTED: "bg-red-50 text-red-700 border-red-200",
	CANCELLED: "bg-gray-50 text-gray-500 border-gray-200",
};

export function SubcontractClaimDetailView({
	organizationId,
	organizationSlug,
	projectId,
	subcontractId,
	claimId,
}: SubcontractClaimDetailViewProps) {
	const t = useTranslations("claims");
	const router = useRouter();
	const queryClient = useQueryClient();

	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance/subcontracts/${subcontractId}`;

	const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [statusAction, setStatusAction] = useState<string | null>(null);

	// Payment form state
	const [payAmount, setPayAmount] = useState("");
	const [payDate, setPayDate] = useState("");
	const [payMethod, setPayMethod] = useState<string>("BANK_TRANSFER");
	const [payNote, setPayNote] = useState("");

	// Fetch claim details
	const { data: claim, isLoading } = useQuery(
		orpc.subcontracts.getClaim.queryOptions({
			input: { organizationId, projectId, claimId },
		}),
	);

	// Fetch bank accounts for payment
	const { data: bankAccounts } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId },
		}),
	);

	const [payAccountId, setPayAccountId] = useState<string>("");

	// Status update mutation
	const statusMutation = useMutation({
		...orpc.subcontracts.updateClaimStatus.mutationOptions(),
		onSuccess: () => {
			toast.success(t("actions.submit") + " ✓");
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			setStatusAction(null);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	// Delete mutation
	const deleteMutation = useMutation({
		...orpc.subcontracts.deleteClaim.mutationOptions(),
		onSuccess: () => {
			toast.success(t("actions.delete") + " ✓");
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			router.push(`${basePath}/claims`);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	// Add payment mutation
	const paymentMutation = useMutation({
		...orpc.subcontracts.addClaimPayment.mutationOptions(),
		onSuccess: () => {
			toast.success(t("payment.addPayment") + " ✓");
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			setPaymentSheetOpen(false);
			resetPaymentForm();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	function resetPaymentForm() {
		setPayAmount("");
		setPayDate("");
		setPayMethod("BANK_TRANSFER");
		setPayNote("");
		setPayAccountId("");
	}

	function handleStatusChange(newStatus: string) {
		statusMutation.mutate({
			organizationId,
			projectId,
			claimId,
			status: newStatus as any,
		});
	}

	function handlePaymentSubmit() {
		const amount = Number.parseFloat(payAmount);
		if (!amount || amount <= 0 || !payDate) return;

		paymentMutation.mutate({
			organizationId,
			projectId,
			claimId,
			amount,
			date: new Date(payDate),
			paymentMethod: payMethod as any,
			sourceAccountId: payAccountId || undefined,
			description: payNote || undefined,
		});
	}

	if (isLoading) {
		return <DetailPageSkeleton />;
	}

	if (!claim) {
		return (
			<div className="text-center py-16">
				<p className="text-muted-foreground">المستخلص غير موجود</p>
			</div>
		);
	}

	const outstanding = claim.outstanding ?? 0;

	return (
		<div className="space-y-6">
			{/* Navigation Tabs */}
			<SubcontractTabs
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				projectId={projectId}
				subcontractId={subcontractId}
			/>

			{/* Section 1 — Claim Info Header */}
			<div className="flex items-start justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-bold">
							مستخلص #{claim.claimNo}
						</h1>
						<Badge
							variant="outline"
							className={`text-sm ${statusColors[claim.status] ?? ""}`}
						>
							{t(`status.${claim.status}`)}
						</Badge>
					</div>
					<p className="text-lg">{claim.title}</p>
					<div className="flex items-center gap-4 text-sm text-muted-foreground">
						<span>
							{t("period")}: {formatDate(claim.periodStart)} — {formatDate(claim.periodEnd)}
						</span>
						{claim.contract && (
							<span>
								{claim.contract.name} | قيمة العقد:{" "}
								<span className="tabular-nums" dir="ltr">
									{formatCurrency(claim.contract.value)}
								</span>
							</span>
						)}
					</div>
					{claim.createdBy && (
						<p className="text-sm text-muted-foreground">
							المنشئ: {claim.createdBy.name}
						</p>
					)}
				</div>
			</div>

			{/* Section 4 — Actions (by status) */}
			<div className="flex flex-wrap gap-2">
				{claim.status === "DRAFT" && (
					<>
						<Button
							onClick={() => handleStatusChange("SUBMITTED")}
							disabled={statusMutation.isPending}
						>
							{statusMutation.isPending && (
								<Loader2 className="h-4 w-4 animate-spin me-2" />
							)}
							<Send className="h-4 w-4 me-2" />
							{t("actions.submit")}
						</Button>
						<Button
							variant="outline"
							className="text-destructive border-destructive hover:bg-destructive/10"
							onClick={() => setDeleteDialogOpen(true)}
						>
							<Trash2 className="h-4 w-4 me-2" />
							{t("actions.delete")}
						</Button>
					</>
				)}
				{claim.status === "SUBMITTED" && (
					<>
						<Button
							onClick={() => handleStatusChange("APPROVED")}
							disabled={statusMutation.isPending}
						>
							{statusMutation.isPending && (
								<Loader2 className="h-4 w-4 animate-spin me-2" />
							)}
							<Check className="h-4 w-4 me-2" />
							{t("actions.approve")}
						</Button>
						<Button
							variant="outline"
							className="text-destructive border-destructive hover:bg-destructive/10"
							onClick={() => handleStatusChange("REJECTED")}
							disabled={statusMutation.isPending}
						>
							<X className="h-4 w-4 me-2" />
							{t("actions.reject")}
						</Button>
					</>
				)}
				{(claim.status === "APPROVED" || claim.status === "PARTIALLY_PAID") && (
					<Button onClick={() => setPaymentSheetOpen(true)}>
						<Banknote className="h-4 w-4 me-2" />
						{t("payment.addPayment")}
					</Button>
				)}
				{claim.status === "REJECTED" && (
					<Button
						variant="outline"
						onClick={() => handleStatusChange("DRAFT")}
						disabled={statusMutation.isPending}
					>
						{statusMutation.isPending && (
							<Loader2 className="h-4 w-4 animate-spin me-2" />
						)}
						<RotateCcw className="h-4 w-4 me-2" />
						{t("actions.backToDraft")}
					</Button>
				)}
			</div>

			{/* Section 2 — Items Table (read-only) */}
			{claim.items && claim.items.length > 0 && (
				<div className="rounded-xl border overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/50">
								<TableHead className="w-48">البند</TableHead>
								<TableHead className="w-20 text-center">الوحدة</TableHead>
								<TableHead className="w-24 text-center">
									{t("items.contractQty")}
								</TableHead>
								<TableHead className="w-24 text-center text-muted-foreground">
									{t("items.prevCumulative")}
								</TableHead>
								<TableHead className="w-24 text-center font-bold">
									{t("items.thisQty")}
								</TableHead>
								<TableHead className="w-24 text-center">
									{t("items.cumulative")}
								</TableHead>
								<TableHead className="w-24 text-center">
									{t("items.remaining")}
								</TableHead>
								<TableHead className="w-20 text-center">
									{t("items.completionPct")}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{claim.items.map((item: any) => (
								<TableRow key={item.id}>
									<TableCell>
										<div className="font-medium text-sm">
											{item.contractItem?.description ?? "—"}
										</div>
										{item.contractItem?.itemCode && (
											<span className="text-xs text-muted-foreground font-mono">
												{item.contractItem.itemCode}
											</span>
										)}
									</TableCell>
									<TableCell className="text-center text-sm">
										{item.contractItem?.unit ?? "—"}
									</TableCell>
									<TableCell className="text-center tabular-nums" dir="ltr">
										{formatNumber(item.contractQty, 3)}
									</TableCell>
									<TableCell
										className="text-center tabular-nums text-muted-foreground"
										dir="ltr"
									>
										{formatNumber(item.prevCumulativeQty, 3)}
									</TableCell>
									<TableCell
										className="text-center tabular-nums font-bold"
										dir="ltr"
									>
										{formatNumber(item.thisQty, 3)}
									</TableCell>
									<TableCell className="text-center tabular-nums" dir="ltr">
										{formatNumber(item.cumulativeQty, 3)}
									</TableCell>
									<TableCell className="text-center tabular-nums" dir="ltr">
										{formatNumber(Math.max(item.remainingQty, 0), 3)}
									</TableCell>
									<TableCell className="text-center">
										<div className="flex items-center gap-1.5">
											<Progress
												value={Math.min(item.completionPercent, 100)}
												className="h-2 flex-1"
											/>
											<span
												className="text-xs tabular-nums text-muted-foreground w-10"
												dir="ltr"
											>
												{item.completionPercent}%
											</span>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Section 3 — Financial Summary */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">الملخص المالي</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 text-sm">
					<div className="flex justify-between">
						<span>{t("grossAmount")}:</span>
						<span className="font-bold tabular-nums" dir="ltr">
							{formatCurrency(claim.grossAmount)}
						</span>
					</div>
					<div className="flex justify-between text-muted-foreground">
						<span>(-) {t("retentionDeduction")}:</span>
						<span className="tabular-nums" dir="ltr">
							{formatCurrency(claim.retentionAmount)}
						</span>
					</div>
					{claim.advanceDeduction > 0 && (
						<div className="flex justify-between text-muted-foreground">
							<span>(-) {t("advanceDeduction")}:</span>
							<span className="tabular-nums" dir="ltr">
								{formatCurrency(claim.advanceDeduction)}
							</span>
						</div>
					)}
					<div className="flex justify-between text-muted-foreground">
						<span>(+) {t("vatAmount")}:</span>
						<span className="tabular-nums" dir="ltr">
							{formatCurrency(claim.vatAmount)}
						</span>
					</div>
					<div className="border-t pt-3" />
					<div className="flex justify-between text-base font-bold">
						<span>{t("netAmount")}:</span>
						<span className="tabular-nums" dir="ltr">
							{formatCurrency(claim.netAmount)}
						</span>
					</div>
					<div className="flex justify-between">
						<span>{t("paidAmount")}:</span>
						<span className="tabular-nums text-green-600 font-medium" dir="ltr">
							{formatCurrency(claim.paidAmount)}
						</span>
					</div>
					<div className="flex justify-between">
						<span>{t("outstandingAmount")}:</span>
						<span
							className={`tabular-nums font-medium ${
								outstanding > 0 ? "text-orange-600" : "text-green-600"
							}`}
							dir="ltr"
						>
							{formatCurrency(outstanding)}
						</span>
					</div>
					{outstanding <= 0 && claim.paidAmount > 0 && (
						<div className="flex items-center gap-2 text-green-600 font-medium pt-2">
							<CheckCircle className="h-4 w-4" />
							{t("payment.fullyPaid")}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Section 5 — Payment History */}
			{claim.payments && claim.payments.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">
							{t("payment.paymentHistory")}
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/30">
									<TableHead>{t("payment.date")}</TableHead>
									<TableHead className="text-center">{t("grossAmount")}</TableHead>
									<TableHead className="text-center">{t("payment.method")}</TableHead>
									<TableHead>{t("payment.note")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{claim.payments.map((payment: any) => (
									<TableRow key={payment.id}>
										<TableCell className="text-sm">
											{formatDate(payment.date)}
										</TableCell>
										<TableCell
											className="text-center tabular-nums font-medium"
											dir="ltr"
										>
											{formatCurrency(payment.amount)}
										</TableCell>
										<TableCell className="text-center text-sm">
											{payment.paymentMethod}
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{payment.description || "—"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
							<TableFooter>
								<TableRow className="bg-muted/30 font-bold">
									<TableCell>{t("paidAmount")}</TableCell>
									<TableCell
										className="text-center tabular-nums"
										dir="ltr"
									>
										{formatCurrency(claim.paidAmount)}
									</TableCell>
									<TableCell colSpan={2}>
										{outstanding <= 0 && (
											<span className="text-green-600 flex items-center gap-1">
												<CheckCircle className="h-3.5 w-3.5" />
												{t("payment.fullyPaid")}
											</span>
										)}
									</TableCell>
								</TableRow>
							</TableFooter>
						</Table>
					</CardContent>
				</Card>
			)}

			{/* Payment Sheet */}
			<Sheet open={paymentSheetOpen} onOpenChange={setPaymentSheetOpen}>
				<SheetContent side="left" className="w-[400px] sm:w-[450px]">
					<SheetHeader>
						<SheetTitle>{t("payment.addPayment")}</SheetTitle>
						<SheetDescription>
							{t("payment.maxAllowed", {
								amount: formatCurrency(outstanding),
							})}
						</SheetDescription>
					</SheetHeader>
					<div className="space-y-5 mt-6">
						<div className="space-y-2">
							<Label>{t("payment.paymentAmount")}</Label>
							<Input
								type="number"
								step="any"
								min={0}
								max={outstanding}
								value={payAmount}
								onChange={(e) => setPayAmount(e.target.value)}
								dir="ltr"
								className="text-start"
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("payment.date")}</Label>
							<Input
								type="date"
								value={payDate}
								onChange={(e) => setPayDate(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("payment.method")}</Label>
							<Select value={payMethod} onValueChange={setPayMethod}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="BANK_TRANSFER">تحويل بنكي</SelectItem>
									<SelectItem value="CASH">نقدي</SelectItem>
									<SelectItem value="CHEQUE">شيك</SelectItem>
									<SelectItem value="CREDIT_CARD">بطاقة ائتمان</SelectItem>
									<SelectItem value="OTHER">أخرى</SelectItem>
								</SelectContent>
							</Select>
						</div>
						{bankAccounts?.accounts && bankAccounts.accounts.length > 0 && (
							<div className="space-y-2">
								<Label>{t("payment.sourceAccount")}</Label>
								<Select value={payAccountId} onValueChange={setPayAccountId}>
									<SelectTrigger>
										<SelectValue placeholder="اختر الحساب البنكي" />
									</SelectTrigger>
									<SelectContent>
										{bankAccounts.accounts.map((account) => (
											<SelectItem key={account.id} value={account.id}>
												{account.bankName} - {account.accountNumber}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
						<div className="space-y-2">
							<Label>{t("payment.note")}</Label>
							<Textarea
								value={payNote}
								onChange={(e) => setPayNote(e.target.value)}
								rows={2}
							/>
						</div>
						<Button
							className="w-full"
							onClick={handlePaymentSubmit}
							disabled={
								paymentMutation.isPending ||
								!payAmount ||
								!payDate ||
								Number(payAmount) <= 0
							}
						>
							{paymentMutation.isPending && (
								<Loader2 className="h-4 w-4 animate-spin me-2" />
							)}
							{t("payment.addPayment")}
						</Button>
					</div>
				</SheetContent>
			</Sheet>

			{/* Delete Confirmation */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("actions.delete")}</AlertDialogTitle>
						<AlertDialogDescription>
							هل أنت متأكد من حذف هذا المستخلص؟ لا يمكن التراجع عن هذا الإجراء.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>إلغاء</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() => {
								deleteMutation.mutate({
									organizationId,
									projectId,
									claimId,
								});
							}}
						>
							{deleteMutation.isPending && (
								<Loader2 className="h-4 w-4 animate-spin me-2" />
							)}
							{t("actions.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
