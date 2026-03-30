"use client";

import { useTranslations } from "next-intl";
import { UNIT_KEYS, UNIT_VALUES, formatCurrency } from "@saas/shared/lib/invoice-constants";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuCheckboxItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
	DropdownMenuLabel,
} from "@ui/components/dropdown-menu";
import {
	FileText,
	Plus,
	ChevronDown,
	ChevronUp,
	Trash2,
	Columns,
} from "lucide-react";
import type { InvoiceItem, ColumnKey } from "./types";

interface InvoiceItemsTableProps {
	items: InvoiceItem[];
	visibleColumns: ColumnKey[];
	onUpdateItem: (itemId: string, updates: Partial<InvoiceItem>) => void;
	onAddItem: () => void;
	onRemoveItem: (itemId: string) => void;
	onMoveItemUp: (index: number) => void;
	onMoveItemDown: (index: number) => void;
	onToggleColumn: (column: ColumnKey) => void;
}

export function InvoiceItemsTable({
	items,
	visibleColumns,
	onUpdateItem,
	onAddItem,
	onRemoveItem,
	onMoveItemUp,
	onMoveItemDown,
	onToggleColumn,
}: InvoiceItemsTableProps) {
	const t = useTranslations();

	const columnLabels: Record<ColumnKey, string> = {
		index: "#",
		description: t("finance.items.description"),
		unit: t("finance.items.unit"),
		unitPrice: t("finance.items.unitPrice"),
		quantity: t("finance.items.quantity"),
		total: t("finance.items.total"),
		actions: "",
	};

	const isColumnVisible = (column: ColumnKey) => visibleColumns.includes(column);

	const units = UNIT_KEYS.map((key) => ({
		value: UNIT_VALUES[key],
		label: t(`finance.units.${key}`),
	}));

	return (
		<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
			<div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
				<div className="flex items-center gap-2.5">
					<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-800/20 flex items-center justify-center">
						<FileText className="h-[15px] w-[15px] text-amber-500" />
					</div>
					<span className="text-sm font-semibold text-foreground">{t("finance.invoices.items")}</span>
					<span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">{items.filter((i) => i.description.trim()).length}</span>
				</div>
				<div className="flex items-center gap-3">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm" className="rounded-lg h-8">
							<Columns className="h-4 w-4 me-2" />
							{t("finance.items.columns")}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48 rounded-xl">
						<DropdownMenuLabel>{t("finance.items.showColumns")}</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{(Object.keys(columnLabels) as ColumnKey[]).filter(k => !["actions", "index"].includes(k)).map((column) => (
							<DropdownMenuCheckboxItem key={column} checked={isColumnVisible(column)} onCheckedChange={() => onToggleColumn(column)}>
								{columnLabels[column]}
							</DropdownMenuCheckboxItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
				</div>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-slate-50/80 dark:bg-slate-800/30">
							{isColumnVisible("index") && <th className="p-3 text-center w-12 text-[11.5px] font-semibold text-muted-foreground tracking-wide">#</th>}
							{isColumnVisible("description") && <th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground min-w-[180px] tracking-wide">{columnLabels.description}</th>}
							{isColumnVisible("unit") && <th className="p-3 text-center text-[11.5px] font-semibold text-muted-foreground w-24 tracking-wide">{columnLabels.unit}</th>}
							{isColumnVisible("unitPrice") && <th className="p-3 text-center text-[11.5px] font-semibold text-muted-foreground w-28 tracking-wide">{columnLabels.unitPrice}</th>}
							{isColumnVisible("quantity") && <th className="p-3 text-center text-[11.5px] font-semibold text-muted-foreground w-20 tracking-wide">{columnLabels.quantity}</th>}
							{isColumnVisible("total") && <th className="p-3 text-center text-[11.5px] font-semibold text-muted-foreground w-28 tracking-wide">{columnLabels.total}</th>}
							<th className="p-3 w-10" />
						</tr>
					</thead>
					<tbody>
						{items.map((item, index) => (
							<tr key={item.id} className="border-b border-slate-50 dark:border-slate-800/30 last:border-0 hover:bg-primary/[0.02] transition-colors">
								{isColumnVisible("index") && (
									<td className="p-2 text-center">
										<div className="flex flex-col items-center gap-0.5">
											<button type="button" onClick={() => onMoveItemUp(index)} disabled={index === 0} className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
												<ChevronUp className="h-3 w-3 text-muted-foreground" />
											</button>
											<span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-primary flex items-center justify-center text-xs font-bold">{index + 1}</span>
											<button type="button" onClick={() => onMoveItemDown(index)} disabled={index === items.length - 1} className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
												<ChevronDown className="h-3 w-3 text-muted-foreground" />
											</button>
										</div>
									</td>
								)}
								{isColumnVisible("description") && (
									<td className="p-2 align-top">
										<textarea
											value={item.description}
											onChange={(e) => { onUpdateItem(item.id, { description: e.target.value }); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
											placeholder={t("finance.items.descriptionPlaceholder")}
											rows={1}
											className="w-full min-h-[36px] px-3 py-2 rounded-[10px] text-sm border border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-background focus:border-primary/30 focus:ring-[3px] focus:ring-primary/[0.08] focus:outline-none resize-none overflow-hidden transition-all"
										/>
									</td>
								)}
								{isColumnVisible("unit") && (
									<td className="p-2">
										<Select value={item.unit || "_empty"} onValueChange={(v) => onUpdateItem(item.id, { unit: v === "_empty" ? "" : v })}>
											<SelectTrigger className="rounded-[10px] h-9 text-xs px-1 border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-background focus:border-primary/30"><SelectValue placeholder={t("finance.items.unitPlaceholder")} /></SelectTrigger>
											<SelectContent className="rounded-xl">
												<SelectItem value="_empty">-</SelectItem>
												{units.map((u) => (<SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>))}
											</SelectContent>
										</Select>
									</td>
								)}
								{isColumnVisible("unitPrice") && (
									<td className="p-2">
										<Input type="number" min="0" step="0.01" value={item.unitPrice || ""} onChange={(e) => onUpdateItem(item.id, { unitPrice: Number(e.target.value) || 0 })} placeholder="0.00" className="rounded-[10px] h-9 text-sm text-center border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-background focus:border-primary/30 focus:ring-[3px] focus:ring-primary/[0.08]" />
									</td>
								)}
								{isColumnVisible("quantity") && (
									<td className="p-2">
										<Input type="number" min="0" step="0.01" value={item.quantity || ""} onChange={(e) => onUpdateItem(item.id, { quantity: Number(e.target.value) || 0 })} placeholder="1" className="rounded-[10px] h-9 text-sm text-center border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:bg-background focus:border-primary/30 focus:ring-[3px] focus:ring-primary/[0.08]" />
									</td>
								)}
								{isColumnVisible("total") && (
									<td className="p-2 text-center">
										<div className={`px-2 py-1.5 rounded-[10px] text-sm font-bold font-mono ${(item.quantity * item.unitPrice) > 0 ? "bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/30 text-sky-700 dark:text-sky-400" : "text-muted-foreground"}`}>
											{formatCurrency(item.quantity * item.unitPrice)}
										</div>
									</td>
								)}
								<td className="p-2">
									{items.length > 1 && (
										<Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => onRemoveItem(item.id)}>
											<Trash2 className="h-4 w-4" />
										</Button>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="p-4 border-t border-slate-100 dark:border-slate-800/60">
				<button
					type="button"
					onClick={onAddItem}
					className="w-full py-3.5 rounded-xl border-2 border-dashed border-primary/25 bg-gradient-to-br from-primary/[0.02] to-primary/[0.06] hover:from-primary/[0.04] hover:to-primary/[0.10] hover:border-primary/40 text-primary text-sm font-semibold flex items-center justify-center gap-2 transition-all"
				>
					<Plus className="h-[18px] w-[18px]" />
					{t("finance.items.add")}
				</button>
			</div>
		</div>
	);
}
