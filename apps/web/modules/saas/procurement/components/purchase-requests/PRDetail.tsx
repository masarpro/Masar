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
import { CheckCircle, XCircle, Ban, Calendar, User } from "lucide-react";
import { Currency } from "@saas/finance/components/shared/Currency";
import { formatDate } from "@shared/lib/formatters";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";

interface PRDetailProps {
	organizationId: string;
	organizationSlug: string;
	requestId: string;
}

const PR_STATUS_COLORS: Record<string, string> = {
	PR_DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
	PR_PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
	PR_APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
	PR_REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
	PARTIALLY_ORDERED: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
	FULLY_ORDERED: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
	PR_CANCELLED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};

export function PRDetail({ organizationId, organizationSlug, requestId }: PRDetailProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [actionType, setActionType] = useState<"approve" | "reject" | "cancel" | null>(null);
	const [rejectionReason, setRejectionReason] = useState("");

	const { data: pr, isLoading } = useQuery(
		orpc.procurement.purchaseRequests.getById.queryOptions({
			input: { organizationId, requestId },
		}),
	);

	const approveMutation = useMutation({
		mutationFn: () => orpcClient.procurement.purchaseRequests.approve({ organizationId, requestId }),
		onSuccess: () => {
			toast.success(t("procurement.actions.approved"));
			queryClient.invalidateQueries({ queryKey: ["procurement"] });
			setActionType(null);
		},
		onError: (e: any) => toast.error(e.message),
	});

	const rejectMutation = useMutation({
		mutationFn: () => orpcClient.procurement.purchaseRequests.reject({ organizationId, requestId, rejectionReason }),
		onSuccess: () => {
			toast.success(t("procurement.actions.rejected"));
			queryClient.invalidateQueries({ queryKey: ["procurement"] });
			setActionType(null);
		},
		onError: (e: any) => toast.error(e.message),
	});

	const cancelMutation = useMutation({
		mutationFn: () => orpcClient.procurement.purchaseRequests.cancel({ organizationId, requestId }),
		onSuccess: () => {
			toast.success(t("procurement.actions.cancelled"));
			queryClient.invalidateQueries({ queryKey: ["procurement"] });
			setActionType(null);
		},
		onError: (e: any) => toast.error(e.message),
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	if (!pr) return null;

	const canApprove = pr.status === "PR_PENDING";
	const canCancel = ["PR_DRAFT", "PR_PENDING"].includes(pr.status);

	return (
		<div className="space-y-6">
			{/* Header Card */}
			<Card className="rounded-2xl">
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<div className="flex items-center gap-3 mb-2">
								<Badge variant="outline" className="rounded-lg font-mono text-base">{pr.prNumber}</Badge>
								<Badge className={`rounded-lg border-0 ${PR_STATUS_COLORS[pr.status] ?? ""}`}>
									{t(`procurement.prStatuses.${pr.status}`)}
								</Badge>
							</div>
							<CardTitle className="text-xl">{pr.title}</CardTitle>
						</div>
						<div className="flex gap-2">
							{canApprove && (
								<>
									<Button
										variant="outline"
										className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
										onClick={() => setActionType("reject")}
									>
										<XCircle className="me-2 h-4 w-4" />
										{t("procurement.actions.reject")}
									</Button>
									<Button
										className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
										onClick={() => setActionType("approve")}
									>
										<CheckCircle className="me-2 h-4 w-4" />
										{t("procurement.actions.approve")}
									</Button>
								</>
							)}
							{canCancel && (
								<Button
									variant="outline"
									className="rounded-xl"
									onClick={() => setActionType("cancel")}
								>
									<Ban className="me-2 h-4 w-4" />
									{t("procurement.actions.cancel")}
								</Button>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
						<div>
							<p className="text-sm text-muted-foreground">{t("procurement.project")}</p>
							<p className="font-medium">{pr.project?.name ?? "-"}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">{t("procurement.requestedBy")}</p>
							<p className="font-medium flex items-center gap-1">
								<User className="h-3 w-3" />
								{pr.requestedBy?.name ?? "-"}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">{t("procurement.requiredDate")}</p>
							<p className="font-medium flex items-center gap-1">
								<Calendar className="h-3 w-3" />
								{pr.requiredDate ? formatDate(new Date(pr.requiredDate)) : "-"}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">{t("procurement.estimatedTotal")}</p>
							<p className="font-semibold text-lg">
								<Currency amount={Number(pr.estimatedTotal)} />
							</p>
						</div>
					</div>
					{pr.description && (
						<div className="mt-4 p-3 bg-muted rounded-xl text-sm">{pr.description}</div>
					)}
				</CardContent>
			</Card>

			{/* Items */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("procurement.items")}</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>#</TableHead>
								<TableHead>{t("procurement.itemName")}</TableHead>
								<TableHead>{t("procurement.unit")}</TableHead>
								<TableHead className="text-end">{t("procurement.quantity")}</TableHead>
								<TableHead className="text-end">{t("procurement.estimatedPrice")}</TableHead>
								<TableHead className="text-end">{t("procurement.totalPrice")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pr.items?.map((item, index) => (
								<TableRow key={item.id}>
									<TableCell>{index + 1}</TableCell>
									<TableCell className="font-medium">{item.name}</TableCell>
									<TableCell>{item.unit}</TableCell>
									<TableCell className="text-end" dir="ltr">{Number(item.quantity)}</TableCell>
									<TableCell className="text-end"><Currency amount={Number(item.estimatedPrice)} /></TableCell>
									<TableCell className="text-end font-semibold"><Currency amount={Number(item.totalEstimate)} /></TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Approve Dialog */}
			<AlertDialog open={actionType === "approve"} onOpenChange={() => setActionType(null)}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("procurement.actions.approve")}</AlertDialogTitle>
						<AlertDialogDescription>{t("procurement.actions.confirmApprove")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => approveMutation.mutate()}
							disabled={approveMutation.isPending}
							className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
						>
							{t("procurement.actions.approve")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Reject Dialog */}
			<AlertDialog open={actionType === "reject"} onOpenChange={() => setActionType(null)}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("procurement.actions.reject")}</AlertDialogTitle>
					</AlertDialogHeader>
					<div className="px-6 pb-4 space-y-2">
						<Label>{t("procurement.rejectionReason")} *</Label>
						<Input
							value={rejectionReason}
							onChange={(e) => setRejectionReason(e.target.value)}
							className="rounded-xl"
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => rejectMutation.mutate()}
							disabled={!rejectionReason || rejectMutation.isPending}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{t("procurement.actions.reject")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Cancel Dialog */}
			<AlertDialog open={actionType === "cancel"} onOpenChange={() => setActionType(null)}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("procurement.actions.cancel")}</AlertDialogTitle>
						<AlertDialogDescription>{t("procurement.actions.confirmCancel")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => cancelMutation.mutate()}
							disabled={cancelMutation.isPending}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{t("procurement.actions.cancel")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
