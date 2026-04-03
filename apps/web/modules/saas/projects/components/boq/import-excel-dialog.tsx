"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { toast } from "sonner";
import {
	Upload,
	FileSpreadsheet,
	Loader2,
	ChevronLeft,
	ChevronRight,
	AlertTriangle,
	CheckCircle2,
} from "lucide-react";
import { useImportBOQData } from "@saas/projects/hooks/use-project-boq";

interface ImportExcelDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	projectId: string;
}

type MasarField =
	| "skip"
	| "code"
	| "description"
	| "unit"
	| "quantity"
	| "unitPrice"
	| "specifications"
	| "category"
	| "notes";

interface ColumnMapping {
	fileColumn: string;
	masarField: MasarField;
	sampleValues: string[];
}

interface ParsedItem {
	code?: string;
	description: string;
	unit: string;
	quantity: number;
	unitPrice?: number | null;
	specifications?: string;
	category?: string;
	notes?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ITEMS = 500;

// Auto-detect column mapping based on header names
function autoDetectField(header: string): MasarField {
	const h = header.toLowerCase().trim();

	// Code / Item number
	if (
		h.includes("item no") ||
		h.includes("رقم") ||
		h.includes("code") ||
		h.includes("كود") ||
		h.includes("رمز") ||
		h.includes("no.") ||
		h.includes("no ") ||
		h === "no"
	) {
		return "code";
	}

	// Description
	if (
		h.includes("description") ||
		h.includes("الوصف") ||
		h.includes("البند") ||
		h.includes("بند") ||
		h.includes("desc")
	) {
		return "description";
	}

	// Unit
	if (
		h.includes("unit") ||
		h.includes("الوحدة") ||
		h.includes("وحدة")
	) {
		return "unit";
	}

	// Quantity
	if (
		h.includes("qty") ||
		h.includes("quantity") ||
		h.includes("الكمية") ||
		h.includes("كمية")
	) {
		return "quantity";
	}

	// Unit Price
	if (
		h.includes("rate") ||
		h.includes("price") ||
		h.includes("السعر") ||
		h.includes("سعر الوحدة") ||
		h.includes("unit price") ||
		h.includes("سعر")
	) {
		return "unitPrice";
	}

	// Specifications
	if (
		h.includes("spec") ||
		h.includes("مواصفات")
	) {
		return "specifications";
	}

	// Category
	if (
		h.includes("category") ||
		h.includes("فئة") ||
		h.includes("تصنيف")
	) {
		return "category";
	}

	// Notes
	if (
		h.includes("note") ||
		h.includes("ملاحظ") ||
		h.includes("remark")
	) {
		return "notes";
	}

	return "skip";
}

export function ImportExcelDialog({
	open,
	onOpenChange,
	organizationId,
	projectId,
}: ImportExcelDialogProps) {
	const t = useTranslations("projectBoq");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [step, setStep] = useState<1 | 2 | 3>(1);
	const [fileName, setFileName] = useState("");
	const [rawData, setRawData] = useState<any[][]>([]);
	const [headers, setHeaders] = useState<string[]>([]);
	const [mappings, setMappings] = useState<ColumnMapping[]>([]);
	const [defaultSection, setDefaultSection] = useState("GENERAL");
	const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
	const [skippedCount, setSkippedCount] = useState(0);
	const [isProcessing, setIsProcessing] = useState(false);

	const importMutation = useImportBOQData();

	const resetState = () => {
		setStep(1);
		setFileName("");
		setRawData([]);
		setHeaders([]);
		setMappings([]);
		setDefaultSection("GENERAL");
		setParsedItems([]);
		setSkippedCount(0);
	};

	const handleFileSelect = useCallback(
		async (file: File) => {
			if (file.size > MAX_FILE_SIZE) {
				toast.error(t("importExcel.maxFileSize"));
				return;
			}

			setIsProcessing(true);
			setFileName(file.name);

			try {
				const XLSX = await import("xlsx");
				const arrayBuffer = await file.arrayBuffer();
				const workbook = XLSX.read(arrayBuffer, { type: "array" });
				const sheetName = workbook.SheetNames[0];
				const sheet = workbook.Sheets[sheetName];
				const data: any[][] = XLSX.utils.sheet_to_json(sheet, {
					header: 1,
					defval: "",
				});

				if (data.length < 2) {
					toast.error(t("importExcel.maxItems"));
					setIsProcessing(false);
					return;
				}

				const fileHeaders = (data[0] as string[]).map((h) =>
					String(h || "").trim(),
				);
				const rows = data.slice(1).filter((row) =>
					row.some((cell: any) => cell !== "" && cell != null),
				);

				setHeaders(fileHeaders);
				setRawData(rows);

				// Auto-detect mappings
				const autoMappings: ColumnMapping[] = fileHeaders.map(
					(header, idx) => ({
						fileColumn: header,
						masarField: autoDetectField(header),
						sampleValues: rows
							.slice(0, 3)
							.map((row) => String(row[idx] ?? ""))
							.filter(Boolean),
					}),
				);
				setMappings(autoMappings);
				setStep(2);
			} catch {
				toast.error(t("importExcel.readError"));
			}
			setIsProcessing(false);
		},
		[t],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			const file = e.dataTransfer.files[0];
			if (file) handleFileSelect(file);
		},
		[handleFileSelect],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
	}, []);

	const updateMapping = (index: number, field: MasarField) => {
		setMappings((prev) =>
			prev.map((m, i) => (i === index ? { ...m, masarField: field } : m)),
		);
	};

	const processData = () => {
		const fieldMap = new Map<MasarField, number>();
		mappings.forEach((m, idx) => {
			if (m.masarField !== "skip") {
				fieldMap.set(m.masarField, idx);
			}
		});

		// Validate required fields are mapped
		if (!fieldMap.has("description") || !fieldMap.has("unit") || !fieldMap.has("quantity")) {
			toast.error(t("importExcel.required"));
			return;
		}

		const items: ParsedItem[] = [];
		let skipped = 0;

		for (const row of rawData) {
			const getValue = (field: MasarField): string => {
				const idx = fieldMap.get(field);
				if (idx === undefined) return "";
				return String(row[idx] ?? "").trim();
			};

			const description = getValue("description");
			const unit = getValue("unit");
			const quantityStr = getValue("quantity");

			// Skip rows with missing required fields
			if (!description || !unit || !quantityStr) {
				skipped++;
				continue;
			}

			const quantity = Number(quantityStr);
			if (Number.isNaN(quantity) || quantity < 0) {
				skipped++;
				continue;
			}

			const unitPriceStr = getValue("unitPrice");
			const unitPrice = unitPriceStr
				? Number(unitPriceStr)
				: null;

			const item: ParsedItem = {
				description,
				unit,
				quantity,
				unitPrice:
					unitPrice !== null && !Number.isNaN(unitPrice) && unitPrice >= 0
						? unitPrice
						: null,
			};

			const code = getValue("code");
			if (code) item.code = code;

			const specifications = getValue("specifications");
			if (specifications) item.specifications = specifications;

			const category = getValue("category");
			if (category) item.category = category;

			const notes = getValue("notes");
			if (notes) item.notes = notes;

			items.push(item);
		}

		// Limit items
		const limitedItems = items.slice(0, MAX_ITEMS);

		setParsedItems(limitedItems);
		setSkippedCount(skipped);
		setStep(3);
	};

	const handleImport = async () => {
		if (parsedItems.length === 0) return;

		try {
			const result = await importMutation.mutateAsync({
				organizationId,
				projectId,
				defaultSection: defaultSection as any,
				defaultSourceType: "IMPORTED" as any,
				items: parsedItems.map((item) => ({
					description: item.description,
					unit: item.unit,
					quantity: item.quantity,
					unitPrice: item.unitPrice ?? undefined,
					code: item.code,
					specifications: item.specifications,
					category: item.category,
					notes: item.notes,
					section: defaultSection as any,
				})),
			});
			toast.success(
				t("importExcel.importItems", { count: result.importedCount }),
			);
			onOpenChange(false);
			resetState();
		} catch {
			// Error handled by mutation
		}
	};

	const pricedCount = parsedItems.filter((i) => i.unitPrice != null).length;
	const unpricedCount = parsedItems.length - pricedCount;

	// Has required fields mapped
	const hasRequiredMapped =
		mappings.some((m) => m.masarField === "description") &&
		mappings.some((m) => m.masarField === "unit") &&
		mappings.some((m) => m.masarField === "quantity");

	return (
		<Dialog
			open={open}
			onOpenChange={(o: any) => {
				if (!o) resetState();
				onOpenChange(o);
			}}
		>
			<DialogContent className="sm:max-w-3xl p-0 gap-0 rounded-2xl overflow-hidden">
				<DialogHeader className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
					<DialogTitle className="text-base font-semibold">
						{t("importExcel.title")}
					</DialogTitle>
				</DialogHeader>

				{/* Steps indicator */}
				<div className="px-5 pt-4 pb-2">
					<div className="flex items-center gap-2 text-xs text-slate-500">
						<span
							className={`px-2.5 py-1 rounded-lg font-medium ${
								step === 1
									? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
									: "bg-slate-100 dark:bg-slate-800"
							}`}
						>
							1. {t("importExcel.step1")}
						</span>
						<ChevronRight className="h-3 w-3 rtl:rotate-180" />
						<span
							className={`px-2.5 py-1 rounded-lg font-medium ${
								step === 2
									? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
									: "bg-slate-100 dark:bg-slate-800"
							}`}
						>
							2. {t("importExcel.step2")}
						</span>
						<ChevronRight className="h-3 w-3 rtl:rotate-180" />
						<span
							className={`px-2.5 py-1 rounded-lg font-medium ${
								step === 3
									? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
									: "bg-slate-100 dark:bg-slate-800"
							}`}
						>
							3. {t("importExcel.step3")}
						</span>
					</div>
				</div>

				<div className="p-5 min-h-[300px]">
					{/* Step 1: Upload */}
					{step === 1 && (
						<div className="space-y-4">
							<div
								onDrop={handleDrop}
								onDragOver={handleDragOver}
								onClick={() => fileInputRef.current?.click()}
								className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
							>
								{isProcessing ? (
									<Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-3" />
								) : (
									<Upload className="h-10 w-10 text-slate-400 mb-3" />
								)}
								<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
									{t("importExcel.dropzone")}
								</p>
								<p className="text-xs text-slate-400 mt-1">
									{t("importExcel.supportedFormats")}
								</p>
								<p className="text-xs text-slate-400 mt-0.5">
									{t("importExcel.maxFileSize")}
								</p>
							</div>

							<input
								ref={fileInputRef}
								type="file"
								accept=".xlsx,.xls,.csv"
								className="hidden"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) handleFileSelect(file);
									e.target.value = "";
								}}
							/>
						</div>
					)}

					{/* Step 2: Column Mapping */}
					{step === 2 && (
						<div className="space-y-4">
							<div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
								<FileSpreadsheet className="h-4 w-4" />
								<span>{fileName}</span>
								<span className="text-slate-400">
									— {t("importExcel.rowCount", { count: rawData.length })}
								</span>
							</div>

							{/* Default section */}
							<div className="flex items-center gap-3">
								<span className="text-sm text-slate-600 dark:text-slate-400 shrink-0">
									{t("bulkEntry.defaultSection")}:
								</span>
								<Select
									value={defaultSection}
									onValueChange={setDefaultSection}
								>
									<SelectTrigger className="rounded-xl h-9 w-40">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="GENERAL">
											{t("section.GENERAL")}
										</SelectItem>
										<SelectItem value="STRUCTURAL">
											{t("section.STRUCTURAL")}
										</SelectItem>
										<SelectItem value="FINISHING">
											{t("section.FINISHING")}
										</SelectItem>
										<SelectItem value="MEP">
											{t("section.MEP")}
										</SelectItem>
										<SelectItem value="LABOR">
											{t("section.LABOR")}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Mapping table */}
							<div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
								<table className="w-full text-sm">
									<thead>
										<tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
											<th className="text-start px-3 py-2 font-medium text-slate-600 dark:text-slate-400">
												{t("importExcel.fileColumn")}
											</th>
											<th className="text-start px-3 py-2 font-medium text-slate-600 dark:text-slate-400">
												{t("importExcel.masarField")}
											</th>
											<th className="text-start px-3 py-2 font-medium text-slate-600 dark:text-slate-400">
												{t("importExcel.example")}
											</th>
										</tr>
									</thead>
									<tbody>
										{mappings.map((mapping, idx) => (
											<tr
												key={idx}
												className="border-b border-slate-100 dark:border-slate-800 last:border-0"
											>
												<td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
													{mapping.fileColumn || `Column ${idx + 1}`}
												</td>
												<td className="px-3 py-2">
													<Select
														value={mapping.masarField}
														onValueChange={(v: any) =>
															updateMapping(
																idx,
																v as MasarField,
															)
														}
													>
														<SelectTrigger className="rounded-lg h-8 text-xs w-36">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="skip">
																{t("importExcel.skip")}
															</SelectItem>
															<SelectItem value="code">
																{t("table.code")}
															</SelectItem>
															<SelectItem value="description">
																{t("table.description")} *
															</SelectItem>
															<SelectItem value="unit">
																{t("table.unit")} *
															</SelectItem>
															<SelectItem value="quantity">
																{t("table.quantity")} *
															</SelectItem>
															<SelectItem value="unitPrice">
																{t("table.unitPrice")}
															</SelectItem>
															<SelectItem value="specifications">
																{t("createDialog.specifications")}
															</SelectItem>
															<SelectItem value="category">
																{t("createDialog.category")}
															</SelectItem>
															<SelectItem value="notes">
																{t("createDialog.notes")}
															</SelectItem>
														</SelectContent>
													</Select>
												</td>
												<td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
													{mapping.sampleValues.join(", ")}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{!hasRequiredMapped && (
								<div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-3 rounded-xl">
									<AlertTriangle className="h-4 w-4 shrink-0" />
									<span>
										{t("importExcel.required")}: {t("table.description")},{" "}
										{t("table.unit")}, {t("table.quantity")}
									</span>
								</div>
							)}
						</div>
					)}

					{/* Step 3: Preview */}
					{step === 3 && (
						<div className="space-y-4">
							{/* Summary badges */}
							<div className="flex flex-wrap gap-2">
								<Badge
									variant="secondary"
									className="rounded-lg px-3 py-1 text-xs"
								>
									<CheckCircle2 className="h-3.5 w-3.5 me-1 text-emerald-500" />
									{t("importExcel.foundItems", {
										count: parsedItems.length,
									})}
								</Badge>
								{pricedCount > 0 && (
									<Badge
										variant="secondary"
										className="rounded-lg px-3 py-1 text-xs"
									>
										{t("importExcel.pricedCount", {
											count: pricedCount,
										})}
									</Badge>
								)}
								{unpricedCount > 0 && (
									<Badge
										variant="secondary"
										className="rounded-lg px-3 py-1 text-xs"
									>
										{t("importExcel.unpricedCount", {
											count: unpricedCount,
										})}
									</Badge>
								)}
								{skippedCount > 0 && (
									<Badge
										variant="outline"
										className="rounded-lg px-3 py-1 text-xs text-amber-600 border-amber-300"
									>
										<AlertTriangle className="h-3.5 w-3.5 me-1" />
										{t("importExcel.skippedRows", {
											count: skippedCount,
										})}
									</Badge>
								)}
							</div>

							{/* Preview table — first 10 rows */}
							<div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
											<th className="text-start px-3 py-2 font-medium text-slate-600 dark:text-slate-400 text-xs">
												#
											</th>
											<th className="text-start px-3 py-2 font-medium text-slate-600 dark:text-slate-400 text-xs">
												{t("table.code")}
											</th>
											<th className="text-start px-3 py-2 font-medium text-slate-600 dark:text-slate-400 text-xs">
												{t("table.description")}
											</th>
											<th className="text-start px-3 py-2 font-medium text-slate-600 dark:text-slate-400 text-xs">
												{t("table.unit")}
											</th>
											<th className="text-start px-3 py-2 font-medium text-slate-600 dark:text-slate-400 text-xs">
												{t("table.quantity")}
											</th>
											<th className="text-start px-3 py-2 font-medium text-slate-600 dark:text-slate-400 text-xs">
												{t("table.unitPrice")}
											</th>
										</tr>
									</thead>
									<tbody>
										{parsedItems.slice(0, 10).map((item, idx) => (
											<tr
												key={idx}
												className="border-b border-slate-100 dark:border-slate-800 last:border-0"
											>
												<td className="px-3 py-2 text-xs text-slate-400">
													{idx + 1}
												</td>
												<td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
													{item.code || "—"}
												</td>
												<td className="px-3 py-2 text-xs text-slate-900 dark:text-slate-100 max-w-[200px] truncate">
													{item.description}
												</td>
												<td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
													{item.unit}
												</td>
												<td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
													{item.quantity.toLocaleString("en-US")}
												</td>
												<td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
													{item.unitPrice != null
														? item.unitPrice.toLocaleString(
																"en-US",
																{
																	minimumFractionDigits: 2,
																	maximumFractionDigits: 2,
																},
															)
														: t("table.noPrice")}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{parsedItems.length > 10 && (
								<p className="text-xs text-slate-400 text-center">
									{t("importExcel.moreItems", { count: parsedItems.length - 10 })}
								</p>
							)}

							<p className="text-xs text-slate-400">
								{t("importExcel.maxItems")}
							</p>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex gap-3 justify-between">
					<div>
						{step > 1 && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="rounded-xl"
								onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
							>
								<ChevronLeft className="h-4 w-4 me-1 rtl:rotate-180" />
								{step === 2
									? t("importExcel.step1")
									: t("importExcel.step2")}
							</Button>
						)}
					</div>

					<div className="flex gap-3">
						<Button
							type="button"
							variant="outline"
							className="rounded-xl"
							onClick={() => {
								onOpenChange(false);
								resetState();
							}}
						>
							{t("actions.cancel")}
						</Button>

						{step === 2 && (
							<Button
								type="button"
								className="rounded-xl"
								disabled={!hasRequiredMapped}
								onClick={processData}
							>
								{t("importExcel.preview")}
								<ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
							</Button>
						)}

						{step === 3 && (
							<Button
								type="button"
								className="rounded-xl"
								disabled={
									importMutation.isPending ||
									parsedItems.length === 0
								}
								onClick={handleImport}
							>
								{importMutation.isPending && (
									<Loader2 className="h-4 w-4 me-2 animate-spin" />
								)}
								{t("importExcel.importItems", {
									count: parsedItems.length,
								})}
							</Button>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
