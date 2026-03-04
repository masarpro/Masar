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
	TableFooter,
} from "@ui/components/table";
import { Progress } from "@ui/components/progress";
import { toast } from "sonner";
import {
	ArrowRight,
	Edit,
	FileSpreadsheet,
	Loader2,
	Package,
	Plus,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { SubcontractItemSheet } from "./SubcontractItemSheet";
import { SubcontractTabs } from "./SubcontractTabs";

interface SubcontractItemsViewProps {
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

function formatNumber(value: number, decimals = 2): string {
	return new Intl.NumberFormat("ar-SA", {
		minimumFractionDigits: 0,
		maximumFractionDigits: decimals,
	}).format(value);
}

export function SubcontractItemsView({
	organizationId,
	organizationSlug,
	projectId,
	subcontractId,
}: SubcontractItemsViewProps) {
	const t = useTranslations("subcontractItems");
	const tCommon = useTranslations("subcontracts");
	const router = useRouter();
	const queryClient = useQueryClient();

	const [sheetOpen, setSheetOpen] = useState(false);
	const [editItem, setEditItem] = useState<any>(null);
	const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance/subcontracts/${subcontractId}`;

	// Fetch contract details
	const { data: contract } = useQuery(
		orpc.subcontracts.get.queryOptions({
			input: { organizationId, projectId, contractId: subcontractId },
		}),
	);

	// Fetch items
	const { data: items, isLoading } = useQuery(
		orpc.subcontracts.listItems.queryOptions({
			input: { organizationId, projectId, contractId: subcontractId },
		}),
	);

	// Create mutation
	const createMutation = useMutation({
		...orpc.subcontracts.createItem.mutationOptions(),
		onSuccess: () => {
			toast.success(t("notifications.created"));
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			setSheetOpen(false);
			setEditItem(null);
		},
		onError: (error) => {
			toast.error(error.message || t("notifications.createError"));
		},
	});

	// Update mutation
	const updateMutation = useMutation({
		...orpc.subcontracts.updateItem.mutationOptions(),
		onSuccess: () => {
			toast.success(t("notifications.updated"));
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			setSheetOpen(false);
			setEditItem(null);
		},
		onError: (error) => {
			toast.error(error.message || t("notifications.updateError"));
		},
	});

	// Delete mutation
	const deleteMutation = useMutation({
		...orpc.subcontracts.deleteItem.mutationOptions(),
		onSuccess: () => {
			toast.success(t("notifications.deleted"));
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			setDeleteItemId(null);
		},
		onError: (error) => {
			toast.error(error.message || t("notifications.deleteError"));
		},
	});

	function handleSubmit(data: any) {
		if (data.id) {
			updateMutation.mutate({
				organizationId,
				projectId,
				contractId: subcontractId,
				itemId: data.id,
				itemCode: data.itemCode,
				description: data.description,
				descriptionEn: data.descriptionEn,
				unit: data.unit,
				contractQty: data.contractQty,
				unitPrice: data.unitPrice,
				category: data.category,
				isLumpSum: data.isLumpSum,
			});
		} else {
			createMutation.mutate({
				organizationId,
				projectId,
				contractId: subcontractId,
				itemCode: data.itemCode,
				description: data.description,
				descriptionEn: data.descriptionEn,
				unit: data.unit,
				contractQty: data.contractQty,
				unitPrice: data.unitPrice,
				category: data.category,
				isLumpSum: data.isLumpSum,
			});
		}
	}

	function handleEdit(item: any) {
		setEditItem(item);
		setSheetOpen(true);
	}

	function handleAdd() {
		setEditItem(null);
		setSheetOpen(true);
	}

	const totalContractAmount =
		items?.reduce((sum, item) => sum + item.totalAmount, 0) ?? 0;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

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
					<h1 className="text-2xl font-bold">{t("title")}</h1>
					{contract && (
						<p className="text-muted-foreground mt-1">
							{contract.name} — {t("contractTotal")}: {formatCurrency(Number(contract.value))}
						</p>
					)}
				</div>
				<Button onClick={handleAdd}>
					<Plus className="h-4 w-4 me-2" />
					{t("addItem")}
				</Button>
			</div>

			{/* Items Table */}
			{!items?.length ? (
				<div className="rounded-xl border border-dashed p-12 text-center">
					<Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
					<p className="text-muted-foreground">{t("noItems")}</p>
					<Button onClick={handleAdd} variant="outline" className="mt-4">
						<Plus className="h-4 w-4 me-2" />
						{t("addItem")}
					</Button>
				</div>
			) : (
				<div className="rounded-xl border overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/50">
								<TableHead className="w-20">{t("itemCode")}</TableHead>
								<TableHead>{t("description")}</TableHead>
								<TableHead className="w-20 text-center">{t("unit")}</TableHead>
								<TableHead className="w-28 text-center">{t("contractQty")}</TableHead>
								<TableHead className="w-28 text-center">{t("unitPrice")}</TableHead>
								<TableHead className="w-32 text-center">{t("totalAmount")}</TableHead>
								<TableHead className="w-28 text-center">{t("claimedQty")}</TableHead>
								<TableHead className="w-32 text-center">{t("progress")}</TableHead>
								<TableHead className="w-20" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => (
								<TableRow key={item.id} className="group">
									<TableCell className="font-mono text-sm text-muted-foreground">
										{item.itemCode || "—"}
									</TableCell>
									<TableCell>
										<div className="font-medium">{item.description}</div>
										{item.descriptionEn && (
											<div className="text-xs text-muted-foreground" dir="ltr">
												{item.descriptionEn}
											</div>
										)}
										{item.category && (
											<Badge variant="outline" className="mt-1 text-xs">
												{t(`categories.${item.category}`)}
											</Badge>
										)}
									</TableCell>
									<TableCell className="text-center text-sm">
										{item.isLumpSum ? "LS" : item.unit}
									</TableCell>
									<TableCell className="text-center tabular-nums" dir="ltr">
										{item.isLumpSum ? "—" : formatNumber(item.contractQty, 3)}
									</TableCell>
									<TableCell className="text-center tabular-nums" dir="ltr">
										{formatNumber(item.unitPrice)}
									</TableCell>
									<TableCell className="text-center font-medium tabular-nums" dir="ltr">
										{formatCurrency(item.totalAmount)}
									</TableCell>
									<TableCell className="text-center tabular-nums" dir="ltr">
										{formatNumber(item.totalCumulativeQty, 3)}
										<span className="text-muted-foreground text-xs mx-1">/</span>
										{formatNumber(item.contractQty, 3)}
									</TableCell>
									<TableCell className="text-center">
										<div className="flex items-center gap-2">
											<Progress
												value={item.completionPercent}
												className="h-2 flex-1"
											/>
											<span className="text-xs tabular-nums text-muted-foreground w-10" dir="ltr">
												{item.completionPercent}%
											</span>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7"
												onClick={() => handleEdit(item)}
											>
												<Edit className="h-3.5 w-3.5" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 text-destructive"
												onClick={() => setDeleteItemId(item.id)}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
						<TableFooter>
							<TableRow className="bg-muted/30 font-bold">
								<TableCell colSpan={5} className="text-start">
									{t("contractTotal")}
								</TableCell>
								<TableCell className="text-center tabular-nums" dir="ltr">
									{formatCurrency(totalContractAmount)}
								</TableCell>
								<TableCell colSpan={3} />
							</TableRow>
						</TableFooter>
					</Table>
				</div>
			)}

			{/* Sheet for add/edit */}
			<SubcontractItemSheet
				open={sheetOpen}
				onOpenChange={(open) => {
					setSheetOpen(open);
					if (!open) setEditItem(null);
				}}
				onSubmit={handleSubmit}
				editItem={editItem}
				isLoading={createMutation.isPending || updateMutation.isPending}
			/>

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deleteItemId}
				onOpenChange={(open) => !open && setDeleteItemId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("deleteItem")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("deleteConfirm")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() => {
								if (deleteItemId) {
									deleteMutation.mutate({
										organizationId,
										projectId,
										contractId: subcontractId,
										itemId: deleteItemId,
									});
								}
							}}
						>
							{deleteMutation.isPending && (
								<Loader2 className="h-4 w-4 animate-spin me-2" />
							)}
							{t("deleteItem")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
