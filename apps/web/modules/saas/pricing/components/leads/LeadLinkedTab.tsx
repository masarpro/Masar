"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@ui/components/button";
import {
	Calculator,
	FileSpreadsheet,
	Link2,
	Unlink,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { formatDate } from "@saas/finance/lib/utils";
import { LinkCostStudyDialog } from "./LinkCostStudyDialog";
import { LinkQuotationDialog } from "./LinkQuotationDialog";

interface LeadLinkedTabProps {
	leadId: string;
	organizationId: string;
	organizationSlug: string;
	costStudy?: {
		id: string;
		name: string | null;
		totalCost: number;
		projectType?: string | null;
		createdAt: string | Date;
	} | null;
	quotation?: {
		id: string;
		quotationNo?: string | null;
		totalAmount: number;
		status?: string | null;
		validUntil?: string | Date | null;
	} | null;
}

export function LeadLinkedTab({
	leadId,
	organizationId,
	organizationSlug,
	costStudy,
	quotation,
}: LeadLinkedTabProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [unlinkType, setUnlinkType] = useState<"costStudy" | "quotation" | null>(null);
	const [showLinkCS, setShowLinkCS] = useState(false);
	const [showLinkQ, setShowLinkQ] = useState(false);
	const basePath = `/app/${organizationSlug}/pricing`;

	const invalidate = () => {
		queryClient.invalidateQueries({
			queryKey: orpc.pricing.leads.getById.queryOptions({ input: { organizationId, leadId } }).queryKey,
		});
	};

	const unlinkCostStudyMutation = useMutation(
		orpc.pricing.leads.unlinkCostStudy.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.leads.detail.unlinked"));
				invalidate();
				setUnlinkType(null);
			},
			onError: () => {
				toast.error(t("pricing.leads.detail.unlinkError"));
			},
		}),
	);

	const unlinkQuotationMutation = useMutation(
		orpc.pricing.leads.unlinkQuotation.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.leads.detail.unlinked"));
				invalidate();
				setUnlinkType(null);
			},
			onError: () => {
				toast.error(t("pricing.leads.detail.unlinkError"));
			},
		}),
	);

	const handleUnlink = () => {
		if (unlinkType === "costStudy") {
			unlinkCostStudyMutation.mutate({ organizationId, leadId });
		} else if (unlinkType === "quotation") {
			unlinkQuotationMutation.mutate({ organizationId, leadId });
		}
	};

	return (
		<div className="space-y-4">
			{/* Cost Study */}
			<div className="rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50">
				<div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
					<h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
						<div className="h-[30px] w-[30px] rounded-lg bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center">
							<Calculator className="h-4 w-4 text-sky-600 dark:text-sky-400" />
						</div>
						{t("pricing.leads.detail.costStudy")}
					</h3>
				</div>
				<div className="p-5">
					{costStudy ? (
						<div className="rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/50 p-4">
							<div className="flex items-center justify-between">
								<div>
									<Link
										href={`${basePath}/studies/${costStudy.id}`}
										className="text-sm font-medium text-primary hover:underline"
									>
										{costStudy.name ?? "—"}
									</Link>
									<div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
										<span>{new Intl.NumberFormat("en-SA").format(costStudy.totalCost)} ر.س</span>
										<span>{formatDate(costStudy.createdAt)}</span>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="rounded-lg text-destructive"
									onClick={() => setUnlinkType("costStudy")}
								>
									<Unlink className="me-1 h-4 w-4" />
									{t("pricing.leads.detail.unlink")}
								</Button>
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center py-6 text-center">
							<Calculator className="h-10 w-10 text-muted-foreground/40 mb-2" />
							<p className="text-sm text-muted-foreground">{t("pricing.leads.detail.noCostStudy")}</p>
							<Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={() => setShowLinkCS(true)}>
								<Link2 className="me-2 h-4 w-4" />
								{t("pricing.leads.detail.linkCostStudy")}
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Quotation */}
			<div className="rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50">
				<div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
					<h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
						<div className="h-[30px] w-[30px] rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
							<FileSpreadsheet className="h-4 w-4 text-orange-600 dark:text-orange-400" />
						</div>
						{t("pricing.leads.detail.quotation")}
					</h3>
				</div>
				<div className="p-5">
					{quotation ? (
						<div className="rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/50 p-4">
							<div className="flex items-center justify-between">
								<div>
									<Link
										href={`${basePath}/quotations/${quotation.id}`}
										className="text-sm font-medium text-primary hover:underline"
									>
										{quotation.quotationNo || t("pricing.leads.detail.quotation")}
									</Link>
									<div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
										<span>{new Intl.NumberFormat("en-SA").format(quotation.totalAmount)} ر.س</span>
										{quotation.status && (
											<span className="inline-flex rounded-md bg-muted/50 px-2 py-0.5 text-xs font-medium">
												{quotation.status}
											</span>
										)}
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="rounded-lg text-destructive"
									onClick={() => setUnlinkType("quotation")}
								>
									<Unlink className="me-1 h-4 w-4" />
									{t("pricing.leads.detail.unlink")}
								</Button>
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center py-6 text-center">
							<FileSpreadsheet className="h-10 w-10 text-muted-foreground/40 mb-2" />
							<p className="text-sm text-muted-foreground">{t("pricing.leads.detail.noQuotation")}</p>
							<Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={() => setShowLinkQ(true)}>
								<Link2 className="me-2 h-4 w-4" />
								{t("pricing.leads.detail.linkQuotation")}
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Unlink Confirmation */}
			<AlertDialog open={!!unlinkType} onOpenChange={(open) => !open && setUnlinkType(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("pricing.leads.detail.unlinkConfirm")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("pricing.leads.detail.unlinkDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("pricing.leads.form.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleUnlink}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("pricing.leads.detail.unlink")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Link Dialogs */}
			<LinkCostStudyDialog
				open={showLinkCS}
				onOpenChange={setShowLinkCS}
				leadId={leadId}
				organizationId={organizationId}
			/>
			<LinkQuotationDialog
				open={showLinkQ}
				onOpenChange={setShowLinkQ}
				leadId={leadId}
				organizationId={organizationId}
			/>
		</div>
	);
}
