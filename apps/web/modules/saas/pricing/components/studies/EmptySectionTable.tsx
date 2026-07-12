"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { cn } from "@ui/lib";
import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type SectionType = "structural" | "finishing" | "mep";

interface EmptySectionTableProps {
	organizationId: string;
	studyId: string;
	sectionType: SectionType;
}

/** Extra fields stored as JSON in ManualItem.notes */
interface ExtraFields {
	category?: string;
	subCategory?: string;
	floor?: string;
	scope?: string;
	wastagePercent?: number;
	concreteVolume?: number;
	steelWeight?: number;
	itemType?: string;
	userNotes?: string;
}

// ═══════════════════════════════════════════════════════════════
// SECTION CONFIGS
// ═══════════════════════════════════════════════════════════════

const SECTION_FILTER: Record<SectionType, string> = {
	structural: "إنشائي",
	finishing: "تشطيبات",
	mep: "كهروميكانيكية",
};

const UNITS = [
	{ value: "م²", label: "م²" },
	{ value: "م³", label: "م³" },
	{ value: "م.ط", label: "م.ط" },
	{ value: "كجم", label: "كجم" },
	{ value: "طن", label: "طن" },
	{ value: "حبة", label: "حبة" },
	{ value: "نقطة", label: "نقطة" },
	{ value: "مجموعة", label: "مجموعة" },
	{ value: "مقطوع", label: "مقطوع" },
];

// NOTE: `value` strings are persisted in ManualItem.notes — do NOT translate them.
// `labelKey` is only for display.
const STRUCTURAL_CATEGORIES = [
	{ value: "أساسات", labelKey: "pricing.pipeline.emptyTable.categories.structural.foundations" },
	{ value: "أعمدة", labelKey: "pricing.pipeline.emptyTable.categories.structural.columns" },
	{ value: "كمرات", labelKey: "pricing.pipeline.emptyTable.categories.structural.beams" },
	{ value: "بلاطات", labelKey: "pricing.pipeline.emptyTable.categories.structural.slabs" },
	{ value: "جدران", labelKey: "pricing.pipeline.emptyTable.categories.structural.concreteWalls" },
	{ value: "سلالم", labelKey: "pricing.pipeline.emptyTable.categories.structural.stairs" },
	{ value: "رقاب أعمدة", labelKey: "pricing.pipeline.emptyTable.categories.structural.neckColumns" },
	{ value: "ميدات", labelKey: "pricing.pipeline.emptyTable.categories.structural.groundBeams" },
	{ value: "أخرى", labelKey: "pricing.pipeline.emptyTable.categories.structural.other" },
];

const FINISHING_CATEGORIES = [
	{ value: "أرضيات", labelKey: "pricing.pipeline.emptyTable.categories.finishing.flooring" },
	{ value: "جدران", labelKey: "pricing.pipeline.emptyTable.categories.finishing.walls" },
	{ value: "أسقف", labelKey: "pricing.pipeline.emptyTable.categories.finishing.ceilings" },
	{ value: "دهانات", labelKey: "pricing.pipeline.emptyTable.categories.finishing.painting" },
	{ value: "أبواب", labelKey: "pricing.pipeline.emptyTable.categories.finishing.doors" },
	{ value: "نوافذ", labelKey: "pricing.pipeline.emptyTable.categories.finishing.windows" },
	{ value: "مطابخ", labelKey: "pricing.pipeline.emptyTable.categories.finishing.kitchens" },
	{ value: "حمامات", labelKey: "pricing.pipeline.emptyTable.categories.finishing.bathrooms" },
	{ value: "واجهات", labelKey: "pricing.pipeline.emptyTable.categories.finishing.facades" },
	{ value: "أخرى", labelKey: "pricing.pipeline.emptyTable.categories.finishing.other" },
];

const MEP_CATEGORIES = [
	{ value: "كهرباء", labelKey: "pricing.pipeline.emptyTable.categories.mep.electrical" },
	{ value: "سباكة", labelKey: "pricing.pipeline.emptyTable.categories.mep.plumbing" },
	{ value: "تكييف", labelKey: "pricing.pipeline.emptyTable.categories.mep.hvac" },
	{ value: "إطفاء حريق", labelKey: "pricing.pipeline.emptyTable.categories.mep.firefighting" },
	{ value: "مصاعد", labelKey: "pricing.pipeline.emptyTable.categories.mep.elevators" },
	{ value: "أنظمة ذكية", labelKey: "pricing.pipeline.emptyTable.categories.mep.smartSystems" },
	{ value: "أخرى", labelKey: "pricing.pipeline.emptyTable.categories.mep.other" },
];

const SCOPE_OPTIONS = [
	{ value: "per_floor", labelKey: "pricing.pipeline.emptyTable.scopeOptions.per_floor" },
	{ value: "whole_building", labelKey: "pricing.pipeline.emptyTable.scopeOptions.whole_building" },
	{ value: "external", labelKey: "pricing.pipeline.emptyTable.scopeOptions.external" },
	{ value: "roof", labelKey: "pricing.pipeline.emptyTable.scopeOptions.roof" },
];

function getCategoriesForSection(sectionType: SectionType) {
	switch (sectionType) {
		case "structural":
			return STRUCTURAL_CATEGORIES;
		case "finishing":
			return FINISHING_CATEGORIES;
		case "mep":
			return MEP_CATEGORIES;
	}
}

// ═══════════════════════════════════════════════════════════════
// HELPERS — serialize/deserialize extra fields to/from notes
// ═══════════════════════════════════════════════════════════════

function parseExtras(notes: string | null | undefined): ExtraFields {
	if (!notes) return {};
	try {
		const parsed = JSON.parse(notes);
		if (typeof parsed === "object" && parsed !== null) return parsed;
	} catch {
		// Not JSON — treat as plain user notes
		return { userNotes: notes };
	}
	return {};
}

function serializeExtras(extras: ExtraFields): string | undefined {
	const clean: ExtraFields = {};
	for (const [k, v] of Object.entries(extras)) {
		if (v !== undefined && v !== "" && v !== null) {
			(clean as any)[k] = v;
		}
	}
	if (Object.keys(clean).length === 0) return undefined;
	return JSON.stringify(clean);
}

// ═══════════════════════════════════════════════════════════════
// ROW STATE
// ═══════════════════════════════════════════════════════════════

interface RowState {
	description: string;
	unit: string;
	quantity: string;
	extras: ExtraFields;
}

const DEFAULT_ROW: RowState = {
	description: "",
	unit: "م²",
	quantity: "",
	extras: {},
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function EmptySectionTable({
	organizationId,
	studyId,
	sectionType,
}: EmptySectionTableProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const sectionFilter = SECTION_FILTER[sectionType];
	const categories = getCategoriesForSection(sectionType);

	const [showNewRow, setShowNewRow] = useState(false);
	const [newItem, setNewItem] = useState<RowState>({ ...DEFAULT_ROW });
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingRow, setEditingRow] = useState<RowState>({ ...DEFAULT_ROW });

	// ─── Queries ───
	const { data: items = [], isLoading } = useQuery(
		orpc.pricing.studies.manualItem.list.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const filteredItems = (items as Record<string, unknown>[]).filter(
		(item) => item.section === sectionFilter,
	);

	const invalidate = useCallback(() => {
		queryClient.invalidateQueries({
			queryKey: [["pricing", "studies", "manualItem"]],
		});
		queryClient.invalidateQueries({
			queryKey: [["pricing", "studies", "quantitiesSummary"]],
		});
	}, [queryClient]);

	// ─── Mutations ───
	const createMutation = useMutation(
		orpc.pricing.studies.manualItem.create.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.pipeline.emptyTable.itemAdded"));
				invalidate();
				setNewItem({ ...DEFAULT_ROW });
				setShowNewRow(false);
			},
			onError: (e: any) =>
				toast.error(e.message || t("pricing.pipeline.emptyTable.errorOccurred")),
		}),
	);

	const updateMutation = useMutation(
		orpc.pricing.studies.manualItem.update.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.pipeline.emptyTable.itemUpdated"));
				invalidate();
				setEditingId(null);
			},
			onError: (e: any) =>
				toast.error(e.message || t("pricing.pipeline.emptyTable.errorOccurred")),
		}),
	);

	const deleteMutation = useMutation(
		orpc.pricing.studies.manualItem.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.pipeline.emptyTable.itemDeleted"));
				invalidate();
			},
			onError: (e: any) =>
				toast.error(e.message || t("pricing.pipeline.emptyTable.errorOccurred")),
		}),
	);

	// ─── Handlers ───
	const handleCreate = () => {
		if (!newItem.description || !newItem.quantity) return;
		(createMutation as any).mutate({
			organizationId,
			studyId,
			description: newItem.description,
			unit: newItem.unit,
			quantity: Number.parseFloat(newItem.quantity) || 0,
			section: sectionFilter,
			notes: serializeExtras(newItem.extras),
		});
	};

	const handleUpdate = () => {
		if (!editingId) return;
		(updateMutation as any).mutate({
			organizationId,
			itemId: editingId,
			description: editingRow.description,
			unit: editingRow.unit,
			quantity: Number.parseFloat(editingRow.quantity) || 0,
			section: sectionFilter,
			notes: serializeExtras(editingRow.extras),
		});
	};

	const handleDelete = (itemId: string) => {
		(deleteMutation as any).mutate({ organizationId, itemId });
	};

	const startEditing = (item: Record<string, unknown>) => {
		const extras = parseExtras(item.notes as string);
		setEditingId(item.id as string);
		setEditingRow({
			description: item.description as string,
			unit: item.unit as string,
			quantity: String(item.quantity),
			extras,
		});
	};

	// ─── Column rendering helpers ───
	const renderCategorySelect = (
		value: string | undefined,
		onChange: (v: string) => void,
	) => (
		<Select value={value || "none"} onValueChange={(v: any) => onChange(v === "none" ? "" : v)}>
			<SelectTrigger className="h-8">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="none">—</SelectItem>
				{categories.map((c) => (
					<SelectItem key={c.value} value={c.value}>
						{t(c.labelKey)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);

	const renderUnitSelect = (value: string, onChange: (v: string) => void) => (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="h-8">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{UNITS.map((u) => (
					<SelectItem key={u.value} value={u.value}>
						{u.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);

	// ─── Get columns for this section ───
	const columns = getColumns(sectionType, t);

	return (
		<div className="space-y-4" dir="rtl">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">
					{t(`pricing.pipeline.emptyTable.title_${sectionType}`)}
				</h3>
				<Button
					size="sm"
					variant="outline"
					onClick={() => setShowNewRow(true)}
					disabled={showNewRow}
					className="gap-1.5"
				>
					<Plus className="h-3.5 w-3.5" />
					{t("pricing.pipeline.emptyTable.addRow")}
				</Button>
			</div>

			{/* Table */}
			<div className="overflow-x-auto rounded-xl border">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="px-3 py-2.5 text-start font-medium w-10">#</th>
							{columns.map((col) => (
								<th
									key={col.key}
									className={cn(
										"px-3 py-2.5 text-start font-medium",
										col.width,
									)}
								>
									{col.label}
								</th>
							))}
							<th className="px-3 py-2.5 text-center font-medium w-20">
								{t("pricing.pipeline.emptyTable.actions")}
							</th>
						</tr>
					</thead>
					<tbody>
						{isLoading && (
							<tr>
								<td
									colSpan={columns.length + 2}
									className="text-center py-8 text-muted-foreground"
								>
									<Loader2 className="h-5 w-5 animate-spin mx-auto" />
								</td>
							</tr>
						)}

						{!isLoading && filteredItems.length === 0 && !showNewRow && (
							<tr>
								<td
									colSpan={columns.length + 2}
									className="text-center py-8 text-muted-foreground"
								>
									{t("pricing.pipeline.emptyTable.noItems")}
								</td>
							</tr>
						)}

						{/* Existing items */}
						{filteredItems.map((item, idx) => {
							const isEditing = editingId === item.id;
							const extras = parseExtras(item.notes as string);

							if (isEditing) {
								return (
									<tr
										key={item.id as string}
										className="border-b bg-chart-4/15 dark:bg-chart-4/20"
									>
										<td className="px-3 py-1.5 text-muted-foreground">
											{idx + 1}
										</td>
										{renderEditCells(
											sectionType,
											editingRow,
											setEditingRow,
											renderCategorySelect,
											renderUnitSelect,
											t,
										)}
										<td className="px-3 py-1.5">
											<div className="flex items-center justify-center gap-1">
												<Button
													size="icon"
													variant="ghost"
													className="h-7 w-7"
													onClick={handleUpdate}
													disabled={updateMutation.isPending}
												>
													<Save className="h-3.5 w-3.5 text-emerald-600" />
												</Button>
												<Button
													size="icon"
													variant="ghost"
													className="h-7 w-7"
													onClick={() => setEditingId(null)}
												>
													<X className="h-3.5 w-3.5" />
												</Button>
											</div>
										</td>
									</tr>
								);
							}

							return (
								<tr
									key={item.id as string}
									className="border-b hover:bg-accent/30 transition-colors"
								>
									<td className="px-3 py-2.5 text-muted-foreground">
										{idx + 1}
									</td>
									{renderDisplayCells(sectionType, item, extras, t)}
									<td className="px-3 py-2.5">
										<div className="flex items-center justify-center gap-1">
											<Button
												size="icon"
												variant="ghost"
												className="h-7 w-7"
												onClick={() => startEditing(item)}
											>
												<Pencil className="h-3.5 w-3.5" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												className="h-7 w-7 text-destructive"
												onClick={() =>
													handleDelete(item.id as string)
												}
												disabled={deleteMutation.isPending}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</div>
									</td>
								</tr>
							);
						})}

						{/* New item row */}
						{showNewRow && (
							<tr className="border-b bg-emerald-50/50 dark:bg-emerald-950/20">
								<td className="px-3 py-1.5 text-muted-foreground">—</td>
								{renderEditCells(
									sectionType,
									newItem,
									setNewItem,
									renderCategorySelect,
									renderUnitSelect,
									t,
								)}
								<td className="px-3 py-1.5">
									<div className="flex items-center justify-center gap-1">
										<Button
											size="icon"
											variant="ghost"
											className="h-7 w-7"
											onClick={handleCreate}
											disabled={
												createMutation.isPending ||
												!newItem.description ||
												!newItem.quantity
											}
										>
											{createMutation.isPending ? (
												<Loader2 className="h-3.5 w-3.5 animate-spin" />
											) : (
												<Save className="h-3.5 w-3.5 text-emerald-600" />
											)}
										</Button>
										<Button
											size="icon"
											variant="ghost"
											className="h-7 w-7"
											onClick={() => {
												setShowNewRow(false);
												setNewItem({ ...DEFAULT_ROW });
											}}
										>
											<X className="h-3.5 w-3.5" />
										</Button>
									</div>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// COLUMN DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface ColumnDef {
	key: string;
	label: string;
	width?: string;
}

function getColumns(
	sectionType: SectionType,
	t: ReturnType<typeof useTranslations>,
): ColumnDef[] {
	const base = {
		category: { key: "category", label: t("pricing.pipeline.emptyTable.category"), width: "w-32" },
		description: { key: "description", label: t("pricing.pipeline.emptyTable.description"), width: "min-w-[180px]" },
		unit: { key: "unit", label: t("pricing.pipeline.emptyTable.unit"), width: "w-24" },
		quantity: { key: "quantity", label: t("pricing.pipeline.emptyTable.quantity"), width: "w-24" },
		notes: { key: "notes", label: t("pricing.pipeline.emptyTable.notes"), width: "min-w-[100px]" },
	};

	switch (sectionType) {
		case "structural":
			return [
				base.category,
				base.description,
				base.unit,
				base.quantity,
				{ key: "concreteVolume", label: t("pricing.pipeline.emptyTable.concreteVolume"), width: "w-28" },
				{ key: "steelWeight", label: t("pricing.pipeline.emptyTable.steelWeight"), width: "w-28" },
				base.notes,
			];
		case "finishing":
			return [
				base.category,
				{ key: "subCategory", label: t("pricing.pipeline.emptyTable.subCategory"), width: "w-28" },
				{ key: "floor", label: t("pricing.pipeline.emptyTable.floor"), width: "w-24" },
				{ key: "scope", label: t("pricing.pipeline.emptyTable.scope"), width: "w-28" },
				base.quantity,
				base.unit,
				{ key: "wastagePercent", label: t("pricing.pipeline.emptyTable.wastagePercent"), width: "w-24" },
			];
		case "mep":
			return [
				base.category,
				{ key: "subCategory", label: t("pricing.pipeline.emptyTable.subCategory"), width: "w-28" },
				{ key: "itemType", label: t("pricing.pipeline.emptyTable.itemType"), width: "min-w-[140px]" },
				base.quantity,
				base.unit,
			];
	}
}

// ═══════════════════════════════════════════════════════════════
// DISPLAY CELLS (read-only row)
// ═══════════════════════════════════════════════════════════════

function renderDisplayCells(
	sectionType: SectionType,
	item: Record<string, unknown>,
	extras: ExtraFields,
	t: ReturnType<typeof useTranslations>,
) {
	const desc = item.description as string;
	const unit = item.unit as string;
	const qty = Number(item.quantity);

	// Stored category values are legacy Arabic strings — translate for display,
	// falling back to the raw stored value if unknown.
	const categoryMatch = extras.category
		? getCategoriesForSection(sectionType).find(
				(c) => c.value === extras.category,
			)
		: undefined;
	const categoryLabel = categoryMatch
		? t(categoryMatch.labelKey)
		: extras.category || "—";

	switch (sectionType) {
		case "structural":
			return (
				<>
					<td className="px-3 py-2.5 text-muted-foreground">{categoryLabel}</td>
					<td className="px-3 py-2.5 font-medium">{desc}</td>
					<td className="px-3 py-2.5 text-muted-foreground">{unit}</td>
					<td className="px-3 py-2.5 tabular-nums" dir="ltr">{qty}</td>
					<td className="px-3 py-2.5 tabular-nums" dir="ltr">{extras.concreteVolume ?? "—"}</td>
					<td className="px-3 py-2.5 tabular-nums" dir="ltr">{extras.steelWeight ?? "—"}</td>
					<td className="px-3 py-2.5 text-muted-foreground text-xs">{extras.userNotes || "—"}</td>
				</>
			);
		case "finishing": {
			const scopeMatch = extras.scope
				? SCOPE_OPTIONS.find((s) => s.value === extras.scope)
				: undefined;
			return (
				<>
					<td className="px-3 py-2.5 text-muted-foreground">{categoryLabel}</td>
					<td className="px-3 py-2.5 text-muted-foreground">{extras.subCategory || "—"}</td>
					<td className="px-3 py-2.5 text-muted-foreground">{extras.floor || "—"}</td>
					<td className="px-3 py-2.5 text-muted-foreground">
						{extras.scope ? (scopeMatch ? t(scopeMatch.labelKey) : extras.scope) : "—"}
					</td>
					<td className="px-3 py-2.5 tabular-nums" dir="ltr">{qty}</td>
					<td className="px-3 py-2.5 text-muted-foreground">{unit}</td>
					<td className="px-3 py-2.5 tabular-nums" dir="ltr">{extras.wastagePercent ?? 0}%</td>
				</>
			);
		}
		case "mep":
			return (
				<>
					<td className="px-3 py-2.5 text-muted-foreground">{categoryLabel}</td>
					<td className="px-3 py-2.5 text-muted-foreground">{extras.subCategory || "—"}</td>
					<td className="px-3 py-2.5 font-medium">{extras.itemType || desc}</td>
					<td className="px-3 py-2.5 tabular-nums" dir="ltr">{qty}</td>
					<td className="px-3 py-2.5 text-muted-foreground">{unit}</td>
				</>
			);
	}
}

// ═══════════════════════════════════════════════════════════════
// EDIT CELLS (editing/new row)
// ═══════════════════════════════════════════════════════════════

function renderEditCells(
	sectionType: SectionType,
	row: RowState,
	setRow: (r: RowState) => void,
	renderCategorySelect: (value: string | undefined, onChange: (v: string) => void) => React.ReactNode,
	renderUnitSelect: (value: string, onChange: (v: string) => void) => React.ReactNode,
	t: ReturnType<typeof useTranslations>,
) {
	const updateExtras = (patch: Partial<ExtraFields>) =>
		setRow({ ...row, extras: { ...row.extras, ...patch } });

	switch (sectionType) {
		case "structural":
			return (
				<>
					<td className="px-3 py-1.5">
						{renderCategorySelect(row.extras.category, (v) => updateExtras({ category: v }))}
					</td>
					<td className="px-3 py-1.5">
						<Input
							placeholder={t("pricing.pipeline.emptyTable.descriptionPlaceholder")}
							value={row.description}
							onChange={(e: any) => setRow({ ...row, description: e.target.value })}
							className="h-8"
							autoFocus
						/>
					</td>
					<td className="px-3 py-1.5">
						{renderUnitSelect(row.unit, (v) => setRow({ ...row, unit: v }))}
					</td>
					<td className="px-3 py-1.5">
						<Input
							type="number"
							placeholder="0"
							value={row.quantity}
							onChange={(e: any) => setRow({ ...row, quantity: e.target.value })}
							className="h-8"
							dir="ltr"
						/>
					</td>
					<td className="px-3 py-1.5">
						<Input
							type="number"
							placeholder="0"
							value={row.extras.concreteVolume ?? ""}
							onChange={(e: any) =>
								updateExtras({ concreteVolume: e.target.value ? Number(e.target.value) : undefined })
							}
							className="h-8"
							dir="ltr"
						/>
					</td>
					<td className="px-3 py-1.5">
						<Input
							type="number"
							placeholder="0"
							value={row.extras.steelWeight ?? ""}
							onChange={(e: any) =>
								updateExtras({ steelWeight: e.target.value ? Number(e.target.value) : undefined })
							}
							className="h-8"
							dir="ltr"
						/>
					</td>
					<td className="px-3 py-1.5">
						<Input
							placeholder={t("pricing.pipeline.emptyTable.notesPlaceholder")}
							value={row.extras.userNotes ?? ""}
							onChange={(e: any) => updateExtras({ userNotes: e.target.value })}
							className="h-8"
						/>
					</td>
				</>
			);
		case "finishing":
			return (
				<>
					<td className="px-3 py-1.5">
						{renderCategorySelect(row.extras.category, (v) => updateExtras({ category: v }))}
					</td>
					<td className="px-3 py-1.5">
						<Input
							placeholder={t("pricing.pipeline.emptyTable.subCategoryPlaceholder")}
							value={row.extras.subCategory ?? ""}
							onChange={(e: any) => updateExtras({ subCategory: e.target.value })}
							className="h-8"
						/>
					</td>
					<td className="px-3 py-1.5">
						<Input
							placeholder={t("pricing.pipeline.emptyTable.floorPlaceholder")}
							value={row.extras.floor ?? ""}
							onChange={(e: any) => updateExtras({ floor: e.target.value })}
							className="h-8"
						/>
					</td>
					<td className="px-3 py-1.5">
						<Select
							value={row.extras.scope || "none"}
							onValueChange={(v: any) => updateExtras({ scope: v === "none" ? "" : v })}
						>
							<SelectTrigger className="h-8">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">—</SelectItem>
								{SCOPE_OPTIONS.map((s) => (
									<SelectItem key={s.value} value={s.value}>
										{t(s.labelKey)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</td>
					<td className="px-3 py-1.5">
						<Input
							type="number"
							placeholder="0"
							value={row.quantity}
							onChange={(e: any) => setRow({ ...row, quantity: e.target.value })}
							className="h-8"
							dir="ltr"
						/>
					</td>
					<td className="px-3 py-1.5">
						{renderUnitSelect(row.unit, (v) => setRow({ ...row, unit: v }))}
					</td>
					<td className="px-3 py-1.5">
						<Input
							type="number"
							placeholder="0"
							value={row.extras.wastagePercent ?? ""}
							onChange={(e: any) =>
								updateExtras({ wastagePercent: e.target.value ? Number(e.target.value) : undefined })
							}
							className="h-8"
							dir="ltr"
						/>
					</td>
				</>
			);
		case "mep":
			return (
				<>
					<td className="px-3 py-1.5">
						{renderCategorySelect(row.extras.category, (v) => updateExtras({ category: v }))}
					</td>
					<td className="px-3 py-1.5">
						<Input
							placeholder={t("pricing.pipeline.emptyTable.subCategoryPlaceholder")}
							value={row.extras.subCategory ?? ""}
							onChange={(e: any) => updateExtras({ subCategory: e.target.value })}
							className="h-8"
						/>
					</td>
					<td className="px-3 py-1.5">
						<Input
							placeholder={t("pricing.pipeline.emptyTable.itemTypePlaceholder")}
							value={row.extras.itemType ?? row.description}
							onChange={(e: any) => {
								updateExtras({ itemType: e.target.value });
								setRow({ ...row, description: e.target.value, extras: { ...row.extras, itemType: e.target.value } });
							}}
							className="h-8"
							autoFocus
						/>
					</td>
					<td className="px-3 py-1.5">
						<Input
							type="number"
							placeholder="0"
							value={row.quantity}
							onChange={(e: any) => setRow({ ...row, quantity: e.target.value })}
							className="h-8"
							dir="ltr"
						/>
					</td>
					<td className="px-3 py-1.5">
						{renderUnitSelect(row.unit, (v) => setRow({ ...row, unit: v }))}
					</td>
				</>
			);
	}
}
