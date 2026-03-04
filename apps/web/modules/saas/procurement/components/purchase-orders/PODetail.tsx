"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
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
import { useState } from "react";
import { CheckCircle, Send, Ban, Building2, Calendar } from "lucide-react";
import { Currency } from "@saas/finance/components/shared/Currency";
import { formatDate } from "@shared/lib/formatters";

interface PODetailProps {
	organizationId: string;
	organizationSlug: string;
	orderId: string;
}

const PO_STATUS_COLORS: Record<string, string> = {
	PO_DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
	PO_PENDING_APPROVAL: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
	PO_APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
	PO_SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
	PO_PARTIALLY_RECEIVED: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
	PO_FULLY_RECEIVED: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400",
	PO_CLOSED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
	PO_CANCELLED: "bg-red-100 text-red-500 dark:bg-red-900/50 dark:text-red-400",
};

export function PODetail({ organizationId, organizationSlug, orderId }: PODetailProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [actionType, setActionType] = useState<"approve" | "send" | "cancel" | null>(null);

	const { data: po, isLoading } = useQuery(
		orpc.procurement.purchaseOrders.getById.queryOptions({
			input: { organizationId, orderId },
		}),
	);

	const approveMutation = useMutation({
		mutationFn: () => orpcClient.procurement.purchaseOrders.approve({ organizationId, orderId }),
		onSuccess: () => {
			toast.success(t("procurement.actions.approved"));
			queryClient.invalidateQueries({ queryKey: ["procurement"] });
			setActionType(null);
		},
		onError: (e: any) => toast.error(e.message),
	});

	const sendMutation = useMutation({
		mutationFn: () => orpcClient.procurement.purchaseOrders.send({ organizationId, orderId }),
		onSuccess: () => {
			toast.success(t("procurement.actions.sent"));
			queryClient.invalidateQueries({ queryKey: ["procurement"] });
			setActionType(null);
		},
		onError: (e: any) => toast.error(e.message),
	});

	const cancelMutation = useMutation({
		mutationFn: () => orpcClient.procurement.purchaseOrders.cancel({ organizationId, orderId }),
		onSuccess: () => {
			toast.success(t("procurement.actions.cancelled"));
			queryClient.invalidateQueries({ queryKey: ["procurement"] });
			setActionType(null);
		},
		onError: (e: any) => toast.error(e.message),
	});

	if (isLoading || !po) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	const canApprove = po.status === "PO_PENDING_APPROVAL";
	const canSend = po.status === "PO_APPROVED";
	const canCancel = ["PO_DRAFT", "PO_PENDING_APPROVAL"].includes(po.status);

	return (
		<div className="space-y-6">
			<Card className="rounded-2xl">
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<div className="flex items-center gap-3 mb-2">
								<Badge variant="outline" className="rounded-lg font-mono text-base">{po.poNumber}</Badge>
								<Badge className={`rounded-lg border-0 ${PO_STATUS_COLORS[po.status] ?? ""}`}>
									{t(`procurement.poStatuses.${po.status}`)}
								</Badge>
							</div>
						</div>
						<div className="flex gap-2">
							{canApprove && (
								<Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={() => setActionType("approve")}>
									<CheckCircle className="me-2 h-4 w-4" />{t("procurement.actions.approve")}
								</Button>
							)}
							{canSend && (
								<Button className="rounded-xl" onClick={() => setActionType("send")}>
									<Send className="me-2 h-4 w-4" />{t("procurement.sendToVendor")}
								</Button>
							)}
							{canCancel && (
								<Button variant="outline" className="rounded-xl" onClick={() => setActionType("cancel")}>
									<Ban className="me-2 h-4 w-4" />{t("procurement.actions.cancel")}
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
								<Building2 className="h-3 w-3" />{po.vendor?.name ?? "-"}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">{t("procurement.project")}</p>
							<p className="font-medium">{po.project?.name ?? "-"}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">{t("procurement.expectedDelivery")}</p>
							<p className="font-medium flex items-center gap-1">
								<Calendar className="h-3 w-3" />
								{po.expectedDelivery ? formatDate(new Date(po.expectedDelivery)) : "-"}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">{t("procurement.grandTotal")}</p>
							<p className="font-semibold text-lg"><Currency amount={Number(po.totalAmount)} /></p>
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
							{po.items?.map((item, index) => (
								<TableRow key={item.id}>
									<TableCell>{index + 1}</TableCell>
									<TableCell className="font-medium">{item.name}</TableCell>
									<TableCell>{item.unit}</TableCell>
									<TableCell className="text-end" dir="ltr">{Number(item.quantity)}</TableCell>
									<TableCell className="text-end"><Currency amount={Number(item.unitPrice)} /></TableCell>
									<TableCell className="text-end font-semibold"><Currency amount={Number(item.totalPrice)} /></TableCell>
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
						<div className="flex justify-between"><span>{t("procurement.subtotal")}</span><Currency amount={Number(po.subtotal)} /></div>
						{Number(po.discountPercent) > 0 && (
							<div className="flex justify-between text-red-600"><span>{t("procurement.discount")} ({Number(po.discountPercent)}%)</span><Currency amount={Number(po.discountAmount)} /></div>
						)}
						<div className="flex justify-between"><span>{t("procurement.vat")} ({Number(po.vatPercent)}%)</span><Currency amount={Number(po.vatAmount)} /></div>
						<div className="flex justify-between text-lg font-semibold border-t pt-2"><span>{t("procurement.grandTotal")}</span><Currency amount={Number(po.totalAmount)} /></div>
					</div>
				</CardContent>
			</Card>

			{/* Action Dialogs */}
			{["approve", "send", "cancel"].map((action) => (
				<AlertDialog key={action} open={actionType === action} onOpenChange={() => setActionType(null)}>
					<AlertDialogContent className="rounded-2xl">
						<AlertDialogHeader>
							<AlertDialogTitle>{t(`procurement.actions.${action}`)}</AlertDialogTitle>
							<AlertDialogDescription>
								{action === "cancel" ? t("procurement.actions.confirmCancel") : t("procurement.actions.confirmApprove")}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => {
									if (action === "approve") approveMutation.mutate();
									else if (action === "send") sendMutation.mutate();
									else cancelMutation.mutate();
								}}
								className={`rounded-xl ${action === "cancel" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
							>
								{t(`procurement.actions.${action}`)}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			))}
		</div>
	);
}
