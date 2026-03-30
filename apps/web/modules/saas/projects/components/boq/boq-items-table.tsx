"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { ChevronLeft, ChevronRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

function formatCurrency(value: number): string {
	return value.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

const sourceBadgeColors: Record<string, string> = {
	MANUAL: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
	COST_STUDY: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	IMPORTED: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
	CONTRACT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
	QUOTATION: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
};

interface BOQItem {
	id: string;
	sortOrder: number;
	code: string | null;
	description: string;
	unit: string;
	quantity: number;
	unitPrice: number | null;
	totalPrice: number | null;
	section: string;
	sourceType: string;
	projectPhase?: { id: string; title: string } | null;
	createdBy?: { id: string; name: string } | null;
}

interface BOQItemsTableProps {
	items: BOQItem[];
	total: number;
	limit: number;
	offset: number;
	selectedIds: Set<string>;
	onSelectionChange: (ids: Set<string>) => void;
	onPageChange: (offset: number) => void;
	onEdit: (item: BOQItem) => void;
	onDelete: (item: BOQItem) => void;
	sortBy: string;
	sortDirection: "asc" | "desc";
	onSortChange: (field: string) => void;
}

export function BOQItemsTable({
	items,
	total,
	limit,
	offset,
	selectedIds,
	onSelectionChange,
	onPageChange,
	onEdit,
	onDelete,
	sortBy,
	sortDirection,
	onSortChange,
}: BOQItemsTableProps) {
	const t = useTranslations("projectBoq");
	const tCommon = useTranslations("common");

	const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));
	const someSelected = items.some((item) => selectedIds.has(item.id)) && !allSelected;

	const toggleAll = () => {
		if (allSelected) {
			onSelectionChange(new Set());
		} else {
			onSelectionChange(new Set(items.map((item) => item.id)));
		}
	};

	const toggleItem = (id: string) => {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		onSelectionChange(next);
	};

	const totalPages = Math.ceil(total / limit);
	const currentPage = Math.floor(offset / limit) + 1;

	// Calculate grand total for visible items
	const visibleTotal = items.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0);

	const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
		<button
			type="button"
			className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
			onClick={() => onSortChange(field)}
		>
			{children}
			{sortBy === field && (
				<span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
			)}
		</button>
	);

	return (
		<div className="space-y-3">
			<div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="bg-slate-50 dark:bg-slate-800/50">
								<TableHead className="w-10">
									<Checkbox
										checked={allSelected}
										ref={(el) => {
											if (el) (el as any).indeterminate = someSelected;
										}}
										onCheckedChange={toggleAll}
									/>
								</TableHead>
								<TableHead className="w-12 text-center">#</TableHead>
								<TableHead className="w-20">
									<SortHeader field="code">{t("table.code")}</SortHeader>
								</TableHead>
								<TableHead className="min-w-[200px]">{t("table.description")}</TableHead>
								<TableHead className="w-16">{t("table.unit")}</TableHead>
								<TableHead className="w-24 text-end">{t("table.quantity")}</TableHead>
								<TableHead className="w-28 text-end">{t("table.unitPrice")}</TableHead>
								<TableHead className="w-28 text-end">
									<SortHeader field="totalPrice">{t("table.totalPrice")}</SortHeader>
								</TableHead>
								<TableHead className="w-24">
									<SortHeader field="section">{t("table.section")}</SortHeader>
								</TableHead>
								<TableHead className="w-24">{t("table.source")}</TableHead>
								<TableHead className="w-28">{t("table.phase")}</TableHead>
								<TableHead className="w-16">{t("table.actions")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.length === 0 ? (
								<TableRow>
									<TableCell colSpan={12} className="text-center py-10 text-slate-400">
										{t("emptyState.title")}
									</TableCell>
								</TableRow>
							) : (
								items.map((item, idx) => (
									<TableRow
										key={item.id}
										className={selectedIds.has(item.id) ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}
									>
										<TableCell>
											<Checkbox
												checked={selectedIds.has(item.id)}
												onCheckedChange={() => toggleItem(item.id)}
											/>
										</TableCell>
										<TableCell className="text-center text-slate-400 text-sm">
											{offset + idx + 1}
										</TableCell>
										<TableCell className="text-sm font-mono text-slate-600 dark:text-slate-400">
											{item.code || "—"}
										</TableCell>
										<TableCell className="text-sm text-slate-900 dark:text-slate-100">
											{item.description}
										</TableCell>
										<TableCell className="text-sm text-slate-600 dark:text-slate-400">
											{item.unit}
										</TableCell>
										<TableCell className="text-end text-sm font-medium">
											{item.quantity.toLocaleString("en-US")}
										</TableCell>
										<TableCell className="text-end text-sm">
											{item.unitPrice != null ? (
												formatCurrency(item.unitPrice)
											) : (
												<span className="text-amber-500 text-xs">{t("table.noPrice")}</span>
											)}
										</TableCell>
										<TableCell className="text-end text-sm font-medium">
											{item.totalPrice != null ? (
												formatCurrency(item.totalPrice)
											) : (
												<span className="text-slate-300">—</span>
											)}
										</TableCell>
										<TableCell>
											<Badge variant="outline" className="text-xs rounded-lg">
												{t(`section.${item.section as "STRUCTURAL" | "FINISHING" | "MEP" | "LABOR" | "GENERAL"}`)}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge className={`text-xs rounded-lg border-0 ${sourceBadgeColors[item.sourceType] ?? ""}`}>
												{t(`source.${item.sourceType as "MANUAL" | "COST_STUDY" | "IMPORTED" | "CONTRACT" | "QUOTATION"}`)}
											</Badge>
										</TableCell>
										<TableCell className="text-xs text-slate-500">
											{item.projectPhase?.title ?? "—"}
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
														<MoreVertical className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem onClick={() => onEdit(item)}>
														<Pencil className="h-4 w-4 me-2" />
														{tCommon("edit")}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => onDelete(item)}
														className="text-red-600 dark:text-red-400"
													>
														<Trash2 className="h-4 w-4 me-2" />
														{tCommon("delete")}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				{/* Footer: Total + Pagination */}
				{items.length > 0 && (
					<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
						<div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
							{t("table.total")}: {formatCurrency(visibleTotal)} {tCommon("sar")}
						</div>
						<div className="flex items-center gap-2 text-sm text-slate-500">
							<span>{currentPage} / {totalPages}</span>
							<Button
								variant="outline"
								size="sm"
								className="h-7 w-7 p-0 rounded-lg"
								disabled={offset === 0}
								onClick={() => onPageChange(Math.max(0, offset - limit))}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-7 w-7 p-0 rounded-lg"
								disabled={offset + limit >= total}
								onClick={() => onPageChange(offset + limit)}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
