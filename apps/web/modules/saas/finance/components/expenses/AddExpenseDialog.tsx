"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Switch } from "@ui/components/switch";
import { toast } from "sonner";
import {
	Save,
	Building,
	Wallet,
	Loader2,
	ArrowRight,
	Upload,
	X,
	FileText,
	ImageIcon,
	Clock,
	FolderOpen,
} from "lucide-react";
import { Currency } from "../shared/Currency";

interface AddExpenseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	organizationSlug: string;
}

const EXPENSE_CATEGORIES = [
	"MATERIALS",
	"LABOR",
	"EQUIPMENT_RENTAL",
	"EQUIPMENT_PURCHASE",
	"SUBCONTRACTOR",
	"TRANSPORT",
	"SALARIES",
	"RENT",
	"UTILITIES",
	"COMMUNICATIONS",
	"INSURANCE",
	"LICENSES",
	"BANK_FEES",
	"FUEL",
	"MAINTENANCE",
	"SUPPLIES",
	"MARKETING",
	"TRAINING",
	"TRAVEL",
	"HOSPITALITY",
	"LOAN_PAYMENT",
	"TAXES",
	"ZAKAT",
	"REFUND",
	"MISC",
	"CUSTOM",
] as const;

const PAYMENT_METHODS = [
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
] as const;

const ACCEPTED_FILE_TYPES = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function AddExpenseDialog({
	open,
	onOpenChange,
	organizationId,
	organizationSlug,
}: AddExpenseDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [isObligation, setIsObligation] = useState(false);
	const [formData, setFormData] = useState({
		category: "MISC" as (typeof EXPENSE_CATEGORIES)[number],
		customCategory: "",
		description: "",
		amount: "",
		date: new Date().toISOString().split("T")[0],
		dueDate: "",
		sourceAccountId: "",
		vendorName: "",
		vendorTaxNumber: "",
		invoiceRef: "",
		paymentMethod: "BANK_TRANSFER" as (typeof PAYMENT_METHODS)[number],
		referenceNo: "",
		notes: "",
		projectId: "",
	});

	const [attachedFile, setAttachedFile] = useState<File | null>(null);
	const [filePreview, setFilePreview] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	// Fetch bank accounts
	const { data: accountsData } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
	);

	// Fetch projects
	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId },
		}),
	);

	const accounts = accountsData?.accounts ?? [];
	const projects = projectsData?.projects ?? [];
	const selectedAccount = accounts.find(
		(a) => a.id === formData.sourceAccountId,
	);
	const numericAmount = Number.parseFloat(formData.amount) || 0;

	// Upload mutations
	const getUploadUrlMutation = useMutation({
		...orpc.attachments.createUploadUrl.mutationOptions(),
	});

	const finalizeUploadMutation = useMutation({
		...orpc.attachments.finalizeUpload.mutationOptions(),
	});

	// Upload file after expense creation
	const uploadInvoiceFile = async (expenseId: string, file: File) => {
		const { uploadUrl, uploadId, storagePath } =
			await getUploadUrlMutation.mutateAsync({
				organizationId,
				projectId: formData.projectId || undefined,
				ownerType: "EXPENSE",
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
			});

		const uploadResponse = await fetch(uploadUrl, {
			method: "PUT",
			body: file,
			headers: { "Content-Type": file.type },
		});

		if (!uploadResponse.ok) {
			throw new Error("فشل رفع الملف");
		}

		await finalizeUploadMutation.mutateAsync({
			organizationId,
			projectId: formData.projectId || undefined,
			uploadId,
			ownerType: "EXPENSE",
			ownerId: expenseId,
			fileName: file.name,
			fileSize: file.size,
			mimeType: file.type,
			storagePath,
		});
	};

	// Create mutation
	const createMutation = useMutation({
		mutationFn: async () => {
			if (!isObligation && !formData.sourceAccountId) {
				throw new Error(t("finance.expenses.errors.accountRequired"));
			}
			if (!formData.amount || parseFloat(formData.amount) <= 0) {
				throw new Error(t("finance.expenses.errors.amountRequired"));
			}

			const expense = await orpcClient.finance.expenses.create({
				organizationId,
				category: formData.category,
				customCategory:
					formData.category === "CUSTOM"
						? formData.customCategory
						: undefined,
				description: formData.description || undefined,
				amount: parseFloat(formData.amount),
				date: new Date(formData.date),
				sourceAccountId: isObligation ? undefined : formData.sourceAccountId,
				vendorName: formData.vendorName || undefined,
				vendorTaxNumber: formData.vendorTaxNumber || undefined,
				projectId: formData.projectId || undefined,
				invoiceRef: formData.invoiceRef || undefined,
				paymentMethod: formData.paymentMethod,
				referenceNo: formData.referenceNo || undefined,
				status: isObligation ? "PENDING" : undefined,
				dueDate:
					isObligation && formData.dueDate
						? new Date(formData.dueDate)
						: undefined,
				notes: formData.notes || undefined,
			});

			// Upload attached invoice file if present
			if (attachedFile && expense?.id) {
				await uploadInvoiceFile(expense.id, attachedFile);
			}

			return expense;
		},
		onSuccess: () => {
			toast.success(t("finance.expenses.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "expenses"] });
			queryClient.invalidateQueries({ queryKey: ["finance", "banks"] });
			queryClient.invalidateQueries({ queryKey: ["projectFinance"] });
			resetForm();
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.expenses.createError"));
		},
	});

	const resetForm = () => {
		setFormData({
			category: "MISC",
			customCategory: "",
			description: "",
			amount: "",
			date: new Date().toISOString().split("T")[0],
			dueDate: "",
			sourceAccountId: "",
			vendorName: "",
			vendorTaxNumber: "",
			invoiceRef: "",
			paymentMethod: "BANK_TRANSFER",
			referenceNo: "",
			notes: "",
			projectId: "",
		});
		setIsObligation(false);
		removeFile();
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate();
	};

	const getCategoryLabel = (category: string) => {
		return t(`finance.expenses.categories.${category.toLowerCase()}`);
	};

	const getPaymentMethodLabel = (method: string) => {
		return t(`finance.payments.methods.${method.toLowerCase()}`);
	};

	// File handling
	const handleFileSelect = useCallback((file: File) => {
		if (file.size > MAX_FILE_SIZE) {
			toast.error("حجم الملف يتجاوز الحد المسموح (10 ميجابايت)");
			return;
		}

		const allowedTypes = ACCEPTED_FILE_TYPES.split(",");
		if (!allowedTypes.includes(file.type)) {
			toast.error("نوع الملف غير مسموح. يُقبل: صور أو PDF");
			return;
		}

		setAttachedFile(file);

		if (file.type.startsWith("image/")) {
			const url = URL.createObjectURL(file);
			setFilePreview(url);
		} else {
			setFilePreview(null);
		}
	}, []);

	const removeFile = useCallback(() => {
		if (filePreview) URL.revokeObjectURL(filePreview);
		setAttachedFile(null);
		setFilePreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}, [filePreview]);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const file = e.dataTransfer.files[0];
			if (file) handleFileSelect(file);
		},
		[handleFileSelect],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(val) => {
				if (!val) resetForm();
				onOpenChange(val);
			}}
		>
			<DialogContent className="sm:max-w-4xl p-0 gap-0 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
				{/* Header */}
				<DialogHeader className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-5 py-4 shrink-0">
					<DialogTitle className="text-base font-semibold">
						{t("finance.expenses.new")}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
					<div className="p-5 space-y-4 overflow-y-auto flex-1">
						{/* Row 1: Amount, Date, Category */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.expenses.amount")} *
								</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={formData.amount}
									onChange={(e) =>
										setFormData({ ...formData, amount: e.target.value })
									}
									placeholder="0.00"
									className="rounded-xl text-base font-semibold h-10"
									dir="ltr"
									required
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.expenses.date")} *
								</Label>
								<Input
									type="date"
									value={formData.date}
									onChange={(e) =>
										setFormData({ ...formData, date: e.target.value })
									}
									className="rounded-xl h-10"
									required
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.expenses.category")} *
								</Label>
								<Select
									value={formData.category}
									onValueChange={(value) =>
										setFormData({ ...formData, category: value as any })
									}
								>
									<SelectTrigger className="rounded-xl h-10">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="rounded-xl max-h-[250px]">
										{EXPENSE_CATEGORIES.map((cat) => (
											<SelectItem key={cat} value={cat}>
												{getCategoryLabel(cat)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{formData.category === "CUSTOM" && (
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.expenses.customCategory")} *
								</Label>
								<Input
									value={formData.customCategory}
									onChange={(e) =>
										setFormData({ ...formData, customCategory: e.target.value })
									}
									placeholder={t("finance.expenses.customCategoryPlaceholder")}
									className="rounded-xl h-10"
									required
								/>
							</div>
						)}

						{/* Description */}
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
								{t("finance.expenses.description")}
							</Label>
							<Input
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								placeholder={t("finance.expenses.descriptionPlaceholder")}
								className="rounded-xl h-10"
							/>
						</div>

						{/* Obligation Toggle */}
						<div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
							<div className="flex items-center gap-2.5">
								<div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
									<Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
								</div>
								<div>
									<p className="text-sm font-medium">{t("finance.expenses.recordObligation")}</p>
									<p className="text-[11px] text-slate-500">{t("finance.expenses.recordObligationHint")}</p>
								</div>
							</div>
							<Switch
								checked={isObligation}
								onCheckedChange={setIsObligation}
							/>
						</div>

						{/* Due Date (only for obligations) */}
						{isObligation && (
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.expenses.dueDate")}
								</Label>
								<Input
									type="date"
									value={formData.dueDate}
									onChange={(e) =>
										setFormData({ ...formData, dueDate: e.target.value })
									}
									className="rounded-xl h-10 max-w-xs"
								/>
							</div>
						)}

						{/* Account, Payment Method, Reference */}
						<div className={`grid grid-cols-3 gap-3 ${isObligation ? "opacity-60" : ""}`}>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.expenses.selectAccount")} {!isObligation && "*"}
								</Label>
								<Select
									value={formData.sourceAccountId}
									onValueChange={(value) =>
										setFormData({ ...formData, sourceAccountId: value })
									}
									disabled={isObligation}
								>
									<SelectTrigger className="rounded-xl h-10">
										<SelectValue
											placeholder={t("finance.expenses.selectAccountPlaceholder")}
										/>
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										{accounts.map((account) => (
											<SelectItem key={account.id} value={account.id}>
												<div className="flex items-center gap-2">
													{account.accountType === "BANK" ? (
														<Building className="h-3.5 w-3.5 text-blue-500" />
													) : (
														<Wallet className="h-3.5 w-3.5 text-green-500" />
													)}
													<span>{account.name}</span>
													<span className="text-slate-400 text-xs">
														(<Currency amount={Number(account.balance)} />)
													</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.expenses.paymentMethod")}
								</Label>
								<Select
									value={formData.paymentMethod}
									onValueChange={(value) =>
										setFormData({ ...formData, paymentMethod: value as any })
									}
									disabled={isObligation}
								>
									<SelectTrigger className="rounded-xl h-10">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										{PAYMENT_METHODS.map((method) => (
											<SelectItem key={method} value={method}>
												{getPaymentMethodLabel(method)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.expenses.referenceNo")}
								</Label>
								<Input
									value={formData.referenceNo}
									onChange={(e) =>
										setFormData({ ...formData, referenceNo: e.target.value })
									}
									placeholder={t("finance.expenses.referenceNoPlaceholder")}
									className="rounded-xl h-10"
									dir="ltr"
									disabled={isObligation}
								/>
							</div>
						</div>

						{/* Selected account info (compact) */}
						{selectedAccount && !isObligation && (
							<div className="rounded-xl border border-blue-200/60 bg-blue-50/40 dark:border-blue-800/30 dark:bg-blue-950/20 px-4 py-2.5 flex items-center justify-between">
								<div className="flex items-center gap-2.5">
									<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
										{selectedAccount.accountType === "BANK" ? (
											<Building className="h-3.5 w-3.5 text-blue-600" />
										) : (
											<Wallet className="h-3.5 w-3.5 text-green-600" />
										)}
									</div>
									<div>
										<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
											{selectedAccount.name}
										</p>
										{selectedAccount.bankName && (
											<p className="text-[11px] text-slate-500">
												{selectedAccount.bankName}
											</p>
										)}
									</div>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<span className="font-semibold">
										<Currency amount={Number(selectedAccount.balance)} />
									</span>
									{numericAmount > 0 && (
										<>
											<ArrowRight className="h-3.5 w-3.5 text-slate-400" />
											<span className="text-red-500 font-semibold">
												<Currency
													amount={Number(selectedAccount.balance) - numericAmount}
												/>
											</span>
										</>
									)}
								</div>
							</div>
						)}

						{/* Vendor Name, Tax Number, Invoice Ref */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.expenses.vendorName")}
								</Label>
								<Input
									value={formData.vendorName}
									onChange={(e) =>
										setFormData({ ...formData, vendorName: e.target.value })
									}
									placeholder={t("finance.expenses.vendorNamePlaceholder")}
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.expenses.vendorTaxNumber")}
								</Label>
								<Input
									value={formData.vendorTaxNumber}
									onChange={(e) =>
										setFormData({ ...formData, vendorTaxNumber: e.target.value })
									}
									placeholder={t("finance.expenses.vendorTaxNumberPlaceholder")}
									className="rounded-xl h-10"
									dir="ltr"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.expenses.invoiceRef")}
								</Label>
								<Input
									value={formData.invoiceRef}
									onChange={(e) =>
										setFormData({ ...formData, invoiceRef: e.target.value })
									}
									placeholder={t("finance.expenses.invoiceRefPlaceholder")}
									className="rounded-xl h-10"
									dir="ltr"
								/>
							</div>
						</div>

						{/* Project Link */}
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
								<FolderOpen className="h-3 w-3 inline me-1" />
								{t("finance.expenses.projectLink")}
							</Label>
							<Select
								value={formData.projectId || "none"}
								onValueChange={(value) =>
									setFormData({ ...formData, projectId: value === "none" ? "" : value })
								}
							>
								<SelectTrigger className="rounded-xl h-10">
									<SelectValue placeholder={t("finance.expenses.selectProjectPlaceholder")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="none">{t("finance.expenses.noProject")}</SelectItem>
									{projects.map((project) => (
										<SelectItem key={project.id} value={project.id}>
											{project.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Notes + Invoice Attachment */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.expenses.additionalNotes")}
								</Label>
								<Textarea
									value={formData.notes}
									onChange={(e) =>
										setFormData({ ...formData, notes: e.target.value })
									}
									placeholder={t("finance.expenses.notesPlaceholder")}
									className="rounded-xl min-h-[88px] resize-none"
									rows={3}
								/>
							</div>

							{/* Invoice Attachment Zone */}
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.expenses.attachInvoice")}
								</Label>
								<input
									ref={fileInputRef}
									type="file"
									accept={ACCEPTED_FILE_TYPES}
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) handleFileSelect(file);
									}}
									className="hidden"
								/>

								{attachedFile ? (
									<div className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-2.5 min-h-[88px] flex items-center gap-3">
										{filePreview ? (
											<img
												src={filePreview}
												alt={attachedFile.name}
												className="h-16 w-16 rounded-lg object-cover shrink-0"
											/>
										) : (
											<div className="h-16 w-16 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
												<FileText className="h-7 w-7 text-red-500" />
											</div>
										)}
										<div className="min-w-0 flex-1">
											<p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
												{attachedFile.name}
											</p>
											<p className="text-xs text-slate-400 mt-0.5">
												{formatFileSize(attachedFile.size)}
											</p>
										</div>
										<button
											type="button"
											onClick={removeFile}
											className="absolute top-1.5 end-1.5 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
										>
											<X className="h-3.5 w-3.5 text-slate-500" />
										</button>
									</div>
								) : (
									<div
										onClick={() => fileInputRef.current?.click()}
										onDrop={handleDrop}
										onDragOver={handleDragOver}
										onDragLeave={handleDragLeave}
										className={`rounded-xl border-2 border-dashed min-h-[88px] flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
											isDragging
												? "border-primary bg-primary/5"
												: "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/30"
										}`}
									>
										<div className="flex items-center gap-1.5 text-slate-400">
											<Upload className="h-4 w-4" />
											<ImageIcon className="h-4 w-4" />
											<FileText className="h-4 w-4" />
										</div>
										<p className="text-xs text-slate-500 dark:text-slate-400">
											اسحب الملف أو اضغط للاختيار
										</p>
										<p className="text-[10px] text-slate-400">
											PDF, JPG, PNG (حد أقصى 10 MB)
										</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Footer Actions */}
					<div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex gap-3 shrink-0">
						<Button
							type="button"
							variant="outline"
							className="flex-1 rounded-xl h-10"
							onClick={() => onOpenChange(false)}
							disabled={createMutation.isPending}
						>
							{t("common.cancel")}
						</Button>
						<Button
							type="submit"
							className="flex-1 rounded-xl h-10"
							disabled={createMutation.isPending}
						>
							{createMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 me-2 animate-spin" />
									{t("common.saving")}
								</>
							) : (
								<>
									<Save className="h-4 w-4 me-2" />
									{t("finance.expenses.create")}
								</>
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
