"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate, formatSARPrecise } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
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
import { MoreHorizontal, Pencil, Trash2, Banknote } from "lucide-react";
import { toast } from "sonner";
import { MobileDocList, MobileDocRow } from "@saas/shared/components/mobile/MobileDocRow";
import { EditPaymentDialog } from "./EditPaymentDialog";

interface Payment {
	id: string;
	paymentNo: string;
	amount: number;
	date: string | Date;
	paymentMethod: string;
	referenceNo?: string | null;
	description?: string | null;
	note?: string | null;
	splitGroupId?: string | null;
	splitGroupTotal?: number | null;
	splitGroupCount?: number | null;
	contractTerm?: { id: string; label: string | null; type: string } | null;
	destinationAccount?: { id: string; name: string } | null;
	createdBy?: { id: string; name: string } | null;
}

interface PaymentsTableProps {
	organizationId: string;
	projectId: string;
	payments: Payment[];
	showTermColumn?: boolean;
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
	CASH: "bg-success/15 text-success",
	BANK_TRANSFER: "bg-chart-4/15 text-chart-4",
	CHEQUE: "bg-chart-4/15 text-chart-4",
	CREDIT_CARD: "bg-chart-1/15 text-chart-1",
	OTHER: "bg-muted text-muted-foreground",
};

export function PaymentsTable({
	organizationId,
	projectId,
	payments,
	showTermColumn = false,
}: PaymentsTableProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [editPayment, setEditPayment] = useState<Payment | null>(null);
	const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

	const deleteMutation = useMutation({
		...orpc.projectPayments.delete.mutationOptions(),
		onSuccess: () => {
			toast.success(t("projectPayments.paymentDeleted"));
			queryClient.invalidateQueries({ queryKey: orpc.projectPayments.key() });
			queryClient.invalidateQueries({ queryKey: orpc.finance.banks.key() });
			queryClient.invalidateQueries({ queryKey: orpc.projectFinance.key() });
		},
		onError: () => {
			toast.error(t("projectPayments.deleteError"));
		},
	});

	// قائمة إجراءات الصف — مشتركة بين الجدول (ديسكتوب) وبطاقات الجوال
	const renderRowMenu = (payment: Payment) => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-8 w-8">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => setEditPayment(payment)}>
					<Pencil className="me-2 h-4 w-4" />
					{t("common.edit")}
				</DropdownMenuItem>
				<DropdownMenuItem
					className="text-destructive dark:text-destructive"
					onClick={() => setDeletePaymentId(payment.id)}
				>
					<Trash2 className="me-2 h-4 w-4" />
					{t("common.delete")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	if (payments.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10">
				<Banknote className="mb-3 h-10 w-10 text-muted-foreground" />
				<p className="text-sm text-muted-foreground">{t("projectPayments.noPayments")}</p>
			</div>
		);
	}

	return (
		<>
			{/* الجوال: صفوف مستندات بسطرين بدل الجدول متعدد الأعمدة */}
			<MobileDocList className="sm:hidden">
				{payments.map((payment) => (
					<MobileDocRow
						key={payment.id}
						title={payment.description ?? payment.note ?? "-"}
						subtitle={
							<>
								<span dir="ltr" className="whitespace-nowrap">
									{payment.paymentNo}
								</span>
								{" · "}
								{formatDate(payment.date, "ar-SA", {
									year: "numeric",
									month: "short",
									day: "numeric",
								})}
							</>
						}
						amount={formatSARPrecise(payment.amount)}
						badge={
							<Badge
								variant="secondary"
								className={
									PAYMENT_METHOD_COLORS[payment.paymentMethod] ??
									PAYMENT_METHOD_COLORS.OTHER
								}
							>
								{t(`projectPayments.paymentMethods.${payment.paymentMethod}`)}
							</Badge>
						}
						actions={renderRowMenu(payment)}
					/>
				))}
			</MobileDocList>

			<div className="hidden sm:block overflow-x-auto rounded-xl border-2">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className="text-start">{t("projectPayments.paymentNo")}</TableHead>
							<TableHead className="text-start">{t("projectPayments.date")}</TableHead>
							<TableHead className="text-start">{t("projectPayments.amount")}</TableHead>
							<TableHead className="text-start">{t("projectPayments.method")}</TableHead>
							{showTermColumn && (
								<TableHead className="text-start">{t("projectPayments.term")}</TableHead>
							)}
							<TableHead className="text-start">{t("projectPayments.description")}</TableHead>
							<TableHead className="w-10" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{payments.map((payment) => {
							const methodColor = PAYMENT_METHOD_COLORS[payment.paymentMethod] ?? PAYMENT_METHOD_COLORS.OTHER;
							return (
								<TableRow key={payment.id}>
									<TableCell className="font-mono text-sm">
										{payment.paymentNo}
									</TableCell>
									<TableCell className="text-sm">
										{formatDate(payment.date, "ar-SA", {
											year: "numeric",
											month: "short",
											day: "numeric",
										})}
									</TableCell>
									<TableCell className="font-semibold text-chart-4">
										<div className="flex flex-col gap-1">
											<span>{formatSARPrecise(payment.amount)}</span>
											{payment.splitGroupTotal != null && (
												<Badge
													variant="secondary"
													className="w-fit gap-1 text-[10px] font-normal bg-chart-4/15 text-chart-4"
												>
													{t("projectPayments.splitPart", {
														total: formatSARPrecise(payment.splitGroupTotal),
													})}
												</Badge>
											)}
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="secondary" className={methodColor}>
											{t(`projectPayments.paymentMethods.${payment.paymentMethod}`)}
										</Badge>
									</TableCell>
									{showTermColumn && (
										<TableCell className="text-sm text-muted-foreground">
											{payment.contractTerm?.label ?? "-"}
										</TableCell>
									)}
									<TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
										{payment.description ?? payment.note ?? "-"}
									</TableCell>
									<TableCell>{renderRowMenu(payment)}</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			{/* Edit Dialog */}
			{editPayment && (
				<EditPaymentDialog
					open={!!editPayment}
					onOpenChange={(open) => !open && setEditPayment(null)}
					organizationId={organizationId}
					projectId={projectId}
					payment={editPayment}
				/>
			)}

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deletePaymentId}
				onOpenChange={(open: any) => !open && setDeletePaymentId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("projectPayments.deleteConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("projectPayments.deleteConfirmDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive hover:bg-destructive"
							onClick={() => {
								if (deletePaymentId) {
									deleteMutation.mutate({
										organizationId,
										projectId,
										paymentId: deletePaymentId,
									});
									setDeletePaymentId(null);
								}
							}}
						>
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
