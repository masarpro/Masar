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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Card, CardContent } from "@ui/components/card";
import { toast } from "sonner";
import {
	ClipboardCheck,
	Eye,
	Loader2,
	Plus,
	Trash2,
	Banknote,
	TrendingUp,
	Clock,
} from "lucide-react";
import Link from "next/link";
import { SubcontractTabs } from "./SubcontractTabs";

interface SubcontractClaimsListViewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	subcontractId: string;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

function formatDate(date: string | Date): string {
	return new Intl.DateTimeFormat("ar-SA", {
		year: "numeric",
		month: "short",
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

export function SubcontractClaimsListView({
	organizationId,
	organizationSlug,
	projectId,
	subcontractId,
}: SubcontractClaimsListViewProps) {
	const t = useTranslations("claims");
	const tCommon = useTranslations("subcontracts");
	const router = useRouter();
	const queryClient = useQueryClient();

	const [deleteClaimId, setDeleteClaimId] = useState<string | null>(null);

	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance/subcontracts/${subcontractId}`;

	// Fetch contract details
	const { data: contract } = useQuery(
		orpc.subcontracts.get.queryOptions({
			input: { organizationId, projectId, contractId: subcontractId },
		}),
	);

	// Fetch claims
	const { data: claims, isLoading } = useQuery(
		orpc.subcontracts.listClaims.queryOptions({
			input: { organizationId, projectId, contractId: subcontractId },
		}),
	);

	// Fetch summary
	const { data: summary } = useQuery(
		orpc.subcontracts.getClaimSummary.queryOptions({
			input: { organizationId, projectId, contractId: subcontractId },
		}),
	);

	// Delete mutation
	const deleteMutation = useMutation({
		...orpc.subcontracts.deleteClaim.mutationOptions(),
		onSuccess: () => {
			toast.success(t("actions.delete") + " ✓");
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			setDeleteClaimId(null);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const totalClaimed = summary?.totalClaimed ?? 0;
	const totalPaid = summary?.totalPaid ?? 0;
	const totalOutstanding = summary?.totalOutstanding ?? 0;

	return (
		<div className="space-y-6">
			{/* Navigation Tabs */}
			<SubcontractTabs
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				projectId={projectId}
				subcontractId={subcontractId}
			/>

			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">{t("subcontractClaims")}</h1>
					{contract && (
						<p className="text-muted-foreground mt-1">
							{contract.name}
						</p>
					)}
				</div>
				<Link href={`${basePath}/claims/new`}>
					<Button>
						<Plus className="h-4 w-4 me-2" />
						{t("newClaim")}
					</Button>
				</Link>
			</div>

			{/* Summary Cards */}
			{summary && (
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-blue-50 p-2.5">
									<TrendingUp className="h-5 w-5 text-blue-600" />
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										{t("summary.totalClaimed")}
									</p>
									<p className="text-xl font-bold tabular-nums" dir="ltr">
										{formatCurrency(totalClaimed)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-green-50 p-2.5">
									<Banknote className="h-5 w-5 text-green-600" />
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										{t("summary.totalPaid")}
									</p>
									<p className="text-xl font-bold tabular-nums" dir="ltr">
										{formatCurrency(totalPaid)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-orange-50 p-2.5">
									<Clock className="h-5 w-5 text-orange-600" />
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										{t("summary.totalOutstanding")}
									</p>
									<p className="text-xl font-bold tabular-nums" dir="ltr">
										{formatCurrency(totalOutstanding)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Claims Table */}
			{!claims?.length ? (
				<div className="rounded-xl border border-dashed p-12 text-center">
					<ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
					<p className="text-lg font-medium">{t("empty.title")}</p>
					<p className="text-muted-foreground mt-1">{t("empty.description")}</p>
					<Link href={`${basePath}/claims/new`}>
						<Button variant="outline" className="mt-4">
							<Plus className="h-4 w-4 me-2" />
							{t("newClaim")}
						</Button>
					</Link>
				</div>
			) : (
				<div className="rounded-xl border overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/50">
								<TableHead className="w-16">{t("claimNo")}</TableHead>
								<TableHead>{t("claimTitle")}</TableHead>
								<TableHead className="w-28 text-center">{t("period")}</TableHead>
								<TableHead className="w-32 text-center">{t("grossAmount")}</TableHead>
								<TableHead className="w-32 text-center">{t("netAmount")}</TableHead>
								<TableHead className="w-28 text-center">{t("status")}</TableHead>
								<TableHead className="w-16" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{claims.map((claim) => (
								<TableRow
									key={claim.id}
									className="group cursor-pointer hover:bg-muted/30"
									onClick={() =>
										router.push(`${basePath}/claims/${claim.id}`)
									}
								>
									<TableCell className="font-mono text-sm font-medium">
										#{claim.claimNo}
									</TableCell>
									<TableCell>
										<div className="font-medium">{claim.title}</div>
										{claim.createdBy && (
											<div className="text-xs text-muted-foreground">
												{claim.createdBy.name}
											</div>
										)}
									</TableCell>
									<TableCell className="text-center text-sm text-muted-foreground">
										{formatDate(claim.periodStart)}
									</TableCell>
									<TableCell className="text-center tabular-nums" dir="ltr">
										{formatCurrency(claim.grossAmount)}
									</TableCell>
									<TableCell className="text-center tabular-nums font-medium" dir="ltr">
										{formatCurrency(claim.netAmount)}
									</TableCell>
									<TableCell className="text-center">
										<Badge
											variant="outline"
											className={`text-xs ${statusColors[claim.status] ?? ""}`}
										>
											{t(`status.${claim.status}`)}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7"
												onClick={(e) => {
													e.stopPropagation();
													router.push(`${basePath}/claims/${claim.id}`);
												}}
											>
												<Eye className="h-3.5 w-3.5" />
											</Button>
											{claim.status === "DRAFT" && (
												<Button
													variant="ghost"
													size="icon"
													className="h-7 w-7 text-destructive"
													onClick={(e) => {
														e.stopPropagation();
														setDeleteClaimId(claim.id);
													}}
												>
													<Trash2 className="h-3.5 w-3.5" />
												</Button>
											)}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deleteClaimId}
				onOpenChange={(open) => !open && setDeleteClaimId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("actions.delete")}</AlertDialogTitle>
						<AlertDialogDescription>
							هل أنت متأكد من حذف هذا المستخلص؟
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>إلغاء</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() => {
								if (deleteClaimId) {
									deleteMutation.mutate({
										organizationId,
										projectId,
										claimId: deleteClaimId,
									});
								}
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
