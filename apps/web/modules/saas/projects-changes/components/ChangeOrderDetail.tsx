"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { apiClient } from "@shared/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Textarea } from "@ui/components/textarea";
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
	ArrowLeftIcon,
	DollarSignIcon,
	ClockIcon,
	CalendarIcon,
	UserIcon,
	EditIcon,
	SendIcon,
	CheckCircleIcon,
	XCircleIcon,
	PlayIcon,
	TrashIcon,
	AlertTriangleIcon,
	FlagIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CreateChangeOrderForm } from "./CreateChangeOrderForm";

type ChangeOrderStatus =
	| "DRAFT"
	| "SUBMITTED"
	| "APPROVED"
	| "REJECTED"
	| "IMPLEMENTED";
type ChangeOrderCategory =
	| "SCOPE_CHANGE"
	| "CLIENT_REQUEST"
	| "SITE_CONDITION"
	| "DESIGN_CHANGE"
	| "MATERIAL_CHANGE"
	| "REGULATORY"
	| "OTHER";

interface ChangeOrderDetailProps {
	projectId: string;
	changeOrderId: string;
}

function formatCurrency(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return "-";
	const num = typeof value === "number" ? value : Number.parseFloat(value);
	if (Number.isNaN(num)) return "-";
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(num);
}

function getStatusBadge(status: ChangeOrderStatus, t: (key: string) => string) {
	const colors: Record<ChangeOrderStatus, string> = {
		DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
		SUBMITTED:
			"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
		APPROVED:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
		REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
		IMPLEMENTED:
			"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	};

	return (
		<Badge className={`border-0 text-base px-3 py-1 ${colors[status]}`}>
			{t(`changeOrders.status.${status}`)}
		</Badge>
	);
}

export function ChangeOrderDetail({
	projectId,
	changeOrderId,
}: ChangeOrderDetailProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDecisionDialogOpen, setIsDecisionDialogOpen] = useState(false);
	const [decisionType, setDecisionType] = useState<"approve" | "reject">(
		"approve",
	);
	const [decisionNote, setDecisionNote] = useState("");

	const queryKey = [
		"project-change-order",
		activeOrganization?.id,
		projectId,
		changeOrderId,
	];

	// Fetch change order
	const { data: changeOrder, isLoading } = useQuery({
		queryKey,
		queryFn: async () => {
			if (!activeOrganization?.id) return null;
			return apiClient.projectChangeOrders.get({
				organizationId: activeOrganization.id,
				projectId,
				changeOrderId,
			});
		},
		enabled: !!activeOrganization?.id,
	});

	// Submit mutation
	const submitMutation = useMutation({
		mutationFn: async () => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.projectChangeOrders.submit({
				organizationId: activeOrganization.id,
				projectId,
				changeOrderId,
			});
		},
		onSuccess: () => {
			toast.success(t("changeOrders.notifications.submitted"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: ["project-change-orders"],
			});
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Approve mutation
	const approveMutation = useMutation({
		mutationFn: async (note?: string) => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.projectChangeOrders.approve({
				organizationId: activeOrganization.id,
				projectId,
				changeOrderId,
				decisionNote: note,
			});
		},
		onSuccess: () => {
			toast.success(t("changeOrders.notifications.approved"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: ["project-change-orders"],
			});
			setIsDecisionDialogOpen(false);
			setDecisionNote("");
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Reject mutation
	const rejectMutation = useMutation({
		mutationFn: async (note?: string) => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.projectChangeOrders.reject({
				organizationId: activeOrganization.id,
				projectId,
				changeOrderId,
				decisionNote: note,
			});
		},
		onSuccess: () => {
			toast.success(t("changeOrders.notifications.rejected"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: ["project-change-orders"],
			});
			setIsDecisionDialogOpen(false);
			setDecisionNote("");
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Implement mutation
	const implementMutation = useMutation({
		mutationFn: async () => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.projectChangeOrders.implement({
				organizationId: activeOrganization.id,
				projectId,
				changeOrderId,
			});
		},
		onSuccess: () => {
			toast.success(t("changeOrders.notifications.implemented"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: ["project-change-orders"],
			});
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Update mutation
	const updateMutation = useMutation({
		mutationFn: async (data: {
			title: string;
			description?: string;
			category?: ChangeOrderCategory;
			costImpact?: number;
			timeImpactDays?: number;
			milestoneId?: string;
		}) => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.projectChangeOrders.update({
				organizationId: activeOrganization.id,
				projectId,
				changeOrderId,
				...data,
			});
		},
		onSuccess: () => {
			toast.success(t("changeOrders.notifications.updated"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: ["project-change-orders"],
			});
			setIsEditOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.projectChangeOrders.delete({
				organizationId: activeOrganization.id,
				projectId,
				changeOrderId,
			});
		},
		onSuccess: () => {
			toast.success(t("changeOrders.notifications.deleted"));
			queryClient.invalidateQueries({
				queryKey: ["project-change-orders"],
			});
			router.push(".");
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	if (!changeOrder) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<AlertTriangleIcon className="h-16 w-16 text-amber-500" />
				<p className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">
					{t("changeOrders.notFound")}
				</p>
				<Button asChild className="mt-4" variant="outline">
					<Link href=".">
						<ArrowLeftIcon className="me-2 h-4 w-4" />
						{t("changeOrders.backToList")}
					</Link>
				</Button>
			</div>
		);
	}

	const co = changeOrder as unknown as {
		id: string;
		coNo: number;
		title: string;
		description?: string | null;
		category: ChangeOrderCategory;
		status: ChangeOrderStatus;
		costImpact?: number | null;
		currency?: string | null;
		timeImpactDays?: number | null;
		requestedById: string;
		requestedBy: { id: string; name: string; email: string };
		requestedAt?: Date | null;
		decidedBy?: { id: string; name: string; email: string } | null;
		decidedAt?: Date | null;
		decisionNote?: string | null;
		implementedBy?: { id: string; name: string; email: string } | null;
		implementedAt?: Date | null;
		milestone?: { id: string; title: string } | null;
		claim?: { id: string; claimNo: number; amount: number } | null;
		createdAt: Date;
		updatedAt: Date;
	};

	const canEdit = co.status === "DRAFT";
	const canSubmit = co.status === "DRAFT";
	const canDecide = co.status === "SUBMITTED";
	const canImplement = co.status === "APPROVED";
	const canDelete = co.status === "DRAFT";

	return (
		<div className="space-y-6">
			{/* Back button and header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href=".">
						<ArrowLeftIcon className="h-5 w-5" />
					</Link>
				</Button>
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<span className="font-mono text-sm text-slate-500">CO-{co.coNo}</span>
						{getStatusBadge(co.status, t)}
					</div>
					<h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
						{co.title}
					</h1>
				</div>
			</div>

			{/* Impact Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card className="p-5">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/50">
							<DollarSignIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
						</div>
						<div>
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{t("changeOrders.fields.costImpact")}
							</p>
							<p
								className={`text-xl font-semibold ${
									co.costImpact && Number(co.costImpact) >= 0
										? "text-emerald-600 dark:text-emerald-400"
										: "text-red-600 dark:text-red-400"
								}`}
							>
								{co.costImpact
									? (Number(co.costImpact) > 0 ? "+" : "") +
										formatCurrency(co.costImpact)
									: "-"}
							</p>
						</div>
					</div>
				</Card>

				<Card className="p-5">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/50">
							<ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{t("changeOrders.fields.timeImpact")}
							</p>
							<p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
								{co.timeImpactDays !== null && co.timeImpactDays !== undefined
									? `${co.timeImpactDays > 0 ? "+" : ""}${co.timeImpactDays} ${t("common.days")}`
									: "-"}
							</p>
						</div>
					</div>
				</Card>

				<Card className="p-5">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-purple-100 p-2.5 dark:bg-purple-900/50">
							<FlagIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
						</div>
						<div>
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{t("changeOrders.fields.linkedMilestone")}
							</p>
							<p className="text-lg font-medium text-purple-600 dark:text-purple-400">
								{co.milestone?.title ?? "-"}
							</p>
						</div>
					</div>
				</Card>
			</div>

			{/* Details */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2 p-6 space-y-6">
					<div>
						<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
							{t("changeOrders.fields.description")}
						</h2>
						<p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
							{co.description || t("changeOrders.noDescription")}
						</p>
					</div>

					<div className="border-t pt-6">
						<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
							{t("changeOrders.fields.category")}
						</h2>
						<Badge variant="outline">
							{t(`changeOrders.category.${co.category}`)}
						</Badge>
					</div>

					{co.decisionNote && (
						<div className="border-t pt-6">
							<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
								{t("changeOrders.fields.decisionNote")}
							</h2>
							<p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
								{co.decisionNote}
							</p>
						</div>
					)}

					{/* Actions */}
					<div className="border-t pt-6 flex flex-wrap gap-3">
						{canEdit && (
							<Button variant="outline" onClick={() => setIsEditOpen(true)}>
								<EditIcon className="me-2 h-4 w-4" />
								{t("changeOrders.actions.edit")}
							</Button>
						)}
						{canSubmit && (
							<Button
								onClick={() => submitMutation.mutate()}
								disabled={submitMutation.isPending}
							>
								<SendIcon className="me-2 h-4 w-4" />
								{t("changeOrders.actions.submit")}
							</Button>
						)}
						{canDecide && (
							<>
								<Button
									variant="primary"
									onClick={() => {
										setDecisionType("approve");
										setIsDecisionDialogOpen(true);
									}}
								>
									<CheckCircleIcon className="me-2 h-4 w-4" />
									{t("changeOrders.actions.approve")}
								</Button>
								<Button
									variant="error"
									onClick={() => {
										setDecisionType("reject");
										setIsDecisionDialogOpen(true);
									}}
								>
									<XCircleIcon className="me-2 h-4 w-4" />
									{t("changeOrders.actions.reject")}
								</Button>
							</>
						)}
						{canImplement && (
							<Button
								onClick={() => implementMutation.mutate()}
								disabled={implementMutation.isPending}
							>
								<PlayIcon className="me-2 h-4 w-4" />
								{t("changeOrders.actions.implement")}
							</Button>
						)}
						{canDelete && (
							<Button
								variant="error"
								onClick={() => setIsDeleteDialogOpen(true)}
							>
								<TrashIcon className="me-2 h-4 w-4" />
								{t("changeOrders.actions.delete")}
							</Button>
						)}
					</div>
				</Card>

				{/* Sidebar */}
				<Card className="p-6 space-y-6">
					<div>
						<h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
							{t("changeOrders.fields.requestedBy")}
						</h3>
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
								<UserIcon className="h-4 w-4 text-slate-500" />
							</div>
							<div>
								<p className="font-medium text-slate-900 dark:text-slate-100">
									{co.requestedBy.name}
								</p>
							</div>
						</div>
						{co.requestedAt && (
							<p className="mt-1 text-sm text-slate-500">
								<CalendarIcon className="inline me-1 h-3 w-3" />
								{new Date(co.requestedAt).toLocaleDateString("ar-SA")}
							</p>
						)}
					</div>

					{co.decidedBy && (
						<div className="border-t pt-4">
							<h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
								{t("changeOrders.fields.decidedBy")}
							</h3>
							<div className="flex items-center gap-2">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
									<UserIcon className="h-4 w-4 text-slate-500" />
								</div>
								<div>
									<p className="font-medium text-slate-900 dark:text-slate-100">
										{co.decidedBy.name}
									</p>
								</div>
							</div>
							{co.decidedAt && (
								<p className="mt-1 text-sm text-slate-500">
									<CalendarIcon className="inline me-1 h-3 w-3" />
									{new Date(co.decidedAt).toLocaleDateString("ar-SA")}
								</p>
							)}
						</div>
					)}

					{co.implementedBy && (
						<div className="border-t pt-4">
							<h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
								{t("changeOrders.fields.implementedBy")}
							</h3>
							<div className="flex items-center gap-2">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
									<UserIcon className="h-4 w-4 text-slate-500" />
								</div>
								<div>
									<p className="font-medium text-slate-900 dark:text-slate-100">
										{co.implementedBy.name}
									</p>
								</div>
							</div>
							{co.implementedAt && (
								<p className="mt-1 text-sm text-slate-500">
									<CalendarIcon className="inline me-1 h-3 w-3" />
									{new Date(co.implementedAt).toLocaleDateString("ar-SA")}
								</p>
							)}
						</div>
					)}

					<div className="border-t pt-4">
						<h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
							{t("changeOrders.fields.createdAt")}
						</h3>
						<p className="text-sm text-slate-600 dark:text-slate-400">
							{new Date(co.createdAt).toLocaleDateString("ar-SA", {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</p>
					</div>
				</Card>
			</div>

			{/* Edit Dialog */}
			<CreateChangeOrderForm
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
				projectId={projectId}
				onSubmit={(data) => updateMutation.mutate(data)}
				isLoading={updateMutation.isPending}
				editData={{
					...co,
					costImpact: co.costImpact?.toString() ?? null,
				}}
			/>

			{/* Decision Dialog */}
			<AlertDialog
				open={isDecisionDialogOpen}
				onOpenChange={setIsDecisionDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{decisionType === "approve"
								? t("changeOrders.dialog.approveTitle")
								: t("changeOrders.dialog.rejectTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{decisionType === "approve"
								? t("changeOrders.dialog.approveDescription")
								: t("changeOrders.dialog.rejectDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="my-4">
						<Textarea
							placeholder={t("changeOrders.dialog.notePlaceholder")}
							value={decisionNote}
							onChange={(e) => setDecisionNote(e.target.value)}
							rows={3}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (decisionType === "approve") {
									approveMutation.mutate(decisionNote || undefined);
								} else {
									rejectMutation.mutate(decisionNote || undefined);
								}
							}}
							className={
								decisionType === "reject"
									? "bg-red-600 hover:bg-red-700"
									: ""
							}
						>
							{decisionType === "approve"
								? t("changeOrders.actions.approve")
								: t("changeOrders.actions.reject")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Delete Dialog */}
			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("changeOrders.dialog.deleteTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("changeOrders.dialog.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteMutation.mutate()}
							className="bg-red-600 hover:bg-red-700"
						>
							{t("changeOrders.actions.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
