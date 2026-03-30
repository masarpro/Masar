"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

function formatDate(date: string | Date): string {
	return new Intl.DateTimeFormat("ar-SA", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(new Date(date));
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
	CASH: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
	BANK_TRANSFER: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
	CHEQUE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
	CREDIT_CARD: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
	OTHER: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
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
			queryClient.invalidateQueries({ queryKey: ["projectPayments"] });
		},
		onError: () => {
			toast.error(t("projectPayments.deleteError"));
		},
	});

	if (payments.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 dark:border-slate-700 dark:bg-slate-900/30">
				<Banknote className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
				<p className="text-sm text-slate-500">{t("projectPayments.noPayments")}</p>
			</div>
		);
	}

	return (
		<>
			<div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-slate-700/50">
				<Table>
					<TableHeader>
						<TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
							<TableHead className="text-right">{t("projectPayments.paymentNo")}</TableHead>
							<TableHead className="text-right">{t("projectPayments.date")}</TableHead>
							<TableHead className="text-right">{t("projectPayments.amount")}</TableHead>
							<TableHead className="text-right">{t("projectPayments.method")}</TableHead>
							{showTermColumn && (
								<TableHead className="text-right">{t("projectPayments.term")}</TableHead>
							)}
							<TableHead className="text-right">{t("projectPayments.description")}</TableHead>
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
										{formatDate(payment.date)}
									</TableCell>
									<TableCell className="font-semibold text-sky-700 dark:text-sky-400">
										{formatCurrency(payment.amount)}
									</TableCell>
									<TableCell>
										<Badge variant="secondary" className={methodColor}>
											{t(`projectPayments.paymentMethods.${payment.paymentMethod}`)}
										</Badge>
									</TableCell>
									{showTermColumn && (
										<TableCell className="text-sm text-slate-600 dark:text-slate-400">
											{payment.contractTerm?.label ?? "-"}
										</TableCell>
									)}
									<TableCell className="max-w-[200px] truncate text-sm text-slate-500">
										{payment.description ?? payment.note ?? "-"}
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => setEditPayment(payment)}>
													<Pencil className="ml-2 h-4 w-4" />
													{t("common.edit")}
												</DropdownMenuItem>
												<DropdownMenuItem
													className="text-red-600 dark:text-red-400"
													onClick={() => setDeletePaymentId(payment.id)}
												>
													<Trash2 className="ml-2 h-4 w-4" />
													{t("common.delete")}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
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
				onOpenChange={(open) => !open && setDeletePaymentId(null)}
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
							className="bg-red-600 hover:bg-red-700"
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
