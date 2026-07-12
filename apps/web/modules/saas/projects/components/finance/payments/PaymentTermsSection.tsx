"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatSAR } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Progress } from "@ui/components/progress";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
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
	ChevronDown,
	CheckCircle2,
	Clock,
	AlertCircle,
	Pencil,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PaymentsTable } from "./PaymentsTable";
import { EditPaymentTermDialog } from "./EditPaymentTermDialog";

interface Term {
	id: string;
	type: string;
	label: string | null;
	percent: number | null;
	amount: number | null;
	paidAmount: number;
	status: string;
	dueDate?: string | Date | null;
	projectPayments: Array<{
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
		destinationAccount?: { id: string; name: string } | null;
		createdBy?: { id: string; name: string } | null;
	}>;
}

interface PaymentTermsSectionProps {
	organizationId: string;
	projectId: string;
	contractValue: number;
	terms: Term[];
}

const STATUS_ICON_MAP: Record<string, typeof CheckCircle2> = {
	PENDING: Clock,
	PARTIALLY_PAID: AlertCircle,
	FULLY_PAID: CheckCircle2,
};

const STATUS_COLOR_MAP: Record<string, string> = {
	PENDING: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
	PARTIALLY_PAID: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
	FULLY_PAID: "bg-chart-4/15 text-chart-4 dark:bg-chart-4/20 dark:text-chart-4",
};

export function PaymentTermsSection({
	organizationId,
	projectId,
	contractValue,
	terms,
}: PaymentTermsSectionProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [editTerm, setEditTerm] = useState<Term | null>(null);
	const [deleteTermId, setDeleteTermId] = useState<string | null>(null);

	const deleteMutation = useMutation({
		...orpc.projectContract.deletePaymentTerm.mutationOptions(),
		onSuccess: () => {
			toast.success(t("projectPayments.termDeleted"));
			queryClient.invalidateQueries({ queryKey: orpc.projectPayments.key() });
			queryClient.invalidateQueries({ queryKey: orpc.projectContract.key() });
			setDeleteTermId(null);
		},
		onError: (error) => {
			toast.error(error.message || t("projectPayments.termDeleteError"));
		},
	});

	return (
		<div className="space-y-3">
			<h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
				{t("projectPayments.paymentTerms")}
			</h3>
			{terms.map((term) => {
				const termAmount = term.amount ?? 0;
				const paidPercent = termAmount > 0
					? Math.min(100, Math.round((term.paidAmount / termAmount) * 100))
					: 0;
				const statusKey = term.status in STATUS_ICON_MAP ? term.status : "PENDING";
				const StatusIcon = STATUS_ICON_MAP[statusKey] ?? Clock;
				const statusColor = STATUS_COLOR_MAP[statusKey] ?? STATUS_COLOR_MAP.PENDING;

				return (
					<Collapsible key={term.id}>
						<div className="rounded-xl border border-slate-200/60 bg-white/80 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/50">
							<div className="flex items-center">
								<CollapsibleTrigger className="flex flex-1 items-center gap-3 p-4 text-start">
									<ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform [[data-state=open]>&]:rotate-180" />
									<div className="flex flex-1 flex-wrap items-center gap-2">
										<span className="font-medium text-slate-900 dark:text-slate-100">
											{term.label ?? t(`projectPayments.termTypes.${term.type}`)}
										</span>
										<Badge variant="secondary" className="text-xs">
											{t(`projectPayments.termTypes.${term.type}`)}
										</Badge>
										<Badge variant="secondary" className={statusColor}>
											<StatusIcon className="ms-1 h-3 w-3" />
											{t(`projectPayments.statuses.${statusKey}`)}
										</Badge>
									</div>
									<div className="flex shrink-0 items-center gap-4 text-sm">
										<span className="text-slate-500">
											{formatSAR(term.paidAmount)} / {formatSAR(termAmount)}
										</span>
										<span className="font-mono font-semibold text-chart-4 dark:text-chart-4">
											{paidPercent}%
										</span>
									</div>
								</CollapsibleTrigger>
								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9 shrink-0 text-slate-400 hover:text-chart-4"
									onClick={() => setEditTerm(term)}
									aria-label={t("projectPayments.editTerm")}
								>
									<Pencil className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="me-2 h-9 w-9 shrink-0 text-slate-400 hover:text-red-600"
									onClick={() => setDeleteTermId(term.id)}
									aria-label={t("projectPayments.deleteTerm")}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>

							<CollapsibleContent>
								<div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800">
									<Progress
										value={paidPercent}
										className="mb-4 h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-chart-4"
									/>
									<PaymentsTable
										organizationId={organizationId}
										projectId={projectId}
										payments={term.projectPayments}
									/>
								</div>
							</CollapsibleContent>
						</div>
					</Collapsible>
				);
			})}

			{editTerm && (
				<EditPaymentTermDialog
					open={!!editTerm}
					onOpenChange={(open) => {
						if (!open) setEditTerm(null);
					}}
					organizationId={organizationId}
					projectId={projectId}
					contractValue={contractValue}
					term={editTerm}
				/>
			)}

			<AlertDialog
				open={!!deleteTermId}
				onOpenChange={(open: boolean) => {
					if (!open) setDeleteTermId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("projectPayments.deleteTermConfirmTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("projectPayments.deleteTermConfirmDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							className="bg-red-600 hover:bg-red-700"
							disabled={deleteMutation.isPending}
							onClick={(e) => {
								e.preventDefault();
								if (deleteTermId) {
									deleteMutation.mutate({
										organizationId,
										projectId,
										termId: deleteTermId,
									});
								}
							}}
						>
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
