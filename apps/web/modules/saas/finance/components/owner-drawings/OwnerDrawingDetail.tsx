"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Textarea } from "@ui/components/textarea";
import {
	AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
	AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@ui/components/alert-dialog";
import { toast } from "sonner";
import {
	ArrowRight, Printer, Ban, UserMinus,
	Calendar, User, Building, Banknote, Link2, AlertTriangle,
} from "lucide-react";
import { formatDate } from "@shared/lib/formatters";
import { Currency } from "../shared/Currency";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

interface OwnerDrawingDetailProps {
	organizationId: string;
	organizationSlug: string;
	drawingId: string;
}

const STATUS_COLORS: Record<string, string> = {
	APPROVED: "bg-green-100 text-green-700",
	CANCELLED: "bg-red-100 text-red-700",
};

const TYPE_COLORS: Record<string, string> = {
	COMPANY_LEVEL: "border-blue-300 text-blue-700 bg-blue-50",
	PROJECT_SPECIFIC: "border-purple-300 text-purple-700 bg-purple-50",
};

export function OwnerDrawingDetail({
	organizationId,
	organizationSlug,
	drawingId,
}: OwnerDrawingDetailProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [cancelReason, setCancelReason] = useState("");

	const basePath = `/app/${organizationSlug}/finance/owner-drawings`;

	const { data: rawDrawing, isLoading } = useQuery(
		orpc.accounting.ownerDrawings.getById.queryOptions({
			input: { organizationId, id: drawingId },
		}),
	);
	const drawing = rawDrawing as any;

	const invalidate = () => {
		queryClient.invalidateQueries({ queryKey: ["accounting", "ownerDrawings"] });
	};

	const cancelMutation = useMutation({
		mutationFn: () =>
			orpcClient.accounting.ownerDrawings.cancel({
				organizationId,
				id: drawingId,
				cancelReason: cancelReason || undefined,
			}),
		onSuccess: () => {
			invalidate();
			toast.success(t("finance.ownerDrawings.cancelled"));
			setShowCancelDialog(false);
			setCancelReason("");
		},
		onError: () => {
			toast.error(t("common.error"));
			setShowCancelDialog(false);
		},
	});

	if (isLoading || !drawing) return <ListTableSkeleton rows={6} cols={2} />;

	const journalEntryPath = drawing.journalEntry
		? `/app/${organizationSlug}/finance/journal-entries/${drawing.journalEntry.id}`
		: null;

	return (
		<div className="space-y-6">
			{/* ═══ Print-only formal drawing document ═══ */}
			<div className="hidden print:block print:space-y-4">
				<div className="text-center border-b-2 border-black pb-3 mb-4">
					<h1 className="text-2xl font-bold">{t("finance.ownerDrawings.drawingVoucher")}</h1>
					<p className="text-sm text-gray-500">OWNER DRAWING VOUCHER</p>
				</div>
				<div className="flex justify-between text-sm mb-4">
					<div>
						<span className="font-medium">{t("finance.ownerDrawings.drawingNo")}:</span>{" "}
						<span className="font-mono">{drawing.drawingNo}</span>
					</div>
					<div>
						<span className="font-medium">{t("finance.ownerDrawings.date")}:</span>{" "}
						{formatDate(drawing.date)}
					</div>
				</div>
				<table className="w-full border-collapse text-sm">
					<tbody>
						<tr className="border border-gray-400">
							<td className="p-2 font-medium bg-gray-50 w-1/4 border-e border-gray-400">
								{t("finance.ownerDrawings.ownerName")}
							</td>
							<td className="p-2">{drawing.owner?.name ?? "-"}</td>
						</tr>
						<tr className="border border-gray-400">
							<td className="p-2 font-medium bg-gray-50 border-e border-gray-400">
								{t("finance.ownerDrawings.amount")}
							</td>
							<td className="p-2 font-bold text-lg">
								{new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR" }).format(Number(drawing.amount))}
							</td>
						</tr>
						<tr className="border border-gray-400">
							<td className="p-2 font-medium bg-gray-50 border-e border-gray-400">
								{t("finance.ownerDrawings.type")}
							</td>
							<td className="p-2">{t(`finance.ownerDrawings.types.${drawing.type}`)}</td>
						</tr>
						{drawing.project && (
							<tr className="border border-gray-400">
								<td className="p-2 font-medium bg-gray-50 border-e border-gray-400">
									{t("finance.ownerDrawings.project")}
								</td>
								<td className="p-2">{drawing.project.name}</td>
							</tr>
						)}
						{drawing.bankAccount && (
							<tr className="border border-gray-400">
								<td className="p-2 font-medium bg-gray-50 border-e border-gray-400">
									{t("finance.ownerDrawings.bankAccount")}
								</td>
								<td className="p-2">{drawing.bankAccount.name}</td>
							</tr>
						)}
						{drawing.description && (
							<tr className="border border-gray-400">
								<td className="p-2 font-medium bg-gray-50 border-e border-gray-400">
									{t("finance.ownerDrawings.description")}
								</td>
								<td className="p-2">{drawing.description}</td>
							</tr>
						)}
					</tbody>
				</table>
				{/* Signature boxes */}
				<div className="mt-16 grid grid-cols-3 gap-6 text-center text-sm">
					<div>
						<p className="mb-8">{drawing.createdBy?.name ?? ""}</p>
						<div className="border-b border-black mx-4 mb-1" />
						<p>{t("print.preparedBy")}</p>
					</div>
					<div>
						<p className="mb-8">{drawing.approvedBy?.name ?? ""}</p>
						<div className="border-b border-black mx-4 mb-1" />
						<p>{t("print.approvedBy")}</p>
					</div>
					<div>
						<p className="mb-8" />
						<div className="border-b border-black mx-4 mb-1" />
						<p>{t("print.receiver")}</p>
					</div>
				</div>
			</div>
			{/* ═══ End print-only section ═══ */}

			{/* Header — hidden on print */}
			<div className="flex items-center justify-between print:hidden">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="icon" onClick={() => router.push(basePath)}>
						<ArrowRight className="h-4 w-4" />
					</Button>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold font-mono">{drawing.drawingNo}</h1>
							<Badge className={STATUS_COLORS[drawing.status] ?? ""}>
								{t(`finance.ownerDrawings.statuses.${drawing.status}`)}
							</Badge>
							<Badge variant="outline" className={TYPE_COLORS[drawing.type] ?? ""}>
								{t(`finance.ownerDrawings.types.${drawing.type}`)}
							</Badge>
						</div>
						{drawing.hasOverdrawWarning && (
							<div className="mt-1 flex items-center gap-1 text-sm text-amber-600">
								<AlertTriangle className="h-3 w-3" />
								{t("finance.ownerDrawings.overdrawAcknowledged")}
							</div>
						)}
					</div>
				</div>

				<div className="flex gap-2">
					{drawing.status === "APPROVED" && (
						<>
							<Button variant="outline" onClick={() => window.print()}>
								<Printer className="me-2 h-4 w-4" />
								{t("finance.ownerDrawings.actions.print")}
							</Button>
							<Button variant="error" onClick={() => setShowCancelDialog(true)}>
								<Ban className="me-2 h-4 w-4" />
								{t("finance.ownerDrawings.actions.cancel")}
							</Button>
						</>
					)}
				</div>
			</div>

			{/* Main Info */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 print:hidden">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<UserMinus className="h-5 w-5" />
							{t("finance.ownerDrawings.drawingDetails")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<InfoRow
							label={t("finance.ownerDrawings.date")}
							value={formatDate(drawing.date)}
							icon={<Calendar className="h-4 w-4" />}
						/>
						<InfoRow
							label={t("finance.ownerDrawings.amount")}
							value={<Currency amount={Number(drawing.amount)} />}
						/>
						<InfoRow
							label={t("finance.ownerDrawings.ownerName")}
							value={drawing.owner?.name ?? "-"}
							icon={<User className="h-4 w-4" />}
						/>
						{drawing.owner?.ownershipPercent != null && (
							<InfoRow
								label={t("finance.ownerDrawings.ownershipPercent")}
								value={`${drawing.owner.ownershipPercent}%`}
							/>
						)}
						<InfoRow
							label={t("finance.ownerDrawings.type")}
							value={
								<Badge variant="outline" className={TYPE_COLORS[drawing.type] ?? ""}>
									{t(`finance.ownerDrawings.types.${drawing.type}`)}
								</Badge>
							}
						/>
						{drawing.bankAccount && (
							<InfoRow
								label={t("finance.ownerDrawings.bankAccount")}
								value={drawing.bankAccount.name}
								icon={<Banknote className="h-4 w-4" />}
							/>
						)}
					</CardContent>
				</Card>

				<div className="space-y-6">
					{/* Linked Info */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Link2 className="h-5 w-5" />
								{t("finance.ownerDrawings.linkedInfo")}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{drawing.project && (
								<InfoRow
									label={t("finance.ownerDrawings.project")}
									value={drawing.project.name}
									icon={<Building className="h-4 w-4" />}
								/>
							)}
							{drawing.journalEntry && (
								<InfoRow
									label={t("finance.ownerDrawings.journalEntry")}
									value={
										<Button
											variant="link"
											className="h-auto p-0 text-sm"
											onClick={() => journalEntryPath && router.push(journalEntryPath)}
										>
											{drawing.journalEntry.entryNo}
										</Button>
									}
								/>
							)}
							{drawing.description && (
								<InfoRow
									label={t("finance.ownerDrawings.description")}
									value={drawing.description}
								/>
							)}
							{drawing.notes && (
								<InfoRow
									label={t("finance.ownerDrawings.notes")}
									value={drawing.notes}
								/>
							)}
						</CardContent>
					</Card>

					{/* Overdraw Info */}
					{drawing.hasOverdrawWarning && (
						<Card className="border-amber-200 bg-amber-50/50">
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center gap-2 text-base text-amber-700">
									<AlertTriangle className="h-4 w-4" />
									{t("finance.ownerDrawings.overdrawInfo")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								<InfoRow
									label={t("finance.ownerDrawings.overdrawAmount")}
									value={
										<span className="text-amber-700 font-bold">
											<Currency amount={drawing.overdrawAmount ?? 0} />
										</span>
									}
								/>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{/* Audit Info */}
			<Card className="print:hidden">
				<CardContent className="flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground">
					<span>{t("common.createdAt")}: {formatDate(drawing.createdAt)}</span>
					{drawing.createdBy && (
						<span>{t("finance.ownerDrawings.createdBy")}: {drawing.createdBy.name}</span>
					)}
					{drawing.approvedBy && (
						<span>{t("finance.ownerDrawings.approvedBy")}: {drawing.approvedBy.name}</span>
					)}
					{drawing.approvedAt && (
						<span>{t("finance.ownerDrawings.approvedAt")}: {formatDate(drawing.approvedAt)}</span>
					)}
					{drawing.status === "CANCELLED" && (
						<>
							{drawing.cancelledAt && (
								<span className="text-red-600">
									{t("finance.ownerDrawings.cancelledAt")}: {formatDate(drawing.cancelledAt)}
								</span>
							)}
							{drawing.cancelReason && (
								<span className="text-red-600">
									{t("finance.ownerDrawings.cancelReason")}: {drawing.cancelReason}
								</span>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Cancel Dialog */}
			<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("finance.ownerDrawings.cancelDialog.title")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.ownerDrawings.cancelDialog.description")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="py-4">
						<Textarea
							placeholder={t("finance.ownerDrawings.cancelDialog.reasonPlaceholder")}
							value={cancelReason}
							onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelReason(e.target.value)}
							rows={3}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => cancelMutation.mutate()}
							disabled={cancelMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("finance.ownerDrawings.cancelDialog.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-2">
			<span className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</span>
			<span className="text-sm font-medium text-end">{value}</span>
		</div>
	);
}
