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
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════

interface ManualItemsTableProps {
	organizationId: string;
	studyId: string;
	filterSection?: string;
	defaultSection?: string;
}

const UNITS = [
	{ value: "م²", label: "م²" },
	{ value: "م³", label: "م³" },
	{ value: "م.ط", label: "م.ط" },
	{ value: "كجم", label: "كجم" },
	{ value: "طن", label: "طن" },
	{ value: "حبة", label: "حبة" },
	{ value: "نقطة", label: "نقطة" },
	{ value: "مجموعة", label: "مجموعة" },
	{ value: "شهر", label: "شهر" },
	{ value: "يوم", label: "يوم" },
	{ value: "مقطوع", label: "مقطوع" },
];

const SECTIONS = [
	{ value: "إنشائي", label: "إنشائي" },
	{ value: "تشطيبات", label: "تشطيبات" },
	{ value: "كهروميكانيكية", label: "كهروميكانيكية" },
	{ value: "عمالة", label: "عمالة" },
	{ value: "أخرى", label: "أخرى" },
];

interface NewItemState {
	description: string;
	unit: string;
	quantity: string;
	section: string;
	notes: string;
}

const DEFAULT_NEW_ITEM: NewItemState = {
	description: "",
	unit: "م²",
	quantity: "",
	section: "",
	notes: "",
};

interface EditingState {
	id: string;
	description: string;
	unit: string;
	quantity: string;
	section: string;
	notes: string;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ManualItemsTable({
	organizationId,
	studyId,
	filterSection,
	defaultSection,
}: ManualItemsTableProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const emptyNewItem = { ...DEFAULT_NEW_ITEM, section: defaultSection ?? "" };
	const [showNewRow, setShowNewRow] = useState(false);
	const [newItem, setNewItem] = useState<NewItemState>(emptyNewItem);
	const [editing, setEditing] = useState<EditingState | null>(null);

	// ─── Queries ───
	const { data: items = [], isLoading } = useQuery(
		orpc.pricing.studies.manualItem.list.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const filteredItems = filterSection
		? (items as Record<string, unknown>[]).filter((item) => item.section === filterSection)
		: (items as Record<string, unknown>[]);

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
				toast.success("تم إضافة البند");
				invalidate();
				setNewItem(emptyNewItem);
				setShowNewRow(false);
			},
			onError: (e: any) => toast.error(e.message || "حدث خطأ"),
		}),
	);

	const updateMutation = useMutation(
		orpc.pricing.studies.manualItem.update.mutationOptions({
			onSuccess: () => {
				toast.success("تم تحديث البند");
				invalidate();
				setEditing(null);
			},
			onError: (e: any) => toast.error(e.message || "حدث خطأ"),
		}),
	);

	const deleteMutation = useMutation(
		orpc.pricing.studies.manualItem.delete.mutationOptions({
			onSuccess: () => {
				toast.success("تم حذف البند");
				invalidate();
			},
			onError: (e: any) => toast.error(e.message || "حدث خطأ"),
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
			section: newItem.section || undefined,
			notes: newItem.notes || undefined,
		});
	};

	const handleUpdate = () => {
		if (!editing) return;
		(updateMutation as any).mutate({
			organizationId,
			itemId: editing.id,
			description: editing.description,
			unit: editing.unit,
			quantity: Number.parseFloat(editing.quantity) || 0,
			section: editing.section || null,
			notes: editing.notes || null,
		});
	};

	const handleDelete = (itemId: string) => {
		(deleteMutation as any).mutate({ organizationId, itemId });
	};

	const startEditing = (item: Record<string, unknown>) => {
		setEditing({
			id: item.id as string,
			description: item.description as string,
			unit: item.unit as string,
			quantity: String(item.quantity),
			section: (item.section as string) || "",
			notes: (item.notes as string) || "",
		});
	};

	// ─── Render ───
	return (
		<div className="space-y-4" dir="rtl">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">
					{t("pricing.pipeline.manualItems")}
				</h3>
				<Button
					size="sm"
					variant="outline"
					onClick={() => setShowNewRow(true)}
					disabled={showNewRow}
					className="gap-1.5"
				>
					<Plus className="h-3.5 w-3.5" />
					إضافة بند
				</Button>
			</div>

			{/* Table */}
			<div className="overflow-x-auto rounded-xl border">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="px-3 py-2.5 text-right font-medium w-10">#</th>
							<th className="px-3 py-2.5 text-right font-medium min-w-[200px]">الوصف</th>
							<th className="px-3 py-2.5 text-right font-medium w-24">الوحدة</th>
							<th className="px-3 py-2.5 text-right font-medium w-24">الكمية</th>
							<th className="px-3 py-2.5 text-right font-medium w-28">القسم</th>
							<th className="px-3 py-2.5 text-right font-medium min-w-[120px]">ملاحظات</th>
							<th className="px-3 py-2.5 text-center font-medium w-20">إجراءات</th>
						</tr>
					</thead>
					<tbody>
						{isLoading && (
							<tr>
								<td colSpan={7} className="text-center py-8 text-muted-foreground">
									<Loader2 className="h-5 w-5 animate-spin mx-auto" />
								</td>
							</tr>
						)}

						{!isLoading && filteredItems.length === 0 && !showNewRow && (
							<tr>
								<td colSpan={7} className="text-center py-8 text-muted-foreground">
									لا توجد بنود يدوية. اضغط &quot;إضافة بند&quot; للبدء.
								</td>
							</tr>
						)}

						{/* Existing items */}
						{filteredItems.map((item, idx) => {
							const isEditing = editing?.id === item.id;

							if (isEditing && editing) {
								return (
									<tr key={item.id as string} className="border-b bg-blue-50/50 dark:bg-blue-950/20">
										<td className="px-3 py-1.5 text-muted-foreground">{idx + 1}</td>
										<td className="px-3 py-1.5">
											<Input
												value={editing.description}
												onChange={(e: any) => setEditing({ ...editing, description: e.target.value })}
												className="h-8"
											/>
										</td>
										<td className="px-3 py-1.5">
											<Select value={editing.unit} onValueChange={(v: any) => setEditing({ ...editing, unit: v })}>
												<SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
												<SelectContent>
													{UNITS.map((u) => (
														<SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
													))}
												</SelectContent>
											</Select>
										</td>
										<td className="px-3 py-1.5">
											<Input
												type="number"
												value={editing.quantity}
												onChange={(e: any) => setEditing({ ...editing, quantity: e.target.value })}
												className="h-8"
												dir="ltr"
											/>
										</td>
										<td className="px-3 py-1.5">
											<Select value={editing.section || "none"} onValueChange={(v: any) => setEditing({ ...editing, section: v === "none" ? "" : v })}>
												<SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
												<SelectContent>
													<SelectItem value="none">—</SelectItem>
													{SECTIONS.map((s) => (
														<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
													))}
												</SelectContent>
											</Select>
										</td>
										<td className="px-3 py-1.5">
											<Input
												value={editing.notes}
												onChange={(e: any) => setEditing({ ...editing, notes: e.target.value })}
												className="h-8"
											/>
										</td>
										<td className="px-3 py-1.5">
											<div className="flex items-center justify-center gap-1">
												<Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleUpdate} disabled={updateMutation.isPending}>
													<Save className="h-3.5 w-3.5 text-emerald-600" />
												</Button>
												<Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(null)}>
													<X className="h-3.5 w-3.5" />
												</Button>
											</div>
										</td>
									</tr>
								);
							}

							return (
								<tr key={item.id as string} className="border-b hover:bg-accent/30 transition-colors">
									<td className="px-3 py-2.5 text-muted-foreground">{idx + 1}</td>
									<td className="px-3 py-2.5 font-medium">{item.description as string}</td>
									<td className="px-3 py-2.5 text-muted-foreground">{item.unit as string}</td>
									<td className="px-3 py-2.5 tabular-nums" dir="ltr">{Number(item.quantity)}</td>
									<td className="px-3 py-2.5 text-muted-foreground">{(item.section as string) || "—"}</td>
									<td className="px-3 py-2.5 text-muted-foreground text-xs">{(item.notes as string) || "—"}</td>
									<td className="px-3 py-2.5">
										<div className="flex items-center justify-center gap-1">
											<Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditing(item)}>
												<Pencil className="h-3.5 w-3.5" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												className="h-7 w-7 text-destructive"
												onClick={() => handleDelete(item.id as string)}
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
								<td className="px-3 py-1.5">
									<Input
										placeholder="وصف البند..."
										value={newItem.description}
										onChange={(e: any) => setNewItem({ ...newItem, description: e.target.value })}
										className="h-8"
										autoFocus
									/>
								</td>
								<td className="px-3 py-1.5">
									<Select value={newItem.unit} onValueChange={(v: any) => setNewItem({ ...newItem, unit: v })}>
										<SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
										<SelectContent>
											{UNITS.map((u) => (
												<SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</td>
								<td className="px-3 py-1.5">
									<Input
										type="number"
										placeholder="0"
										value={newItem.quantity}
										onChange={(e: any) => setNewItem({ ...newItem, quantity: e.target.value })}
										className="h-8"
										dir="ltr"
									/>
								</td>
								<td className="px-3 py-1.5">
									<Select value={newItem.section || "none"} onValueChange={(v: any) => setNewItem({ ...newItem, section: v === "none" ? "" : v })}>
										<SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
										<SelectContent>
											<SelectItem value="none">—</SelectItem>
											{SECTIONS.map((s) => (
												<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</td>
								<td className="px-3 py-1.5">
									<Input
										placeholder="ملاحظات..."
										value={newItem.notes}
										onChange={(e: any) => setNewItem({ ...newItem, notes: e.target.value })}
										className="h-8"
									/>
								</td>
								<td className="px-3 py-1.5">
									<div className="flex items-center justify-center gap-1">
										<Button
											size="icon"
											variant="ghost"
											className="h-7 w-7"
											onClick={handleCreate}
											disabled={createMutation.isPending || !newItem.description || !newItem.quantity}
										>
											{createMutation.isPending ? (
												<Loader2 className="h-3.5 w-3.5 animate-spin" />
											) : (
												<Save className="h-3.5 w-3.5 text-emerald-600" />
											)}
										</Button>
										<Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setShowNewRow(false); setNewItem(emptyNewItem); }}>
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
