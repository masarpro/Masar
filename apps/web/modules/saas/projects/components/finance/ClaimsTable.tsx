"use client";

import { formatSAR } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { EmptyState } from "@ui/components/empty-state";
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
import { Checkbox } from "@ui/components/checkbox";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { FileText, Plus, Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MobileDocList, MobileDocRow } from "@saas/shared/components/mobile/MobileDocRow";
import { BulkActionsBar } from "../../../../ui/components/bulk-actions-bar";
import { exportTableToCsv } from "../../../../../lib/export-table";

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
				"bg-muted text-muted-foreground",
			label: t("finance.status.DRAFT"),
		},
		SUBMITTED: {
			className:
				"bg-chart-4/15 text-chart-4",
			label: t("finance.status.SUBMITTED"),
		},
		APPROVED: {
			className:
				"bg-chart-4/15 text-chart-4",
			label: t("finance.status.APPROVED"),
		},
		PAID: {
			className:
				"bg-success/15 text-success",
			label: t("finance.status.PAID"),
		},
		REJECTED: {
			className:
				"bg-destructive/15 text-destructive",
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
	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance/claims`;
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const toggleRow = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};
	const toggleAllPage = () => {
		if (claims.length > 0 && selectedIds.size === claims.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(claims.map((c) => c.id)));
		}
	};
	const clearSelection = () => setSelectedIds(new Set());
	const selectedClaims = claims.filter((c) => selectedIds.has(c.id));

	const updateStatusMutation = useMutation({
		...orpc.projectFinance.updateClaimStatus.mutationOptions(),
		onSuccess: () => {
			toast.success(t("finance.notifications.statusUpdated"));
			queryClient.invalidateQueries({ queryKey: orpc.projectFinance.key() });
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

	// حالة المستخلص — عنصر مشترك بين الجدول (ديسكتوب) وبطاقات الجوال
	const renderStatusSelect = (claim: Claim) => (
		<Select
			value={claim.status}
			onValueChange={(value: any) =>
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
	);

	if (claims.length === 0) {
		return (
			<EmptyState
				icon={<FileText className="h-8 w-8" />}
				description={t("finance.claims.empty")}
			>
				<Button asChild className="rounded-xl">
					<Link href={`${basePath}/new`}>
						<Plus className="me-2 h-4 w-4" />
						{t("finance.claims.new")}
					</Link>
				</Button>
			</EmptyState>
		);
	}

	return (
		<>
			{/* الجوال: صفوف مستندات بسطرين بدل الجدول متعدد الأعمدة */}
			<MobileDocList className="sm:hidden">
				{claims.map((claim) => (
					<MobileDocRow
						key={claim.id}
						title={`#${claim.claimNo}`}
						subtitle={
							claim.periodStart && claim.periodEnd
								? `${format(new Date(claim.periodStart), "dd/MM/yyyy", {
										locale: ar,
									})} - ${format(new Date(claim.periodEnd), "dd/MM/yyyy", {
										locale: ar,
									})}`
								: claim.dueDate
									? format(new Date(claim.dueDate), "dd/MM/yyyy", {
											locale: ar,
										})
									: undefined
						}
						amount={formatSAR(claim.amount)}
						badge={renderStatusSelect(claim)}
					/>
				))}
			</MobileDocList>

			<div className="hidden sm:block rounded-xl border-2">
			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead className="w-10">
							<Checkbox
								checked={claims.length > 0 && selectedIds.size === claims.length}
								onCheckedChange={toggleAllPage}
								aria-label={t("common.selectAll")}
							/>
						</TableHead>
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
							<TableCell>
								<Checkbox
									checked={selectedIds.has(claim.id)}
									onCheckedChange={() => toggleRow(claim.id)}
									aria-label={`${t("common.select")} #${claim.claimNo}`}
								/>
							</TableCell>
							<TableCell className="font-medium">#{claim.claimNo}</TableCell>
							<TableCell>
								{claim.periodStart && claim.periodEnd ? (
									<span className="text-sm text-muted-foreground">
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
								{formatSAR(claim.amount)}
							</TableCell>
							<TableCell>
								{claim.dueDate
									? format(new Date(claim.dueDate), "dd/MM/yyyy", { locale: ar })
									: "-"}
							</TableCell>
							<TableCell>{renderStatusSelect(claim)}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{/* Bulk Actions */}
			<BulkActionsBar
				selectedCount={selectedIds.size}
				totalCount={claims.length}
				selectedIds={Array.from(selectedIds)}
				onClearSelection={clearSelection}
				actions={[
					{
						label: t("common.export"),
						icon: <Download className="h-4 w-4 me-1.5" />,
						onClick: () => {
							exportTableToCsv(
								selectedClaims as unknown as Record<string, unknown>[],
								[
									{ key: "claimNo", label: t("finance.claims.claimNo") },
									{ key: "amount", label: t("finance.claims.amount") },
									{ key: "status", label: t("finance.claims.status") },
								],
								"claims",
							);
							clearSelection();
						},
					},
				]}
			/>
			</div>
		</>
	);
}
