"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import { cn } from "@ui/lib";
import {
	ClipboardPaste,
	FileDown,
	Loader2,
	PenLine,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ImportItemsDialogProps {
	organizationId: string;
	studyId: string;
	onImported?: () => void;
}

interface ParsedItem {
	description: string;
	unit: string;
	quantity: string;
	section: string;
}

type ImportMode = "paste" | "manual";
type Step = 1 | 2 | 3;

const UNIT_OPTIONS = [
	{ value: "م²", label: "م²" },
	{ value: "م³", label: "م³" },
	{ value: "م.ط", label: "م.ط" },
	{ value: "كجم", label: "كجم" },
	{ value: "عدد", label: "عدد" },
	{ value: "طن", label: "طن" },
	{ value: "مقطوعية", label: "مقطوعية" },
];

const EMPTY_ROW: ParsedItem = {
	description: "",
	unit: "م²",
	quantity: "",
	section: "",
};

function formatNumber(value: number): string {
	return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function ImportItemsDialog({
	organizationId,
	studyId,
	onImported,
}: ImportItemsDialogProps) {
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<Step>(1);
	const [mode, setMode] = useState<ImportMode>("paste");
	const [pastedText, setPastedText] = useState("");
	const [items, setItems] = useState<ParsedItem[]>([{ ...EMPTY_ROW }]);
	const [isImporting, setIsImporting] = useState(false);

	const importMutation = useMutation(
		orpc.pricing.studies.manualItem.create.mutationOptions({
			onError: (e: any) =>
				toast.error(e.message || "حدث خطأ أثناء الاستيراد"),
		}),
	);

	// Parse pasted text into items
	const parsePastedText = (text: string): ParsedItem[] => {
		const lines = text
			.split("\n")
			.map((l) => l.trim())
			.filter((l) => l.length > 0);

		return lines.map((line) => {
			const cols = line.split("\t");
			return {
				description: (cols[0] ?? "").trim(),
				unit: (cols[1] ?? "م²").trim() || "م²",
				quantity: (cols[2] ?? "").trim(),
				section: (cols[3] ?? "").trim(),
			};
		});
	};

	// Get the final items list based on mode
	const getFinalItems = (): ParsedItem[] => {
		if (mode === "paste") {
			return parsePastedText(pastedText).filter(
				(item) => item.description.trim().length > 0,
			);
		}
		return items.filter((item) => item.description.trim().length > 0);
	};

	// Manual mode: update a row
	const updateRow = (
		index: number,
		field: keyof ParsedItem,
		value: string,
	) => {
		setItems((prev) => {
			const updated = prev.map((row, i) =>
				i === index ? { ...row, [field]: value } : row,
			);
			// Auto-add new row when last row gets data
			const lastRow = updated[updated.length - 1];
			if (
				lastRow &&
				(lastRow.description.trim() || lastRow.quantity.trim())
			) {
				updated.push({ ...EMPTY_ROW });
			}
			return updated;
		});
	};

	// Manual mode: remove a row
	const removeRow = (index: number) => {
		setItems((prev) => {
			if (prev.length <= 1) return prev;
			return prev.filter((_, i) => i !== index);
		});
	};

	// Reset state
	const handleReset = () => {
		setStep(1);
		setMode("paste");
		setPastedText("");
		setItems([{ ...EMPTY_ROW }]);
		setIsImporting(false);
	};

	// Handle import
	const handleImport = async () => {
		const finalItems = getFinalItems();
		if (finalItems.length === 0) return;

		setIsImporting(true);

		try {
			for (const item of finalItems) {
				await (importMutation as any).mutateAsync({
					organizationId,
					studyId,
					description: item.description,
					unit: item.unit,
					quantity: Number(item.quantity) || 0,
					section: item.section || "أخرى",
				});
			}

			toast.success(
				`تم استيراد ${finalItems.length} بند بنجاح`,
			);
			onImported?.();
			setOpen(false);
			handleReset();
		} catch {
			toast.error("حدث خطأ أثناء الاستيراد");
		} finally {
			setIsImporting(false);
		}
	};

	const finalItems = getFinalItems();

	const stepLabels = ["اختيار الطريقة", "إدخال البيانات", "مراجعة واستيراد"];

	return (
		<Dialog
			open={open}
			onOpenChange={(v: any) => {
				setOpen(v);
				if (!v) handleReset();
			}}
		>
			<DialogTrigger asChild>
				<Button variant="outline" className="gap-2">
					<FileDown className="h-4 w-4" />
					استيراد بنود
				</Button>
			</DialogTrigger>

			<DialogContent className="max-w-2xl" dir="rtl">
				<DialogHeader>
					<DialogTitle>استيراد بنود</DialogTitle>
				</DialogHeader>

				{/* Step indicator */}
				<div className="flex items-center justify-center gap-0 py-2">
					{stepLabels.map((label, index) => {
						const stepNum = (index + 1) as Step;
						const isActive = step === stepNum;
						const isCompleted = step > stepNum;
						return (
							<div
								key={stepNum}
								className="flex items-center gap-0"
							>
								<div className="flex flex-col items-center gap-1">
									<div
										className={cn(
											"flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
											isActive
												? "bg-primary text-primary-foreground"
												: isCompleted
													? "bg-primary/20 text-primary"
													: "bg-muted text-muted-foreground",
										)}
									>
										{stepNum}
									</div>
									<span
										className={cn(
											"text-xs",
											isActive
												? "font-medium text-foreground"
												: "text-muted-foreground",
										)}
									>
										{label}
									</span>
								</div>
								{index < stepLabels.length - 1 && (
									<div
										className={cn(
											"mx-3 mt-[-1rem] h-0.5 w-12",
											isCompleted
												? "bg-primary"
												: "bg-border",
										)}
									/>
								)}
							</div>
						);
					})}
				</div>

				{/* Step 1: Format Selection */}
				{step === 1 && (
					<div className="grid grid-cols-2 gap-4 py-4">
						<button
							type="button"
							onClick={() => setMode("paste")}
							className={cn(
								"flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:border-primary/50",
								mode === "paste"
									? "border-primary bg-primary/5"
									: "border-border",
							)}
						>
							<ClipboardPaste className="h-10 w-10 text-primary" />
							<div className="text-center">
								<p className="font-semibold">لصق من Excel</p>
								<p className="text-xs text-muted-foreground mt-1">
									انسخ البنود من جدول Excel والصقها هنا
									مباشرة
								</p>
							</div>
						</button>

						<button
							type="button"
							onClick={() => setMode("manual")}
							className={cn(
								"flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:border-primary/50",
								mode === "manual"
									? "border-primary bg-primary/5"
									: "border-border",
							)}
						>
							<PenLine className="h-10 w-10 text-primary" />
							<div className="text-center">
								<p className="font-semibold">إدخال يدوي</p>
								<p className="text-xs text-muted-foreground mt-1">
									أدخل البنود واحدًا تلو الآخر
								</p>
							</div>
						</button>
					</div>
				)}

				{/* Step 2: Data Entry */}
				{step === 2 && mode === "paste" && (
					<div className="space-y-3 py-2">
						<Label>الصق البيانات من Excel</Label>
						<textarea
							value={pastedText}
							onChange={(e: any) => setPastedText(e.target.value)}
							placeholder="الصق البيانات هنا..."
							className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							dir="rtl"
						/>
						<p className="text-xs text-muted-foreground">
							الأعمدة المتوقعة: الوصف، الوحدة، الكمية، القسم
							(اختياري)
						</p>
					</div>
				)}

				{step === 2 && mode === "manual" && (
					<div className="space-y-3 py-2">
						<div className="overflow-x-auto rounded-lg border">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="px-2 py-2 text-right font-medium">
											الوصف
										</th>
										<th className="px-2 py-2 text-right font-medium w-28">
											الوحدة
										</th>
										<th className="px-2 py-2 text-right font-medium w-24">
											الكمية
										</th>
										<th className="px-2 py-2 text-right font-medium w-28">
											القسم
										</th>
										<th className="px-2 py-2 w-10" />
									</tr>
								</thead>
								<tbody>
									{items.map((row, idx) => (
										<tr key={idx} className="border-b">
											<td className="px-2 py-1.5">
												<Input
													value={row.description}
													onChange={(e: any) =>
														updateRow(
															idx,
															"description",
															e.target.value,
														)
													}
													placeholder="وصف البند"
													className="h-8"
												/>
											</td>
											<td className="px-2 py-1.5">
												<Select
													value={row.unit}
													onValueChange={(v: any) =>
														updateRow(
															idx,
															"unit",
															v,
														)
													}
												>
													<SelectTrigger className="h-8">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{UNIT_OPTIONS.map(
															(u) => (
																<SelectItem
																	key={
																		u.value
																	}
																	value={
																		u.value
																	}
																>
																	{u.label}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											</td>
											<td className="px-2 py-1.5">
												<Input
													type="number"
													value={row.quantity}
													onChange={(e: any) =>
														updateRow(
															idx,
															"quantity",
															e.target.value,
														)
													}
													placeholder="0"
													className="h-8"
													dir="ltr"
												/>
											</td>
											<td className="px-2 py-1.5">
												<Input
													value={row.section}
													onChange={(e: any) =>
														updateRow(
															idx,
															"section",
															e.target.value,
														)
													}
													placeholder="اختياري"
													className="h-8"
												/>
											</td>
											<td className="px-2 py-1.5">
												<Button
													size="icon"
													variant="ghost"
													className="h-7 w-7 text-destructive hover:text-destructive"
													onClick={() =>
														removeRow(idx)
													}
													disabled={
														items.length <= 1
													}
												>
													<Trash2 className="h-3.5 w-3.5" />
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* Step 3: Preview & Import */}
				{step === 3 && (
					<div className="space-y-3 py-2">
						<div className="flex items-center gap-2">
							<Badge variant="secondary">
								{finalItems.length} بند
							</Badge>
						</div>

						<div className="max-h-[300px] overflow-y-auto rounded-lg border">
							<table className="w-full text-sm">
								<thead className="sticky top-0 bg-background">
									<tr className="border-b bg-muted/50">
										<th className="px-2 py-2 text-right font-medium w-10">
											#
										</th>
										<th className="px-2 py-2 text-right font-medium">
											الوصف
										</th>
										<th className="px-2 py-2 text-right font-medium w-20">
											الوحدة
										</th>
										<th className="px-2 py-2 text-right font-medium w-24">
											الكمية
										</th>
										<th className="px-2 py-2 text-right font-medium w-28">
											القسم
										</th>
									</tr>
								</thead>
								<tbody>
									{finalItems.map((item, idx) => (
										<tr
											key={idx}
											className="border-b"
										>
											<td className="px-2 py-2 text-muted-foreground">
												{idx + 1}
											</td>
											<td className="px-2 py-2">
												{item.description}
											</td>
											<td className="px-2 py-2 text-muted-foreground">
												{item.unit}
											</td>
											<td className="px-2 py-2 tabular-nums" dir="ltr">
												{formatNumber(
													Number(item.quantity) || 0,
												)}
											</td>
											<td className="px-2 py-2 text-muted-foreground">
												{item.section || "أخرى"}
											</td>
										</tr>
									))}
									{finalItems.length === 0 && (
										<tr>
											<td
												colSpan={5}
												className="py-8 text-center text-muted-foreground"
											>
												لا توجد بنود للاستيراد
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* Footer: Back / Next / Import */}
				<DialogFooter className="gap-2 sm:gap-2">
					{step > 1 && !isImporting && (
						<Button
							variant="outline"
							onClick={() => setStep((s) => (s - 1) as Step)}
						>
							السابق
						</Button>
					)}

					<div className="flex-1" />

					{step < 3 && (
						<Button
							onClick={() => setStep((s) => (s + 1) as Step)}
							disabled={
								step === 2 &&
								((mode === "paste" &&
									pastedText.trim().length === 0) ||
									(mode === "manual" &&
										items.every(
											(r) =>
												!r.description.trim() &&
												!r.quantity.trim(),
										)))
							}
						>
							التالي
						</Button>
					)}

					{step === 3 && (
						<Button
							onClick={handleImport}
							disabled={
								finalItems.length === 0 || isImporting
							}
							className="gap-2"
						>
							{isImporting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									جاري الاستيراد...
								</>
							) : (
								"استيراد"
							)}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
