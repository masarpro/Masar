"use client";

import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useBulkCreateBOQItems } from "@saas/projects/hooks/use-project-boq";

interface RowData {
	code: string;
	description: string;
	unit: string;
	quantity: string;
	unitPrice: string;
}

const emptyRow = (): RowData => ({
	code: "",
	description: "",
	unit: "",
	quantity: "",
	unitPrice: "",
});

interface BulkEntryDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	projectId: string;
}

export function BulkEntryDialog({
	open,
	onOpenChange,
	organizationId,
	projectId,
}: BulkEntryDialogProps) {
	const t = useTranslations("projectBoq");
	const bulkCreateMutation = useBulkCreateBOQItems();

	const [defaultSection, setDefaultSection] = useState("GENERAL");
	const [rows, setRows] = useState<RowData[]>([emptyRow(), emptyRow(), emptyRow()]);

	const updateRow = (index: number, field: keyof RowData, value: string) => {
		setRows((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], [field]: value };
			return next;
		});
	};

	const removeRow = (index: number) => {
		if (rows.length <= 1) return;
		setRows((prev) => prev.filter((_, i) => i !== index));
	};

	const addRow = () => {
		setRows((prev) => [...prev, emptyRow()]);
	};

	const validRows = rows.filter(
		(r) => r.description.trim() && r.unit.trim(),
	);

	const handleSubmit = async () => {
		if (validRows.length === 0) return;

		try {
			const result = await bulkCreateMutation.mutateAsync({
				organizationId,
				projectId,
				items: validRows.map((r) => ({
					section: defaultSection as any,
					code: r.code || undefined,
					description: r.description,
					unit: r.unit,
					quantity: Number(r.quantity) || 0,
					unitPrice: r.unitPrice ? Number(r.unitPrice) : null,
				})),
			});
			toast.success(t("toast.itemsCreated", { count: result.createdCount }));
			onOpenChange(false);
			setRows([emptyRow(), emptyRow(), emptyRow()]);
		} catch {
			// Error handled by mutation
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
		if (e.key === "Enter" && rowIndex === rows.length - 1) {
			e.preventDefault();
			addRow();
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-4xl p-0 gap-0 rounded-2xl overflow-hidden max-h-[90vh]">
				<DialogHeader className="bg-white dark:bg-slate-900 border-b px-5 py-4">
					<DialogTitle>{t("bulkEntry.title")}</DialogTitle>
				</DialogHeader>

				<div className="p-5 space-y-4 overflow-y-auto max-h-[65vh]">
					{/* Default section */}
					<div className="flex items-center gap-4">
						<div className="space-y-1.5">
							<Label>{t("bulkEntry.defaultSection")}</Label>
							<Select value={defaultSection} onValueChange={setDefaultSection}>
								<SelectTrigger className="w-[160px] rounded-xl h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="GENERAL">{t("section.GENERAL")}</SelectItem>
									<SelectItem value="STRUCTURAL">{t("section.STRUCTURAL")}</SelectItem>
									<SelectItem value="FINISHING">{t("section.FINISHING")}</SelectItem>
									<SelectItem value="MEP">{t("section.MEP")}</SelectItem>
									<SelectItem value="LABOR">{t("section.LABOR")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<p className="text-xs text-slate-400 mt-5">{t("bulkEntry.hint")}</p>
					</div>

					{/* Rows */}
					<div className="space-y-2">
						<div className="grid grid-cols-[60px_1fr_80px_90px_100px_32px] gap-2 text-xs font-medium text-slate-500 px-1">
							<span>{t("table.code")}</span>
							<span>{t("table.description")} *</span>
							<span>{t("table.unit")} *</span>
							<span>{t("table.quantity")}</span>
							<span>{t("table.unitPrice")}</span>
							<span />
						</div>
						{rows.map((row, idx) => (
							<div key={idx} className="grid grid-cols-[60px_1fr_80px_90px_100px_32px] gap-2">
								<Input
									value={row.code}
									onChange={(e) => updateRow(idx, "code", e.target.value)}
									className="rounded-lg h-8 text-sm"
									onKeyDown={(e) => handleKeyDown(e, idx)}
								/>
								<Input
									value={row.description}
									onChange={(e) => updateRow(idx, "description", e.target.value)}
									className="rounded-lg h-8 text-sm"
									onKeyDown={(e) => handleKeyDown(e, idx)}
									required
								/>
								<Input
									value={row.unit}
									onChange={(e) => updateRow(idx, "unit", e.target.value)}
									className="rounded-lg h-8 text-sm"
									onKeyDown={(e) => handleKeyDown(e, idx)}
									required
								/>
								<Input
									type="number"
									min="0"
									step="any"
									value={row.quantity}
									onChange={(e) => updateRow(idx, "quantity", e.target.value)}
									className="rounded-lg h-8 text-sm"
									onKeyDown={(e) => handleKeyDown(e, idx)}
								/>
								<Input
									type="number"
									min="0"
									step="any"
									value={row.unitPrice}
									onChange={(e) => updateRow(idx, "unitPrice", e.target.value)}
									className="rounded-lg h-8 text-sm"
									onKeyDown={(e) => handleKeyDown(e, idx)}
								/>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
									onClick={() => removeRow(idx)}
									disabled={rows.length <= 1}
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							</div>
						))}
					</div>

					<Button
						variant="outline"
						size="sm"
						className="rounded-xl"
						onClick={addRow}
					>
						<Plus className="h-4 w-4 me-1.5" />
						{t("bulkEntry.addRow")}
					</Button>
				</div>

				<div className="bg-slate-50 dark:bg-slate-800/50 border-t px-5 py-3 flex gap-3 justify-end">
					<Button
						variant="outline"
						className="rounded-xl"
						onClick={() => onOpenChange(false)}
					>
						{t("actions.cancel")}
					</Button>
					<Button
						className="rounded-xl"
						disabled={bulkCreateMutation.isPending || validRows.length === 0}
						onClick={handleSubmit}
					>
						{bulkCreateMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
						{t("bulkEntry.saveItems", { count: validRows.length })}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
