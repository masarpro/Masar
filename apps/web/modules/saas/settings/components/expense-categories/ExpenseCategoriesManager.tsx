"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Card, CardContent } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@ui/components/accordion";
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
import {
	Tags,
	Plus,
	Pencil,
	Trash2,
	RotateCcw,
	HardHat,
} from "lucide-react";
import {
	CategoryFormDialog,
	type EditableCategory,
} from "./CategoryFormDialog";
import {
	SubcategoryFormDialog,
	type EditableSubcategory,
} from "./SubcategoryFormDialog";

interface ExpenseCategoriesManagerProps {
	organizationId: string;
}

type DeleteTarget =
	| { type: "category"; id: string; name: string }
	| { type: "subcategory"; id: string; name: string }
	| null;

export function ExpenseCategoriesManager({
	organizationId,
}: ExpenseCategoriesManagerProps) {
	const t = useTranslations("settings.expenseCategories");
	const locale = useLocale();
	const isAr = locale === "ar";
	const queryClient = useQueryClient();

	const { data: categories, isLoading } = useQuery(
		orpc.categories.list.queryOptions({
			input: { organizationId, group: "EXPENSE", includeInactive: true },
		}),
	);

	// Dialog state
	const [catDialog, setCatDialog] = useState<{
		open: boolean;
		category: EditableCategory | null;
	}>({ open: false, category: null });
	const [subDialog, setSubDialog] = useState<{
		open: boolean;
		categoryId: string;
		subcategory: EditableSubcategory | null;
	}>({ open: false, categoryId: "", subcategory: null });
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: orpc.categories.list.key() });

	const resetMutation = useMutation({
		mutationFn: (id: string) =>
			orpcClient.categories.reset({ organizationId, id }),
		onSuccess: () => {
			toast.success(t("resetSuccess"));
			invalidate();
		},
		onError: (e: any) => toast.error(e?.message || t("saveError")),
	});

	const deleteMutation = useMutation({
		mutationFn: async (target: NonNullable<DeleteTarget>) => {
			if (target.type === "category") {
				return orpcClient.categories.delete({ organizationId, id: target.id });
			}
			return orpcClient.categories.deleteSubcategory({
				organizationId,
				id: target.id,
			});
		},
		onSuccess: (res: any) => {
			toast.success(res?.deactivated ? t("deactivateSuccess") : t("deleteSuccess"));
			invalidate();
			setDeleteTarget(null);
		},
		onError: (e: any) => {
			// Backend returns a CONFLICT with an Arabic message suggesting deactivation.
			toast.error(e?.message || t("deleteError"));
			setDeleteTarget(null);
		},
	});

	const getName = (item: { nameAr: string; nameEn: string }) =>
		isAr ? item.nameAr : item.nameEn;
	const getSecondary = (item: { nameAr: string; nameEn: string }) =>
		isAr ? item.nameEn : item.nameAr;

	if (isLoading) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-10 w-full rounded-xl" />
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-14 w-full rounded-xl" />
				))}
			</div>
		);
	}

	const list = categories ?? [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Tags className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h2 className="text-xl font-bold">{t("title")}</h2>
						<p className="text-sm text-muted-foreground">
							{t("description")}
						</p>
					</div>
				</div>
				<Button
					onClick={() => setCatDialog({ open: true, category: null })}
				>
					<Plus className="h-4 w-4 me-2" />
					{t("addCategory")}
				</Button>
			</div>

			{list.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Tags className="h-12 w-12 text-muted-foreground/40 mb-4" />
						<p className="text-lg font-medium text-muted-foreground">
							{t("empty")}
						</p>
					</CardContent>
				</Card>
			) : (
				<Accordion type="multiple" className="space-y-2">
					{list.map((cat) => (
						<AccordionItem
							key={cat.id}
							value={cat.id}
							className={`rounded-xl border bg-card px-2 ${
								cat.isActive ? "" : "opacity-60"
							}`}
						>
							<div className="flex items-center gap-1">
								<AccordionTrigger className="flex-1 hover:no-underline">
									<div className="flex flex-1 items-center gap-2 text-start">
										<div className="flex flex-col min-w-0">
											<span className="truncate font-medium">
												{getName(cat)}
											</span>
											<span className="truncate text-xs text-muted-foreground">
												{getSecondary(cat)}
											</span>
										</div>
										<div className="flex flex-wrap items-center gap-1.5 ms-2">
											{cat.accountCode && (
												<Badge
													variant="secondary"
													className="font-mono text-xs"
												>
													{cat.accountCode}
												</Badge>
											)}
											{cat.isVatExempt && (
												<Badge variant="outline" className="text-xs">
													{t("vatExemptBadge")}
												</Badge>
											)}
											<Badge
												variant="outline"
												className="text-xs text-muted-foreground"
											>
												{cat.isSystem ? t("systemBadge") : t("customBadge")}
											</Badge>
											{!cat.isActive && (
												<Badge
													variant="outline"
													className="text-xs text-chart-1 border-chart-1/30"
												>
													{t("inactiveBadge")}
												</Badge>
											)}
										</div>
									</div>
								</AccordionTrigger>
								<div className="flex items-center gap-0.5 pe-1">
									<Button
										variant="ghost"
										size="icon"
										title={t("edit")}
										onClick={() =>
											setCatDialog({
												open: true,
												category: {
													id: cat.id,
													nameAr: cat.nameAr,
													nameEn: cat.nameEn,
													accountCode: cat.accountCode,
													isVatExempt: cat.isVatExempt,
													isSystem: cat.isSystem,
												},
											})
										}
									>
										<Pencil className="h-4 w-4" />
									</Button>
									{cat.isSystem && (
										<Button
											variant="ghost"
											size="icon"
											title={t("reset")}
											onClick={() => resetMutation.mutate(cat.id)}
										>
											<RotateCcw className="h-4 w-4" />
										</Button>
									)}
									<Button
										variant="ghost"
										size="icon"
										title={t("delete")}
										className="text-destructive hover:text-destructive"
										onClick={() =>
											setDeleteTarget({
												type: "category",
												id: cat.id,
												name: getName(cat),
											})
										}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>

							<AccordionContent className="pb-3">
								<div className="space-y-1.5 ps-2">
									{cat.subcategories.length === 0 ? (
										<p className="py-2 text-sm text-muted-foreground">
											{t("noSubcategories")}
										</p>
									) : (
										cat.subcategories.map((sub) => (
											<div
												key={sub.id}
												className={`flex items-center justify-between rounded-lg border bg-background px-3 py-2 ${
													sub.isActive ? "" : "opacity-60"
												}`}
											>
												<div className="flex items-center gap-2 min-w-0">
													<span className="truncate text-sm">
														{getName(sub)}
													</span>
													<span className="truncate text-xs text-muted-foreground">
														{getSecondary(sub)}
													</span>
													{sub.isLabor && (
														<Badge
															variant="outline"
															className="text-xs"
														>
															<HardHat className="h-3 w-3 me-1" />
															{t("laborBadge")}
														</Badge>
													)}
													{!sub.isActive && (
														<Badge
															variant="outline"
															className="text-xs text-chart-1 border-chart-1/30"
														>
															{t("inactiveBadge")}
														</Badge>
													)}
												</div>
												<div className="flex items-center gap-0.5">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														title={t("edit")}
														onClick={() =>
															setSubDialog({
																open: true,
																categoryId: cat.id,
																subcategory: {
																	id: sub.id,
																	nameAr: sub.nameAr,
																	nameEn: sub.nameEn,
																	isLabor: sub.isLabor,
																},
															})
														}
													>
														<Pencil className="h-3.5 w-3.5" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-destructive hover:text-destructive"
														title={t("delete")}
														onClick={() =>
															setDeleteTarget({
																type: "subcategory",
																id: sub.id,
																name: getName(sub),
															})
														}
													>
														<Trash2 className="h-3.5 w-3.5" />
													</Button>
												</div>
											</div>
										))
									)}

									<Button
										variant="outline"
										size="sm"
										className="mt-1"
										onClick={() =>
											setSubDialog({
												open: true,
												categoryId: cat.id,
												subcategory: null,
											})
										}
									>
										<Plus className="h-3.5 w-3.5 me-1.5" />
										{t("addSubcategory")}
									</Button>
								</div>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			)}

			{/* Dialogs */}
			<CategoryFormDialog
				organizationId={organizationId}
				open={catDialog.open}
				onOpenChange={(open) =>
					setCatDialog((prev) => ({ ...prev, open }))
				}
				category={catDialog.category}
			/>
			<SubcategoryFormDialog
				organizationId={organizationId}
				categoryId={subDialog.categoryId}
				open={subDialog.open}
				onOpenChange={(open) =>
					setSubDialog((prev) => ({ ...prev, open }))
				}
				subcategory={subDialog.subcategory}
			/>

			{/* Delete confirmation */}
			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("deleteConfirmDesc", { name: deleteTarget?.name ?? "" })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={deleteMutation.isPending}
							onClick={(e) => {
								e.preventDefault();
								if (deleteTarget) deleteMutation.mutate(deleteTarget);
							}}
						>
							{t("delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
