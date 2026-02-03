"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface Claim {
	id: string;
	claimNo: number;
	periodStart: Date | null;
	periodEnd: Date | null;
	amount: number;
	dueDate: Date | null;
	status: "DRAFT" | "SUBMITTED" | "APPROVED" | "PAID" | "REJECTED";
	note: string | null;
	createdBy: { id: string; name: string };
	createdAt: Date;
}

interface ClaimsTableProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	claims: Claim[];
	onRefresh: () => void;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

function getStatusBadge(
	status: string,
	t: (key: string) => string,
): React.ReactNode {
	const statusConfig: Record<
		string,
		{ className: string; label: string }
	> = {
		DRAFT: {
			className:
				"bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
			label: t("finance.status.DRAFT"),
		},
		SUBMITTED: {
			className:
				"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
			label: t("finance.status.SUBMITTED"),
		},
		APPROVED: {
			className:
				"bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
			label: t("finance.status.APPROVED"),
		},
		PAID: {
			className:
				"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
			label: t("finance.status.PAID"),
		},
		REJECTED: {
			className:
				"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
			label: t("finance.status.REJECTED"),
		},
	};

	const config = statusConfig[status] || statusConfig.DRAFT;
	return <Badge className={`border-0 ${config.className}`}>{config.label}</Badge>;
}

export function ClaimsTable({
	organizationId,
	organizationSlug,
	projectId,
	claims,
	onRefresh,
}: ClaimsTableProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance`;

	const updateStatusMutation = useMutation({
		...orpc.projectFinance.updateClaimStatus.mutationOptions(),
		onSuccess: () => {
			toast.success(t("finance.notifications.statusUpdated"));
			queryClient.invalidateQueries({ queryKey: ["projectFinance"] });
			onRefresh();
		},
		onError: () => {
			toast.error(t("finance.notifications.statusUpdateError"));
		},
	});

	const handleStatusChange = (
		claimId: string,
		newStatus: "DRAFT" | "SUBMITTED" | "APPROVED" | "PAID" | "REJECTED",
	) => {
		updateStatusMutation.mutate({
			organizationId,
			projectId,
			claimId,
			status: newStatus,
		});
	};

	if (claims.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<div className="mb-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
					<FileText className="h-8 w-8 text-slate-400" />
				</div>
				<p className="mb-4 text-slate-500 dark:text-slate-400">
					{t("finance.claims.empty")}
				</p>
				<Button asChild className="rounded-xl">
					<Link href={`${basePath}/new-claim`}>
						<Plus className="me-2 h-4 w-4" />
						{t("finance.claims.new")}
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-slate-200 dark:border-slate-800">
			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead className="text-start">
							{t("finance.claims.claimNo")}
						</TableHead>
						<TableHead className="text-start">
							{t("finance.claims.period")}
						</TableHead>
						<TableHead className="text-start">
							{t("finance.claims.amount")}
						</TableHead>
						<TableHead className="text-start">
							{t("finance.claims.dueDate")}
						</TableHead>
						<TableHead className="text-start">
							{t("finance.claims.status")}
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{claims.map((claim) => (
						<TableRow key={claim.id}>
							<TableCell className="font-medium">#{claim.claimNo}</TableCell>
							<TableCell>
								{claim.periodStart && claim.periodEnd ? (
									<span className="text-sm text-slate-600 dark:text-slate-400">
										{format(new Date(claim.periodStart), "dd/MM/yyyy", {
											locale: ar,
										})}{" "}
										-{" "}
										{format(new Date(claim.periodEnd), "dd/MM/yyyy", {
											locale: ar,
										})}
									</span>
								) : (
									"-"
								)}
							</TableCell>
							<TableCell className="font-semibold">
								{formatCurrency(claim.amount)}
							</TableCell>
							<TableCell>
								{claim.dueDate
									? format(new Date(claim.dueDate), "dd/MM/yyyy", { locale: ar })
									: "-"}
							</TableCell>
							<TableCell>
								<Select
									value={claim.status}
									onValueChange={(value) =>
										handleStatusChange(
											claim.id,
											value as "DRAFT" | "SUBMITTED" | "APPROVED" | "PAID" | "REJECTED",
										)
									}
									disabled={updateStatusMutation.isPending}
								>
									<SelectTrigger className="h-8 w-32 border-0 bg-transparent p-0">
										<SelectValue>
											{getStatusBadge(claim.status, t)}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="DRAFT">
											{t("finance.status.DRAFT")}
										</SelectItem>
										<SelectItem value="SUBMITTED">
											{t("finance.status.SUBMITTED")}
										</SelectItem>
										<SelectItem value="APPROVED">
											{t("finance.status.APPROVED")}
										</SelectItem>
										<SelectItem value="PAID">
											{t("finance.status.PAID")}
										</SelectItem>
										<SelectItem value="REJECTED">
											{t("finance.status.REJECTED")}
										</SelectItem>
									</SelectContent>
								</Select>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
