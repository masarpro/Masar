"use client";

import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
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
	ClipboardList,
	FileSpreadsheet,
	FileText,
	Plus,
	TableProperties,
	Copy,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
	useProjectBOQList,
	useProjectBOQSummary,
	useDeleteBOQItem,
	useBulkDeleteBOQItems,
} from "@saas/projects/hooks/use-project-boq";
import { BOQSummaryCards } from "./boq-summary-cards";
import { BOQFilters } from "./boq-filters";
import { BOQItemsTable } from "./boq-items-table";
import { BOQBulkActions } from "./boq-bulk-actions";
import { CreateItemDialog } from "./create-item-dialog";
import { BulkEntryDialog } from "./bulk-entry-dialog";
import { PricingModeDialog } from "./pricing-mode-dialog";
import { CopyFromStudyDialog } from "./copy-from-study-dialog";
import { CopyFromQuotationDialog } from "./copy-from-quotation-dialog";
import { ImportExcelDialog } from "./import-excel-dialog";

interface BOQOverviewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function BOQOverview({
	organizationId,
	organizationSlug,
	projectId,
}: BOQOverviewProps) {
	const t = useTranslations("projectBoq");

	// Filters
	const [section, setSection] = useState("all");
	const [sourceType, setSourceType] = useState("all");
	const [isPriced, setIsPriced] = useState("all");
	const [search, setSearch] = useState("");
	const [offset, setOffset] = useState(0);
	const [sortBy, setSortBy] = useState("sortOrder");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

	// Selection
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	// Dialogs
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showBulkDialog, setShowBulkDialog] = useState(false);
	const [showPricingDialog, setShowPricingDialog] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		type: "single" | "bulk";
		itemId?: string;
	} | null>(null);
	const [showCopyStudyDialog, setShowCopyStudyDialog] = useState(false);
	const [showCopyQuotationDialog, setShowCopyQuotationDialog] = useState(false);
	const [showImportExcelDialog, setShowImportExcelDialog] = useState(false);
	const [editItem, setEditItem] = useState<any>(null);

	// Queries
	const filters: any = { limit: 50, offset, sortBy, sortDirection };
	if (section !== "all") filters.section = section;
	if (sourceType !== "all") filters.sourceType = sourceType;
	if (isPriced !== "all") filters.isPriced = isPriced === "true";
	if (search.trim()) filters.search = search.trim();

	const { data: listData, isLoading: listLoading } = useProjectBOQList(
		organizationId,
		projectId,
		filters,
	);
	const { data: summary, isLoading: summaryLoading } = useProjectBOQSummary(
		organizationId,
		projectId,
	);

	// Mutations
	const deleteMutation = useDeleteBOQItem();
	const bulkDeleteMutation = useBulkDeleteBOQItems();

	const handleSortChange = useCallback(
		(field: string) => {
			if (sortBy === field) {
				setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
			} else {
				setSortBy(field);
				setSortDirection("asc");
			}
			setOffset(0);
		},
		[sortBy],
	);

	const handleDelete = async () => {
		if (!deleteConfirm) return;

		try {
			if (deleteConfirm.type === "single" && deleteConfirm.itemId) {
				await deleteMutation.mutateAsync({
					organizationId,
					projectId,
					itemId: deleteConfirm.itemId,
				});
				toast.success(t("toast.itemDeleted"));
			} else if (deleteConfirm.type === "bulk") {
				const result = await bulkDeleteMutation.mutateAsync({
					organizationId,
					projectId,
					itemIds: Array.from(selectedIds),
				});
				toast.success(t("toast.itemsDeleted", { count: result.deletedCount }));
				setSelectedIds(new Set());
			}
		} catch {
			// Error handled by mutation
		}
		setDeleteConfirm(null);
	};

	// Reset offset when filters change
	const handleFilterChange = (setter: (v: string) => void) => (val: string) => {
		setter(val);
		setOffset(0);
	};

	// Loading state
	if (summaryLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<div className="grid grid-cols-2 gap-4">
					<Skeleton className="h-24 rounded-xl" />
					<Skeleton className="h-24 rounded-xl" />
				</div>
				<Skeleton className="h-64 rounded-xl" />
			</div>
		);
	}

	// Empty state
	const isEmpty = summary && summary.totalItems === 0;

	return (
		<div className="space-y-6">
			{isEmpty ? (
				<Card className="rounded-2xl border border-slate-200 dark:border-slate-800">
					<CardContent className="flex flex-col items-center justify-center py-16 text-center">
						<ClipboardList className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
						<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
							{t("emptyState.title")}
						</h3>
						<p className="text-sm text-slate-500 mb-6 max-w-md">
							{t("emptyState.description")}
						</p>
						<div className="flex flex-wrap gap-3 justify-center">
							<Button className="rounded-xl" onClick={() => setShowCreateDialog(true)}>
								<Plus className="h-4 w-4 me-2" />
								{t("actions.addItem")}
							</Button>
							<Button variant="outline" className="rounded-xl" onClick={() => setShowBulkDialog(true)}>
								<TableProperties className="h-4 w-4 me-2" />
								{t("actions.bulkEntry")}
							</Button>
							<Button variant="outline" className="rounded-xl" onClick={() => setShowImportExcelDialog(true)}>
								<FileSpreadsheet className="h-4 w-4 me-2" />
								{t("actions.importExcel")}
							</Button>
							<Button variant="outline" className="rounded-xl" onClick={() => setShowCopyStudyDialog(true)}>
								<Copy className="h-4 w-4 me-2" />
								{t("actions.copyFromStudy")}
							</Button>
							<Button variant="outline" className="rounded-xl" onClick={() => setShowCopyQuotationDialog(true)}>
								<FileText className="h-4 w-4 me-2" />
								{t("actions.copyFromQuotation")}
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<>
					{/* Summary Cards */}
					{summary && (
						<BOQSummaryCards
							summary={summary}
							onStartPricing={() => setShowPricingDialog(true)}
						/>
					)}

					{/* Action buttons */}
					<div className="flex flex-wrap items-center gap-2">
						<Button size="sm" className="rounded-xl" onClick={() => setShowCreateDialog(true)}>
							<Plus className="h-4 w-4 me-1.5" />
							{t("actions.addItem")}
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="rounded-xl"
							onClick={() => setShowBulkDialog(true)}
						>
							<TableProperties className="h-4 w-4 me-1.5" />
							{t("actions.bulkEntry")}
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="rounded-xl"
							onClick={() => setShowImportExcelDialog(true)}
						>
							<FileSpreadsheet className="h-4 w-4 me-1.5" />
							{t("actions.importExcel")}
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="rounded-xl"
							onClick={() => setShowCopyStudyDialog(true)}
						>
							<Copy className="h-4 w-4 me-1.5" />
							{t("actions.copyFromStudy")}
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="rounded-xl"
							onClick={() => setShowCopyQuotationDialog(true)}
						>
							<FileText className="h-4 w-4 me-1.5" />
							{t("actions.copyFromQuotation")}
						</Button>
					</div>

					{/* Filters */}
					<BOQFilters
						section={section}
						onSectionChange={handleFilterChange(setSection)}
						sourceType={sourceType}
						onSourceTypeChange={handleFilterChange(setSourceType)}
						isPriced={isPriced}
						onIsPricedChange={handleFilterChange(setIsPriced)}
						search={search}
						onSearchChange={(val) => {
							setSearch(val);
							setOffset(0);
						}}
					/>

					{/* Bulk Actions */}
					<BOQBulkActions
						selectedCount={selectedIds.size}
						onDeleteSelected={() => setDeleteConfirm({ type: "bulk" })}
						onAssignPhase={() => {
							/* TODO: Phase assign dialog */
						}}
					/>

					{/* Table */}
					{listLoading ? (
						<Skeleton className="h-64 rounded-xl" />
					) : listData ? (
						<BOQItemsTable
							items={listData.items as any}
							total={listData.total}
							limit={listData.limit}
							offset={listData.offset}
							selectedIds={selectedIds}
							onSelectionChange={setSelectedIds}
							onPageChange={setOffset}
							onEdit={(item) => setEditItem(item)}
							onDelete={(item) =>
								setDeleteConfirm({ type: "single", itemId: item.id })
							}
							sortBy={sortBy}
							sortDirection={sortDirection}
							onSortChange={handleSortChange}
						/>
					) : null}
				</>
			)}

			{/* Dialogs */}
			<CreateItemDialog
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
				organizationId={organizationId}
				projectId={projectId}
			/>

			<BulkEntryDialog
				open={showBulkDialog}
				onOpenChange={setShowBulkDialog}
				organizationId={organizationId}
				projectId={projectId}
			/>

			<PricingModeDialog
				open={showPricingDialog}
				onOpenChange={setShowPricingDialog}
				organizationId={organizationId}
				projectId={projectId}
			/>

			<CopyFromStudyDialog
				open={showCopyStudyDialog}
				onOpenChange={setShowCopyStudyDialog}
				organizationId={organizationId}
				projectId={projectId}
			/>

			<CopyFromQuotationDialog
				open={showCopyQuotationDialog}
				onOpenChange={setShowCopyQuotationDialog}
				organizationId={organizationId}
				projectId={projectId}
			/>

			<ImportExcelDialog
				open={showImportExcelDialog}
				onOpenChange={setShowImportExcelDialog}
				organizationId={organizationId}
				projectId={projectId}
			/>

			{/* Delete Confirmation */}
			<AlertDialog
				open={deleteConfirm !== null}
				onOpenChange={(open) => !open && setDeleteConfirm(null)}
			>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{deleteConfirm?.type === "bulk"
								? t("confirm.deleteItemsTitle")
								: t("confirm.deleteTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{deleteConfirm?.type === "bulk"
								? t("confirm.deleteItems", { count: selectedIds.size })
								: t("confirm.deleteItem")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("actions.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							className="rounded-xl bg-red-600 hover:bg-red-700"
							onClick={handleDelete}
						>
							{t("actions.deleteSelected")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
