"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { EmptyState } from "@ui/components/empty-state";
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
import { FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { formatDate } from "@saas/finance/lib/utils";
import { Currency } from "@saas/finance/components/shared/Currency";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { MobileDocList, MobileDocRow } from "@saas/shared/components/mobile/MobileDocRow";

interface DraftsTableProps {
	kind: "invoice" | "quotation";
	organizationId: string;
	organizationSlug: string;
}

export function DraftsTable({ kind, organizationId, organizationSlug }: DraftsTableProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const isInvoice = kind === "invoice";
	const listOptions = isInvoice
		? orpc.finance.invoices.drafts.list.queryOptions({ input: { organizationId } })
		: orpc.pricing.quotations.drafts.list.queryOptions({ input: { organizationId } });
	const queryKey = isInvoice ? orpc.finance.invoices.drafts.key() : orpc.pricing.quotations.drafts.key();
	const editBasePath = isInvoice
		? `/app/${organizationSlug}/finance/invoices/drafts`
		: `/app/${organizationSlug}/pricing/quotations/drafts`;

	const { data, isLoading } = useQuery(listOptions);
	const drafts: any[] = (data as any)?.drafts ?? [];

	const handleDiscard = async (id: string) => {
		try {
			if (isInvoice) {
				await orpcClient.finance.invoices.drafts.delete({ organizationId, id });
			} else {
				await orpcClient.pricing.quotations.drafts.delete({ organizationId, id });
			}
			queryClient.invalidateQueries({ queryKey });
			toast.success(t("drafts.discardSuccess"));
		} catch (e: any) {
			toast.error(e?.message || t("drafts.discardError"));
		} finally {
			setDeleteId(null);
		}
	};

	if (isLoading) {
		return <ListTableSkeleton rows={6} cols={5} />;
	}

	if (drafts.length === 0) {
		return (
			<EmptyState
				icon={<FileText className="h-12 w-12" />}
				title={t("drafts.empty")}
				description={t("drafts.emptyDescription")}
			/>
		);
	}

	// قائمة إجراءات الصف — مشتركة بين الجدول (ديسكتوب) وبطاقات الجوال
	const renderRowMenu = (draft: any) => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="rounded-xl">
				<DropdownMenuItem asChild>
					<Link href={`${editBasePath}/${draft.id}`}>
						<Pencil className="h-4 w-4 me-2" />
						{t("drafts.continueEditing")}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setDeleteId(draft.id)} className="text-destructive focus:text-destructive">
					<Trash2 className="h-4 w-4 me-2" />
					{t("drafts.discard")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	return (
		<>
			{/* الجوال: صفوف مستندات بسطرين بدل الجدول متعدد الأعمدة */}
			<MobileDocList className="sm:hidden">
				{drafts.map((draft) => {
					const source = isInvoice ? draft.sourceInvoice : draft.sourceQuotation;
					const sourceNo = source?.invoiceNo ?? source?.quotationNo ?? null;
					return (
						<MobileDocRow
							key={draft.id}
							href={`${editBasePath}/${draft.id}`}
							title={draft.clientName?.trim() || t("drafts.provisional")}
							subtitle={
								<>
									{sourceNo && (
										<>
											<span dir="ltr" className="whitespace-nowrap">
												{sourceNo}
											</span>
											{" · "}
										</>
									)}
									{formatDate(draft.updatedAt)}
								</>
							}
							amount={<Currency amount={Number(draft.totalAmount) || 0} />}
							actions={renderRowMenu(draft)}
						/>
					);
				})}
			</MobileDocList>

			{/* الجدول (الديسكتوب كما هو) */}
			<div className="hidden sm:block overflow-x-auto rounded-2xl border-2 border-border bg-card">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b-2 border-border">
							<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground">{t("drafts.columns.number")}</th>
							<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground">{t("drafts.columns.client")}</th>
							<th className="p-3 text-center text-[11.5px] font-semibold text-muted-foreground">{t("drafts.columns.lastSaved")}</th>
							<th className="p-3 text-center text-[11.5px] font-semibold text-muted-foreground">{t("drafts.columns.amount")}</th>
							<th className="p-3 w-10" />
						</tr>
					</thead>
					<tbody>
						{drafts.map((draft) => {
							const source = isInvoice ? draft.sourceInvoice : draft.sourceQuotation;
							const sourceNo = source?.invoiceNo ?? source?.quotationNo ?? null;
							return (
								<tr key={draft.id} className="border-b-2 border-border last:border-0 hover:bg-muted/50 transition-colors">
									<td className="p-3">
										<Link href={`${editBasePath}/${draft.id}`} className="font-medium text-primary hover:underline">
											{sourceNo
												? t("drafts.editDraftOf", { number: sourceNo })
												: t("drafts.provisional")}
										</Link>
									</td>
									<td className="p-3">{draft.clientName?.trim() || "—"}</td>
									<td className="p-3 text-center text-muted-foreground text-xs">{formatDate(draft.updatedAt)}</td>
									<td className="p-3 text-center"><Currency amount={Number(draft.totalAmount) || 0} /></td>
									<td className="p-3">{renderRowMenu(draft)}</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("drafts.discardConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>{t("drafts.discardConfirmDescription")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteId && handleDiscard(deleteId)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("drafts.discard")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
