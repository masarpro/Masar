"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
	Calculator,
	FileText,
	Loader2,
	Plus,
	Save,
	Trash2,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════

interface QuickPricingPageContentProps {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

interface QuickItem {
	id: string;
	description: string;
	unit: string;
	quantity: string;
	unitPrice: string;
}

const UNITS = [
	{ value: "م²", label: "م²" },
	{ value: "م³", label: "م³" },
	{ value: "م.ط", label: "م.ط" },
	{ value: "كجم", label: "كجم" },
	{ value: "عدد", label: "عدد" },
	{ value: "طن", label: "طن" },
	{ value: "مقطوعية", label: "مقطوعية" },
];

const createEmptyItem = (): QuickItem => ({
	id: crypto.randomUUID(),
	description: "",
	unit: "م²",
	quantity: "",
	unitPrice: "",
});

const formatNum = (n: number) =>
	Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function QuickPricingPageContent({
	organizationId,
	organizationSlug,
	studyId,
}: QuickPricingPageContentProps) {
	const router = useRouter();
	const queryClient = useQueryClient();

	// ─── Local state ──────────────────────────────────────────────
	const [items, setItems] = useState<QuickItem[]>([
		createEmptyItem(),
		createEmptyItem(),
		createEmptyItem(),
	]);
	const [profitMarginPct, setProfitMarginPct] = useState("15");
	const [vatEnabled, setVatEnabled] = useState(false);

	// ─── Derived values ───────────────────────────────────────────
	const getItemTotal = useCallback((item: QuickItem) => {
		const qty = Number(item.quantity) || 0;
		const price = Number(item.unitPrice) || 0;
		return qty * price;
	}, []);

	const filledItems = useMemo(
		() => items.filter((item) => item.description.trim() !== ""),
		[items],
	);

	const subtotal = useMemo(
		() => items.reduce((sum, item) => sum + getItemTotal(item), 0),
		[items, getItemTotal],
	);

	const profitMarginNum = Number(profitMarginPct) || 0;
	const profitAmount = subtotal * (profitMarginNum / 100);
	const afterProfit = subtotal + profitAmount;
	const vatAmount = vatEnabled ? afterProfit * 0.15 : 0;
	const grandTotal = afterProfit + vatAmount;

	// ─── Auto-add row when last row gets data ─────────────────────
	const handleItemChange = useCallback(
		(id: string, field: keyof QuickItem, value: string) => {
			setItems((prev) => {
				const updated = prev.map((item) =>
					item.id === id ? { ...item, [field]: value } : item,
				);

				// If editing the last row and it now has data, add a new empty row
				const lastItem = updated[updated.length - 1];
				if (
					lastItem &&
					lastItem.id === id &&
					(field === "description" ||
						field === "quantity" ||
						field === "unitPrice") &&
					value.trim() !== ""
				) {
					const hasContent =
						lastItem.description.trim() !== "" ||
						lastItem.quantity.trim() !== "" ||
						lastItem.unitPrice.trim() !== "";
					if (hasContent) {
						updated.push(createEmptyItem());
					}
				}

				return updated;
			});
		},
		[],
	);

	const handleDeleteItem = useCallback(
		(id: string) => {
			setItems((prev) => {
				// Don't delete if it's the only row
				if (prev.length <= 1) return prev;
				return prev.filter((item) => item.id !== id);
			});
		},
		[],
	);

	const handleAddItem = useCallback(() => {
		setItems((prev) => [...prev, createEmptyItem()]);
	}, []);

	// ─── Mutations ────────────────────────────────────────────────
	const saveMutation = useMutation(
		orpc.pricing.studies.manualItem.create.mutationOptions({
			onError: (e: any) => toast.error(e.message || "حدث خطأ أثناء الحفظ"),
		}),
	);

	const approveMutation = useMutation(
		orpc.pricing.studies.stages.approve.mutationOptions({
			onSuccess: () => {
				toast.success("تم اعتماد مرحلة التسعير");
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "stages"]],
				});
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "studyStages"]],
				});
			},
			onError: (error: any) => {
				toast.error(error.message || "حدث خطأ أثناء الاعتماد");
			},
		}),
	);

	// ─── Handlers ─────────────────────────────────────────────────
	const handleSaveItems = async () => {
		const validItems = items.filter(
			(item) =>
				item.description.trim() !== "" &&
				(Number(item.quantity) || 0) > 0,
		);

		if (validItems.length === 0) {
			toast.error("يرجى إضافة بند واحد على الأقل");
			return;
		}

		try {
			for (const item of validItems) {
				await (saveMutation as any).mutateAsync({
					organizationId,
					studyId,
					description: item.description,
					unit: item.unit,
					quantity: Number(item.quantity) || 0,
					section: "أخرى",
					notes: item.unitPrice
						? `سعر الوحدة: ${item.unitPrice}`
						: undefined,
				});
			}

			toast.success(`تم حفظ ${validItems.length} بند بنجاح`);
			queryClient.invalidateQueries({
				queryKey: [["pricing", "studies", "manualItem"]],
			});
			queryClient.invalidateQueries({
				queryKey: [["pricing", "studies", "quantitiesSummary"]],
			});
		} catch {
			// Error already handled by mutation onError
		}
	};

	const handleCreateQuotation = () => {
		router.push(
			`/app/${organizationSlug}/pricing/studies/${studyId}/quotation`,
		);
	};

	const handleApprove = () => {
		(approveMutation as any).mutate({
			organizationId,
			studyId,
			stage: "pricing",
		});
	};

	// ─── Render ───────────────────────────────────────────────────
	return (
		<div className="space-y-6" dir="rtl">
			{/* ═══ Title bar ═══ */}
			<div className="rounded-2xl bg-gradient-to-bl from-amber-500/15 via-amber-500/5 to-background border border-amber-500/20 p-6">
				<div className="flex items-center gap-3 mb-2">
					<div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40">
						<Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
					</div>
					<div>
						<h2 className="text-xl font-bold">تسعير سريع</h2>
						<p className="text-sm text-muted-foreground">
							أدخل البنود والأسعار مباشرة لإنشاء عرض سعر سريع
						</p>
					</div>
				</div>
			</div>

			{/* ═══ Editable items table ═══ */}
			<div className="rounded-xl border border-border bg-card overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="px-3 py-3 text-right font-medium w-10">
									#
								</th>
								<th className="px-3 py-3 text-right font-medium min-w-[220px]">
									الوصف
								</th>
								<th className="px-3 py-3 text-right font-medium w-28">
									الوحدة
								</th>
								<th className="px-3 py-3 text-center font-medium w-28">
									الكمية
								</th>
								<th className="px-3 py-3 text-center font-medium w-32">
									سعر الوحدة
								</th>
								<th className="px-3 py-3 text-center font-medium w-32">
									الإجمالي
								</th>
								<th className="px-3 py-3 text-center font-medium w-14">
									حذف
								</th>
							</tr>
						</thead>
						<tbody>
							{items.map((item, idx) => {
								const rowTotal = getItemTotal(item);
								const isEmpty =
									item.description.trim() === "" &&
									item.quantity.trim() === "" &&
									item.unitPrice.trim() === "";

								return (
									<tr
										key={item.id}
										className={cn(
											"border-b last:border-0 transition-colors",
											isEmpty
												? "bg-muted/10"
												: "hover:bg-accent/30",
										)}
									>
										<td className="px-3 py-1.5 text-muted-foreground text-xs">
											{idx + 1}
										</td>
										<td className="px-3 py-1.5">
											<Input
												placeholder="وصف البند..."
												value={item.description}
												onChange={(e: any) =>
													handleItemChange(
														item.id,
														"description",
														e.target.value,
													)
												}
												className="h-8 border-transparent bg-transparent hover:border-border focus:border-border transition-colors"
											/>
										</td>
										<td className="px-3 py-1.5">
											<Select
												value={item.unit}
												onValueChange={(v: any) =>
													handleItemChange(
														item.id,
														"unit",
														v,
													)
												}
											>
												<SelectTrigger className="h-8 border-transparent bg-transparent hover:border-border">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{UNITS.map((u) => (
														<SelectItem
															key={u.value}
															value={u.value}
														>
															{u.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</td>
										<td className="px-3 py-1.5">
											<Input
												type="number"
												placeholder="0"
												value={item.quantity}
												onChange={(e: any) =>
													handleItemChange(
														item.id,
														"quantity",
														e.target.value,
													)
												}
												className="h-8 text-center border-transparent bg-transparent hover:border-border focus:border-border transition-colors"
												dir="ltr"
											/>
										</td>
										<td className="px-3 py-1.5">
											<Input
												type="number"
												placeholder="0.00"
												value={item.unitPrice}
												onChange={(e: any) =>
													handleItemChange(
														item.id,
														"unitPrice",
														e.target.value,
													)
												}
												className="h-8 text-center border-transparent bg-transparent hover:border-border focus:border-border transition-colors"
												dir="ltr"
											/>
										</td>
										<td className="px-3 py-1.5 text-center tabular-nums font-medium" dir="ltr">
											{rowTotal > 0
												? formatNum(rowTotal)
												: "—"}
										</td>
										<td className="px-3 py-1.5 text-center">
											<Button
												size="icon"
												variant="ghost"
												className="h-7 w-7 text-destructive/60 hover:text-destructive"
												onClick={() =>
													handleDeleteItem(item.id)
												}
												disabled={items.length <= 1}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</td>
									</tr>
								);
							})}
						</tbody>
						<tfoot>
							<tr className="border-t-2 border-border bg-muted/30 font-semibold">
								<td className="px-3 py-3" colSpan={5}>
									<span className="text-muted-foreground text-xs font-medium">
										الإجمالي
									</span>
								</td>
								<td className="px-3 py-3 text-center text-primary text-base" dir="ltr">
									{formatNum(subtotal)} ر.س
								</td>
								<td />
							</tr>
						</tfoot>
					</table>
				</div>

				{/* Add item button */}
				<div className="p-3 border-t border-border">
					<Button
						variant="outline"
						size="sm"
						onClick={handleAddItem}
						className="gap-1.5 rounded-lg"
					>
						<Plus className="h-3.5 w-3.5" />
						إضافة بند
					</Button>
				</div>
			</div>

			{/* ═══ Quick summary ═══ */}
			<div className="rounded-xl border border-border bg-card p-5 space-y-4">
				<div className="flex items-center gap-2 mb-1">
					<Calculator className="h-4 w-4 text-primary" />
					<h3 className="font-semibold text-sm">ملخص التسعير</h3>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{/* Left column — numbers */}
					<div className="space-y-3">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								عدد البنود
							</span>
							<span className="font-medium">
								{filledItems.length}
							</span>
						</div>

						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								إجمالي التكلفة
							</span>
							<span className="font-medium" dir="ltr">
								{formatNum(subtotal)} ر.س
							</span>
						</div>

						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								هامش الربح ({profitMarginNum}%)
							</span>
							<span className="font-medium text-emerald-600" dir="ltr">
								+{formatNum(profitAmount)} ر.س
							</span>
						</div>

						{vatEnabled && (
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">
									ضريبة القيمة المضافة (15%)
								</span>
								<span className="font-medium" dir="ltr">
									+{formatNum(vatAmount)} ر.س
								</span>
							</div>
						)}

						<div className="border-t border-border pt-3 flex items-center justify-between">
							<span className="font-semibold">
								الإجمالي النهائي
							</span>
							<span className="font-bold text-lg text-primary" dir="ltr">
								{formatNum(grandTotal)} ر.س
							</span>
						</div>
					</div>

					{/* Right column — inputs */}
					<div className="space-y-4 sm:border-r sm:pr-4">
						<div className="space-y-1.5">
							<label className="text-xs font-medium text-muted-foreground">
								هامش الربح (%)
							</label>
							<Input
								type="number"
								value={profitMarginPct}
								onChange={(e: any) =>
									setProfitMarginPct(e.target.value)
								}
								className="h-9 rounded-lg"
								dir="ltr"
								placeholder="15"
							/>
						</div>

						<div className="space-y-1.5">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={vatEnabled}
									onChange={(e: any) =>
										setVatEnabled(e.target.checked)
									}
									className="rounded"
								/>
								<span className="text-sm">
									إضافة ضريبة القيمة المضافة (15%)
								</span>
							</label>
						</div>
					</div>
				</div>
			</div>

			{/* ═══ Action buttons ═══ */}
			<div className="flex flex-wrap gap-3 justify-end">
				<Button
					variant="outline"
					onClick={handleSaveItems}
					disabled={saveMutation.isPending || filledItems.length === 0}
					className="gap-2 rounded-xl"
				>
					{saveMutation.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Save className="h-4 w-4" />
					)}
					حفظ البنود
				</Button>

				<Button
					variant="outline"
					onClick={handleCreateQuotation}
					disabled={filledItems.length === 0}
					className="gap-2 rounded-xl"
				>
					<FileText className="h-4 w-4" />
					إنشاء عرض سعر
				</Button>

				<Button
					onClick={handleApprove}
					disabled={approveMutation.isPending}
					className="gap-2 rounded-xl"
				>
					{approveMutation.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Zap className="h-4 w-4" />
					)}
					اعتماد
				</Button>
			</div>
		</div>
	);
}
