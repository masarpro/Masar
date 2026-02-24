"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
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
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Switch } from "@ui/components/switch";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { toast } from "sonner";
import { format, differenceInDays, isPast } from "date-fns";
import { ar } from "date-fns/locale";
import {
	AlertTriangle,
	ArrowRight,
	ArrowUpDown,
	Banknote,
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	Edit,
	FileText,
	Hammer,
	Loader2,
	Mail,
	Phone,
	Plus,
	Save,
	Search,
	Trash2,
	X,
} from "lucide-react";
import Link from "next/link";

interface SubcontractDetailViewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	subcontractId: string;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
	DRAFT: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
	ACTIVE: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300" },
	SUSPENDED: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300" },
	COMPLETED: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300" },
	TERMINATED: { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300" },
};

const CO_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
	DRAFT: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
	SUBMITTED: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300" },
	APPROVED: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300" },
	REJECTED: { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300" },
};

const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"] as const;

export function SubcontractDetailView({
	organizationId,
	organizationSlug,
	projectId,
	subcontractId,
}: SubcontractDetailViewProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showCODialog, setShowCODialog] = useState(false);
	const [editCO, setEditCO] = useState<string | null>(null);
	const [showPaymentForm, setShowPaymentForm] = useState(false);

	// Payment search & sort
	const [paymentSearch, setPaymentSearch] = useState("");
	const [paymentSortBy, setPaymentSortBy] = useState<"date" | "amount" | "term">("date");
	const [paymentSortOrder, setPaymentSortOrder] = useState<"asc" | "desc">("desc");

	// Change order form
	const [coDescription, setCODescription] = useState("");
	const [coAmount, setCOAmount] = useState("");
	const [coStatus, setCOStatus] = useState("DRAFT");

	// Inline payment form
	const [payAmount, setPayAmount] = useState("");
	const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
	const [paySourceAccountId, setPaySourceAccountId] = useState("");
	const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
	const [payReferenceNo, setPayReferenceNo] = useState("");
	const [payDescription, setPayDescription] = useState("");
	const [payTermId, setPayTermId] = useState("");

	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance/subcontracts`;

	const { data: contract, isLoading } = useQuery(
		orpc.subcontracts.get.queryOptions({
			input: { organizationId, projectId, contractId: subcontractId },
		}),
	);

	const { data: termsProgress } = useQuery({
		...orpc.subcontracts.getPaymentTermsProgress.queryOptions({
			input: { organizationId, projectId, contractId: subcontractId },
		}),
		enabled: !!contract,
	});

	const { data: bankAccounts } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId },
		}),
	);

	// Edit form state
	const [editName, setEditName] = useState("");
	const [editStatus, setEditStatus] = useState("");
	const [editValue, setEditValue] = useState("");
	const [editContractorType, setEditContractorType] = useState("");
	const [editCompanyName, setEditCompanyName] = useState("");
	const [editPhone, setEditPhone] = useState("");
	const [editEmail, setEditEmail] = useState("");
	const [editTaxNumber, setEditTaxNumber] = useState("");
	const [editCrNumber, setEditCrNumber] = useState("");
	const [editStartDate, setEditStartDate] = useState("");
	const [editEndDate, setEditEndDate] = useState("");
	const [editIncludesVat, setEditIncludesVat] = useState(false);
	const [editVatPercent, setEditVatPercent] = useState("");
	const [editRetentionPercent, setEditRetentionPercent] = useState("");
	const [editScopeOfWork, setEditScopeOfWork] = useState("");
	const [editNotes, setEditNotes] = useState("");

	function startEditing() {
		if (!contract) return;
		setEditName(contract.name);
		setEditStatus(contract.status);
		setEditValue(String(contract.value));
		setEditContractorType(contract.contractorType);
		setEditCompanyName(contract.companyName ?? "");
		setEditPhone(contract.phone ?? "");
		setEditEmail(contract.email ?? "");
		setEditTaxNumber(contract.taxNumber ?? "");
		setEditCrNumber(contract.crNumber ?? "");
		setEditStartDate(contract.startDate ? format(new Date(contract.startDate), "yyyy-MM-dd") : "");
		setEditEndDate(contract.endDate ? format(new Date(contract.endDate), "yyyy-MM-dd") : "");
		setEditIncludesVat(contract.includesVat);
		setEditVatPercent(contract.vatPercent != null ? String(contract.vatPercent) : "15");
		setEditRetentionPercent(contract.retentionPercent != null ? String(contract.retentionPercent) : "");
		setEditScopeOfWork(contract.scopeOfWork ?? "");
		setEditNotes(contract.notes ?? "");
		setShowEditDialog(true);
	}

	const updateMutation = useMutation({
		...orpc.subcontracts.update.mutationOptions(),
		onSuccess: () => {
			toast.success(t("subcontracts.notifications.updated"));
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			setShowEditDialog(false);
		},
		onError: (error) => {
			toast.error(error.message || t("subcontracts.notifications.updateError"));
		},
	});

	const deleteMutation = useMutation({
		...orpc.subcontracts.delete.mutationOptions(),
		onSuccess: () => {
			toast.success(t("subcontracts.notifications.deleted"));
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			router.push(basePath);
		},
		onError: () => {
			toast.error(t("subcontracts.notifications.deleteError"));
		},
	});

	const createCOMutation = useMutation({
		...orpc.subcontracts.createChangeOrder.mutationOptions(),
		onSuccess: () => {
			toast.success(t("subcontracts.notifications.coCreated"));
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			setShowCODialog(false);
			resetCOForm();
		},
		onError: (error) => {
			toast.error(error.message || t("subcontracts.notifications.coCreateError"));
		},
	});

	const updateCOMutation = useMutation({
		...orpc.subcontracts.updateChangeOrder.mutationOptions(),
		onSuccess: () => {
			toast.success(t("subcontracts.notifications.coUpdated"));
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			setEditCO(null);
			setShowCODialog(false);
			resetCOForm();
		},
	});

	const deleteCOMutation = useMutation({
		...orpc.subcontracts.deleteChangeOrder.mutationOptions(),
		onSuccess: () => {
			toast.success(t("subcontracts.notifications.coDeleted"));
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
		},
	});

	const createPaymentMutation = useMutation({
		...orpc.subcontracts.createPayment.mutationOptions(),
		onSuccess: () => {
			toast.success(t("subcontracts.notifications.paymentCreated"));
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			queryClient.invalidateQueries({ queryKey: ["finance"] });
			queryClient.invalidateQueries({ queryKey: ["projectFinance"] });
			resetPaymentForm();
			setShowPaymentForm(false);
		},
		onError: (error) => {
			toast.error(error.message || t("subcontracts.notifications.paymentCreateError"));
		},
	});

	function resetCOForm() {
		setCODescription("");
		setCOAmount("");
		setCOStatus("DRAFT");
	}

	function resetPaymentForm() {
		setPayAmount("");
		setPayDate(new Date().toISOString().split("T")[0]);
		setPaySourceAccountId("");
		setPayMethod("BANK_TRANSFER");
		setPayReferenceNo("");
		setPayDescription("");
		setPayTermId("");
	}

	function handleSave() {
		updateMutation.mutate({
			organizationId,
			projectId,
			contractId: subcontractId,
			name: editName,
			status: editStatus as "DRAFT" | "ACTIVE" | "SUSPENDED" | "COMPLETED" | "TERMINATED",
			value: Number.parseFloat(editValue),
			contractorType: editContractorType as "COMPANY" | "INDIVIDUAL",
			companyName: editCompanyName || null,
			phone: editPhone || null,
			email: editEmail || null,
			taxNumber: editTaxNumber || null,
			crNumber: editCrNumber || null,
			startDate: editStartDate ? new Date(editStartDate) : null,
			endDate: editEndDate ? new Date(editEndDate) : null,
			includesVat: editIncludesVat,
			vatPercent: editIncludesVat ? Number.parseFloat(editVatPercent) : null,
			retentionPercent: editRetentionPercent ? Number.parseFloat(editRetentionPercent) : null,
			scopeOfWork: editScopeOfWork || null,
			notes: editNotes || null,
		});
	}

	function handleCOSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (editCO) {
			updateCOMutation.mutate({
				organizationId, projectId, contractId: subcontractId,
				changeOrderId: editCO,
				description: coDescription,
				amount: Number.parseFloat(coAmount),
				status: coStatus as "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED",
			});
		} else {
			createCOMutation.mutate({
				organizationId, projectId, contractId: subcontractId,
				description: coDescription,
				amount: Number.parseFloat(coAmount),
				status: coStatus as "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED",
			});
		}
	}

	function handlePaymentSubmit(e: React.FormEvent) {
		e.preventDefault();
		const numericAmount = Number.parseFloat(payAmount) || 0;
		if (numericAmount <= 0) {
			toast.error(t("subcontracts.validation.amountRequired"));
			return;
		}
		createPaymentMutation.mutate({
			organizationId,
			projectId,
			contractId: subcontractId,
			termId: payTermId || null,
			amount: numericAmount,
			date: new Date(payDate),
			sourceAccountId: paySourceAccountId || null,
			paymentMethod: (payMethod as (typeof PAYMENT_METHODS)[number]) || null,
			referenceNo: payReferenceNo || null,
			description: payDescription || null,
		});
	}

	function openEditCO(co: { id: string; description: string; amount: number; status: string }) {
		setEditCO(co.id);
		setCODescription(co.description);
		setCOAmount(String(co.amount));
		setCOStatus(co.status);
		setShowCODialog(true);
	}

	const accounts = bankAccounts?.accounts ?? [];

	// Hooks must be before any early return
	const selectedPayTerm = useMemo(() => {
		if (!payTermId || !termsProgress) return null;
		return termsProgress.terms.find((t) => t.id === payTermId);
	}, [payTermId, termsProgress]);

	const selectedPayAccount = useMemo(
		() => accounts.find((a) => a.id === paySourceAccountId),
		[accounts, paySourceAccountId],
	);

	// Filter & sort payments
	const filteredPayments = useMemo(() => {
		const payments = contract?.payments ?? [];
		let result = payments;

		// Search
		if (paymentSearch.trim()) {
			const q = paymentSearch.trim().toLowerCase();
			result = result.filter(
				(p) =>
					p.paymentNo?.toLowerCase().includes(q) ||
					p.referenceNo?.toLowerCase().includes(q) ||
					p.description?.toLowerCase().includes(q) ||
					p.term?.label?.toLowerCase().includes(q) ||
					p.sourceAccount?.name?.toLowerCase().includes(q) ||
					String(p.amount).includes(q),
			);
		}

		// Sort
		result = [...result].sort((a, b) => {
			if (paymentSortBy === "amount") {
				return paymentSortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount;
			}
			if (paymentSortBy === "term") {
				const aLabel = a.term?.label ?? "";
				const bLabel = b.term?.label ?? "";
				return paymentSortOrder === "desc"
					? bLabel.localeCompare(aLabel, "ar")
					: aLabel.localeCompare(bLabel, "ar");
			}
			// Default: date
			const aDate = new Date(a.date).getTime();
			const bDate = new Date(b.date).getTime();
			return paymentSortOrder === "desc" ? bDate - aDate : aDate - bDate;
		});

		return result;
	}, [contract?.payments, paymentSearch, paymentSortBy, paymentSortOrder]);

	if (isLoading || !contract) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin text-slate-400" />
			</div>
		);
	}

	const statusStyle = STATUS_STYLES[contract.status] ?? STATUS_STYLES.DRAFT;
	const coImpact = contract.changeOrders
		?.filter((co) => co.status === "APPROVED")
		.reduce((sum, co) => sum + co.amount, 0) ?? 0;
	const adjustedValue = contract.value + coImpact;
	const totalPaid = contract.payments
		?.filter((p) => p.status === "COMPLETED")
		.reduce((sum, p) => sum + p.amount, 0) ?? 0;
	const remaining = adjustedValue - totalPaid;
	const progress = adjustedValue > 0 ? Math.min((totalPaid / adjustedValue) * 100, 100) : 0;

	// Alerts
	const isOverBudget = totalPaid > adjustedValue;
	const isEndDatePast = contract.endDate && isPast(new Date(contract.endDate)) && contract.status === "ACTIVE";
	const daysUntilEnd = contract.endDate ? differenceInDays(new Date(contract.endDate), new Date()) : null;
	const isNearingDeadline = daysUntilEnd !== null && daysUntilEnd > 0 && daysUntilEnd <= 14 && contract.status === "ACTIVE";

	return (
		<div className="w-full max-w-full space-y-6 pb-8">
			{/* Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<Link href={basePath}>
						<Button variant="ghost" size="sm" className="rounded-xl">
							<ArrowRight className="h-4 w-4" />
						</Button>
					</Link>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
								{contract.name}
							</h1>
							<Badge className={`border-0 text-xs ${statusStyle.bg} ${statusStyle.text}`}>
								{t(`subcontracts.status.${contract.status}`)}
							</Badge>
						</div>
						{contract.contractNo && (
							<p className="text-sm text-slate-500">{contract.contractNo}</p>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						className="rounded-xl"
						onClick={startEditing}
					>
						<Edit className="me-1.5 h-4 w-4" />
						{t("subcontracts.detail.editContract")}
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400"
						onClick={() => setShowDeleteDialog(true)}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Alerts */}
			{isOverBudget && (
				<div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-950/20">
					<AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
					<div>
						<p className="text-sm font-semibold text-red-700 dark:text-red-300">
							{t("subcontracts.detail.alerts.overBudget")}
						</p>
						<p className="text-xs text-red-600 dark:text-red-400">
							{t("subcontracts.detail.alerts.overBudgetDesc", { amount: formatCurrency(totalPaid - adjustedValue) })}
						</p>
					</div>
				</div>
			)}
			{isEndDatePast && (
				<div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
					<Clock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
					<div>
						<p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
							{t("subcontracts.detail.alerts.overdue")}
						</p>
						<p className="text-xs text-amber-600 dark:text-amber-400">
							{t("subcontracts.detail.alerts.overdueDesc", { date: format(new Date(contract.endDate!), "dd/MM/yyyy", { locale: ar }) })}
						</p>
					</div>
				</div>
			)}
			{isNearingDeadline && !isEndDatePast && (
				<div className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800/50 dark:bg-yellow-950/20">
					<Clock className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
					<div>
						<p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
							{t("subcontracts.detail.alerts.nearingDeadline")}
						</p>
						<p className="text-xs text-yellow-600 dark:text-yellow-400">
							{t("subcontracts.detail.alerts.nearingDeadlineDesc", { days: daysUntilEnd! })}
						</p>
					</div>
				</div>
			)}

			{/* Contract Summary: Info + Value + Progress */}
			<div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-700/30 dark:bg-slate-900/50">
				{/* Contractor Info - Compact */}
				<div className="border-b border-slate-100 p-5 dark:border-slate-800">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="flex items-start gap-3">
							<div className="shrink-0 rounded-xl bg-orange-100 p-2.5 dark:bg-orange-900/30">
								<Hammer className="h-5 w-5 text-orange-600 dark:text-orange-400" />
							</div>
							<div>
								<h3 className="font-semibold text-slate-800 dark:text-slate-200">
									{contract.companyName || contract.name}
								</h3>
								<p className="text-xs text-slate-500">
									{contract.contractorType === "COMPANY" ? t("subcontracts.form.company") : t("subcontracts.form.individual")}
									{contract.crNumber && ` • ${t("subcontracts.form.crNumber")}: ${contract.crNumber}`}
									{contract.taxNumber && ` • ${t("subcontracts.form.taxNumber")}: ${contract.taxNumber}`}
								</p>
								<div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
									{contract.phone && (
										<span className="flex items-center gap-1" dir="ltr">
											<Phone className="h-3 w-3" /> {contract.phone}
										</span>
									)}
									{contract.email && (
										<span className="flex items-center gap-1" dir="ltr">
											<Mail className="h-3 w-3" /> {contract.email}
										</span>
									)}
								</div>
							</div>
						</div>

						{/* Dates */}
						<div className="flex items-center gap-4 text-xs">
							{contract.startDate && (
								<div className="flex items-center gap-1.5 text-slate-500">
									<Calendar className="h-3.5 w-3.5" />
									<span>{format(new Date(contract.startDate), "dd/MM/yyyy", { locale: ar })}</span>
								</div>
							)}
							{contract.startDate && contract.endDate && (
								<span className="text-slate-300 dark:text-slate-600">←</span>
							)}
							{contract.endDate && (
								<div className={`flex items-center gap-1.5 ${isEndDatePast ? "font-semibold text-red-500" : "text-slate-500"}`}>
									<Calendar className="h-3.5 w-3.5" />
									<span>{format(new Date(contract.endDate), "dd/MM/yyyy", { locale: ar })}</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Financial Summary */}
				<div className="p-5">
					{/* Value Cards */}
					<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
						<div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
							<p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
								{t("subcontracts.detail.originalValue")}
							</p>
							<p className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-200">
								{formatCurrency(contract.value)}
							</p>
						</div>
						<div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/20">
							<p className="text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
								{t("subcontracts.detail.changeOrders")}
							</p>
							<p className={`mt-1 text-lg font-bold ${coImpact >= 0 ? "text-amber-700 dark:text-amber-300" : "text-red-600"}`}>
								{coImpact >= 0 ? "+" : ""}{formatCurrency(coImpact)}
							</p>
						</div>
						<div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/20">
							<p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
								{t("subcontracts.detail.totalPaid")}
							</p>
							<p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-300">
								{formatCurrency(totalPaid)}
							</p>
						</div>
						<div className={`rounded-xl p-3 ${isOverBudget ? "bg-red-50 dark:bg-red-950/20" : "rounded-xl bg-blue-50 dark:bg-blue-950/20"}`}>
							<p className={`text-[10px] font-medium uppercase tracking-wide ${isOverBudget ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
								{t("subcontracts.detail.remaining")}
							</p>
							<p className={`mt-1 text-lg font-bold ${isOverBudget ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"}`}>
								{formatCurrency(remaining)}
							</p>
						</div>
					</div>

					{/* Progress Bar */}
					<div className="space-y-2">
						<div className="flex items-center justify-between text-xs">
							<span className="text-slate-500">
								{t("subcontracts.detail.adjustedValue")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(adjustedValue)}</span>
							</span>
							<span className={`font-bold ${isOverBudget ? "text-red-600" : "text-emerald-600"}`}>
								{progress.toFixed(1)}%
							</span>
						</div>
						<div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
							<div
								className={`h-full rounded-full transition-all ${isOverBudget ? "bg-red-500" : progress >= 100 ? "bg-emerald-500" : "bg-orange-500"}`}
								style={{ width: `${Math.min(progress, 100)}%` }}
							/>
						</div>
					</div>

					{/* Scope */}
					{contract.scopeOfWork && (
						<div className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/30">
							<p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">{t("subcontracts.form.scopeOfWork")}</p>
							<p className="text-sm text-slate-700 dark:text-slate-300">{contract.scopeOfWork}</p>
						</div>
					)}
				</div>
			</div>

			{/* Payments Table */}
			<div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-700/30 dark:bg-slate-900/50">
				<div className="flex flex-col gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
								<Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
							</div>
							<div>
								<h2 className="font-semibold text-slate-800 dark:text-slate-200">
									{t("subcontracts.detail.paymentsHistory")}
								</h2>
								<p className="text-xs text-slate-500">
									{contract.payments?.length ?? 0} {t("subcontracts.detail.paymentsCount")}
								</p>
							</div>
						</div>
						<Button
							size="sm"
							className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
							onClick={() => setShowPaymentForm(!showPaymentForm)}
						>
							<Plus className="ml-1.5 h-4 w-4" />
							{t("subcontracts.detail.addPayment")}
						</Button>
					</div>

					{/* Search + Sort bar */}
					{(contract.payments?.length ?? 0) > 0 && (
						<div className="flex items-center gap-2">
							<div className="relative flex-1 max-w-xs">
								<Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
								<Input
									placeholder={t("subcontracts.detail.searchPayments")}
									value={paymentSearch}
									onChange={(e) => setPaymentSearch(e.target.value)}
									className="h-8 rounded-lg ps-9 text-xs"
								/>
							</div>
							<div className="flex items-center gap-1">
								{(["date", "amount", "term"] as const).map((field) => (
									<Button
										key={field}
										variant={paymentSortBy === field ? "default" : "outline"}
										size="sm"
										className={`h-8 rounded-lg px-2.5 text-[11px] ${
											paymentSortBy === field
												? "bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300"
												: ""
										}`}
										onClick={() => {
											if (paymentSortBy === field) {
												setPaymentSortOrder((o) => (o === "desc" ? "asc" : "desc"));
											} else {
												setPaymentSortBy(field);
												setPaymentSortOrder("desc");
											}
										}}
									>
										<ArrowUpDown className="me-1 h-3 w-3" />
										{t(`subcontracts.detail.sortBy${field.charAt(0).toUpperCase() + field.slice(1)}`)}
									</Button>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Payments table */}
				{filteredPayments.length > 0 ? (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="text-start">#</TableHead>
									<TableHead className="text-start">{t("subcontracts.payment.date")}</TableHead>
									<TableHead className="text-start">{t("subcontracts.payment.amount")}</TableHead>
									<TableHead className="text-start">{t("subcontracts.payment.paymentMethod")}</TableHead>
									<TableHead className="text-start">{t("subcontracts.payment.selectTerm")}</TableHead>
									<TableHead className="text-start">{t("subcontracts.payment.sourceAccount")}</TableHead>
									<TableHead className="text-start">{t("subcontracts.payment.referenceNo")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredPayments.map((payment, idx) => (
									<TableRow key={payment.id}>
										<TableCell className="font-mono text-xs text-slate-500">
											{payment.paymentNo}
										</TableCell>
										<TableCell className="text-sm">
											{format(new Date(payment.date), "dd/MM/yyyy", { locale: ar })}
										</TableCell>
										<TableCell className="font-semibold text-red-600 dark:text-red-400">
											{formatCurrency(payment.amount)}
										</TableCell>
										<TableCell className="text-xs">
											{payment.paymentMethod
												? t(`subcontracts.paymentMethods.${payment.paymentMethod}`)
												: "-"}
										</TableCell>
										<TableCell>
											{payment.term ? (
												<Badge variant="outline" className="rounded-lg text-[10px]">
													{payment.term.label || t(`subcontracts.termTypes.${payment.term.type}`)}
												</Badge>
											) : (
												<span className="text-xs text-slate-400">-</span>
											)}
										</TableCell>
										<TableCell className="text-xs text-slate-500">
											{payment.sourceAccount?.name ?? "-"}
										</TableCell>
										<TableCell className="font-mono text-xs text-slate-500" dir="ltr">
											{payment.referenceNo ?? "-"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>

						{/* Totals row */}
						<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
							<span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
								{t("subcontracts.detail.paymentsTotalLabel")}
							</span>
							<div className="flex items-center gap-6 text-sm">
								<span>
									<span className="text-slate-500">{t("subcontracts.detail.totalPaid")}: </span>
									<span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(totalPaid)}</span>
								</span>
								<span>
									<span className="text-slate-500">{t("subcontracts.detail.remaining")}: </span>
									<span className={`font-bold ${isOverBudget ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(remaining)}</span>
								</span>
							</div>
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-10 text-center">
						<div className="mb-3 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
							{paymentSearch ? (
								<Search className="h-8 w-8 text-slate-400" />
							) : (
								<Banknote className="h-8 w-8 text-slate-400" />
							)}
						</div>
						<p className="text-sm text-slate-500">
							{paymentSearch
								? t("subcontracts.detail.noSearchResults")
								: t("subcontracts.detail.noPayments")}
						</p>
					</div>
				)}

				{/* Inline Payment Form */}
				{showPaymentForm && (
					<div className="border-t border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-800/30 dark:bg-emerald-950/10">
						<form onSubmit={handlePaymentSubmit} className="space-y-4">
							<h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
								{t("subcontracts.detail.newPaymentForm")}
							</h3>

							{/* Over budget warning in form */}
							{payAmount && (Number.parseFloat(payAmount) || 0) > remaining && remaining > 0 && (
								<div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800/50 dark:bg-red-950/20 dark:text-red-400">
									<AlertTriangle className="h-3.5 w-3.5 shrink-0" />
									{t("subcontracts.detail.alerts.paymentExceedsRemaining")}
								</div>
							)}

							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
								{/* Amount */}
								<div className="space-y-1.5">
									<Label className="text-xs">{t("subcontracts.payment.amount")} *</Label>
									<div className="relative">
										<Input
											type="number"
											step="0.01"
											min="0"
											value={payAmount}
											onChange={(e) => setPayAmount(e.target.value)}
											placeholder="0.00"
											className="rounded-lg pl-12"
											dir="ltr"
											required
										/>
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
											ر.س
										</span>
									</div>
								</div>

								{/* Date */}
								<div className="space-y-1.5">
									<Label className="text-xs">{t("subcontracts.payment.date")} *</Label>
									<Input
										type="date"
										value={payDate}
										onChange={(e) => setPayDate(e.target.value)}
										className="rounded-lg"
										required
									/>
								</div>

								{/* Payment Method */}
								<div className="space-y-1.5">
									<Label className="text-xs">{t("subcontracts.payment.paymentMethod")}</Label>
									<Select value={payMethod} onValueChange={setPayMethod}>
										<SelectTrigger className="rounded-lg text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{PAYMENT_METHODS.map((method) => (
												<SelectItem key={method} value={method}>
													{t(`subcontracts.paymentMethods.${method}`)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Source Account */}
								<div className="space-y-1.5">
									<Label className="text-xs">{t("subcontracts.payment.sourceAccount")}</Label>
									<Select value={paySourceAccountId} onValueChange={setPaySourceAccountId}>
										<SelectTrigger className="rounded-lg text-xs">
											<SelectValue placeholder={t("subcontracts.payment.selectAccount")} />
										</SelectTrigger>
										<SelectContent>
											{accounts
												.filter((a) => a.isActive)
												.map((account) => (
													<SelectItem key={account.id} value={account.id}>
														{account.name}
														{account.bankName && ` - ${account.bankName}`}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
								{/* Payment Term */}
								{termsProgress && termsProgress.terms.length > 0 && (
									<div className="space-y-1.5">
										<Label className="text-xs">{t("subcontracts.payment.selectTerm")}</Label>
										<Select
											value={payTermId || "_none"}
											onValueChange={(v) => {
												const actualValue = v === "_none" ? "" : v;
												setPayTermId(actualValue);
												if (actualValue) {
													const term = termsProgress.terms.find((tt) => tt.id === actualValue);
													if (term && !payAmount) {
														setPayAmount(String(Math.max(0, term.remainingAmount)));
													}
												}
											}}
										>
											<SelectTrigger className="rounded-lg text-xs">
												<SelectValue placeholder={t("subcontracts.payment.selectTermPlaceholder")} />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="_none">{t("subcontracts.payment.noTerm")}</SelectItem>
												{termsProgress.terms
													.filter((tt) => !tt.isComplete)
													.map((tt) => (
														<SelectItem key={tt.id} value={tt.id}>
															{tt.label || tt.type} - {t("subcontracts.payment.remaining")}: {formatCurrency(tt.remainingAmount)}
														</SelectItem>
													))}
											</SelectContent>
										</Select>
									</div>
								)}

								{/* Reference */}
								<div className="space-y-1.5">
									<Label className="text-xs">{t("subcontracts.payment.referenceNo")}</Label>
									<Input
										value={payReferenceNo}
										onChange={(e) => setPayReferenceNo(e.target.value)}
										className="rounded-lg"
										dir="ltr"
									/>
								</div>

								{/* Description */}
								<div className="space-y-1.5">
									<Label className="text-xs">{t("subcontracts.payment.description")}</Label>
									<Input
										value={payDescription}
										onChange={(e) => setPayDescription(e.target.value)}
										className="rounded-lg"
									/>
								</div>
							</div>

							{/* Selected account balance info */}
							{selectedPayAccount && (
								<div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs dark:border-slate-700 dark:bg-slate-800">
									<span className="text-slate-500">
										{selectedPayAccount.name}: {formatCurrency(Number(selectedPayAccount.balance))}
									</span>
									{payAmount && (
										<span className="text-slate-500">
											← {formatCurrency(Number(selectedPayAccount.balance) - (Number.parseFloat(payAmount) || 0))}
										</span>
									)}
								</div>
							)}

							{/* Actions */}
							<div className="flex items-center justify-end gap-2">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="rounded-lg"
									onClick={() => {
										resetPaymentForm();
										setShowPaymentForm(false);
									}}
								>
									{t("common.cancel")}
								</Button>
								<Button
									type="submit"
									size="sm"
									className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
									disabled={createPaymentMutation.isPending}
								>
									{createPaymentMutation.isPending ? (
										<Loader2 className="me-1.5 h-4 w-4 animate-spin" />
									) : (
										<Save className="me-1.5 h-4 w-4" />
									)}
									{t("subcontracts.payment.submit")}
								</Button>
							</div>
						</form>
					</div>
				)}
			</div>

			{/* Payment Terms Progress */}
			{termsProgress && termsProgress.terms.length > 0 && (
				<div className="overflow-hidden rounded-2xl border border-violet-200/50 bg-white dark:border-violet-800/30 dark:bg-slate-900/50">
					<div className="flex items-center justify-between border-b border-violet-100 p-5 dark:border-violet-800/30">
						<div className="flex items-center gap-3">
							<div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/30">
								<FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
							</div>
							<h2 className="font-semibold text-violet-700 dark:text-violet-300">
								{t("subcontracts.detail.paymentTerms")}
							</h2>
						</div>
						<span className="text-sm font-medium text-violet-600 dark:text-violet-400">
							{progress.toFixed(0)}% {t("subcontracts.detail.complete")}
						</span>
					</div>
					<div className="divide-y divide-slate-100 dark:divide-slate-800">
						{termsProgress.terms.map((term) => {
							const isNext = term.id === termsProgress.nextIncompleteTermId;
							return (
								<div key={term.id} className="flex items-center gap-4 px-5 py-3">
									{/* Status icon */}
									{term.isComplete ? (
										<CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
									) : isNext ? (
										<Clock className="h-5 w-5 shrink-0 text-blue-500" />
									) : (
										<div className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600" />
									)}

									{/* Info */}
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium text-slate-800 dark:text-slate-200">
												{term.label || t(`subcontracts.termTypes.${term.type}`)}
											</span>
											{isNext && (
												<Badge className="border-0 bg-blue-100 text-[10px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
													{t("subcontracts.detail.currentTerm")}
												</Badge>
											)}
										</div>
										{/* Progress bar */}
										<div className="mt-1 flex items-center gap-2">
											<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
												<div
													className={`h-full rounded-full transition-all ${term.isComplete ? "bg-emerald-500" : isNext ? "bg-blue-500" : "bg-slate-400"}`}
													style={{ width: `${term.progressPercent}%` }}
												/>
											</div>
											<span className="w-10 text-end text-[10px] text-slate-500">
												{term.progressPercent.toFixed(0)}%
											</span>
										</div>
									</div>

									{/* Amounts */}
									<div className="text-end text-xs">
										<p className="font-semibold text-slate-700 dark:text-slate-300">
											{formatCurrency(term.amount)}
										</p>
										<p className="text-slate-500">
											{t("subcontracts.detail.paid")}: {formatCurrency(term.paidAmount)}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Change Orders */}
			<div className="overflow-hidden rounded-2xl border border-amber-200/50 bg-white dark:border-amber-800/30 dark:bg-slate-900/50">
				<div className="flex items-center justify-between border-b border-amber-100 p-5 dark:border-amber-800/30">
					<div className="flex items-center gap-3">
						<div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
							<FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
						</div>
						<h2 className="font-semibold text-amber-700 dark:text-amber-300">
							{t("subcontracts.detail.changeOrdersSection")}
						</h2>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400"
						onClick={() => {
							resetCOForm();
							setEditCO(null);
							setShowCODialog(true);
						}}
					>
						<Plus className="me-1 h-4 w-4" />
						{t("subcontracts.detail.addChangeOrder")}
					</Button>
				</div>
				<div className="p-4">
					{!contract.changeOrders || contract.changeOrders.length === 0 ? (
						<p className="py-6 text-center text-sm text-slate-500">
							{t("subcontracts.detail.noChangeOrders")}
						</p>
					) : (
						<div className="space-y-2">
							{contract.changeOrders.map((co) => {
								const coStyle = CO_STATUS_STYLES[co.status] ?? CO_STATUS_STYLES.DRAFT;
								return (
									<div
										key={co.id}
										className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"
									>
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<span className="text-xs font-medium text-slate-500">#{co.orderNo}</span>
												<Badge className={`border-0 text-[10px] ${coStyle.bg} ${coStyle.text}`}>
													{t(`subcontracts.detail.coStatus.${co.status}`)}
												</Badge>
											</div>
											<p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
												{co.description}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<span className={`font-semibold ${co.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
												{co.amount >= 0 ? "+" : ""}
												{formatCurrency(co.amount)}
											</span>
											<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCO(co)}>
												<Edit className="h-3 w-3" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 text-red-500 hover:text-red-600"
												onClick={() => deleteCOMutation.mutate({ organizationId, projectId, contractId: subcontractId, changeOrderId: co.id })}
											>
												<Trash2 className="h-3 w-3" />
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{/* Notes */}
			{contract.notes && (
				<div className="rounded-2xl border border-slate-200/50 bg-white p-5 dark:border-slate-700/30 dark:bg-slate-900/50">
					<p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{t("subcontracts.form.notes")}</p>
					<p className="text-sm text-slate-700 dark:text-slate-300">{contract.notes}</p>
				</div>
			)}

			{/* ═══ Dialogs ═══ */}

			{/* Edit Contract Dialog */}
			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>{t("subcontracts.detail.editContract")}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>{t("subcontracts.form.name")}</Label>
								<Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl" />
							</div>
							<div className="space-y-2">
								<Label>{t("subcontracts.form.status")}</Label>
								<Select value={editStatus} onValueChange={setEditStatus}>
									<SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
									<SelectContent>
										{(["DRAFT", "ACTIVE", "SUSPENDED", "COMPLETED", "TERMINATED"] as const).map((key) => (
											<SelectItem key={key} value={key}>{t(`subcontracts.status.${key}`)}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div className="space-y-2">
								<Label>{t("subcontracts.form.value")}</Label>
								<Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="rounded-xl" dir="ltr" />
							</div>
							<div className="space-y-2">
								<Label>{t("subcontracts.form.contractorType")}</Label>
								<Select value={editContractorType} onValueChange={setEditContractorType}>
									<SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="COMPANY">{t("subcontracts.form.company")}</SelectItem>
										<SelectItem value="INDIVIDUAL">{t("subcontracts.form.individual")}</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>{t("subcontracts.form.companyName")}</Label>
								<Input value={editCompanyName} onChange={(e) => setEditCompanyName(e.target.value)} className="rounded-xl" />
							</div>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>{t("subcontracts.form.phone")}</Label>
								<Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="rounded-xl" dir="ltr" />
							</div>
							<div className="space-y-2">
								<Label>{t("subcontracts.form.email")}</Label>
								<Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="rounded-xl" dir="ltr" />
							</div>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>{t("subcontracts.form.taxNumber")}</Label>
								<Input value={editTaxNumber} onChange={(e) => setEditTaxNumber(e.target.value)} className="rounded-xl" dir="ltr" />
							</div>
							<div className="space-y-2">
								<Label>{t("subcontracts.form.crNumber")}</Label>
								<Input value={editCrNumber} onChange={(e) => setEditCrNumber(e.target.value)} className="rounded-xl" dir="ltr" />
							</div>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>{t("subcontracts.form.startDate")}</Label>
								<Input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="rounded-xl" />
							</div>
							<div className="space-y-2">
								<Label>{t("subcontracts.form.endDate")}</Label>
								<Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="rounded-xl" />
							</div>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
								<Switch checked={editIncludesVat} onCheckedChange={setEditIncludesVat} />
								<Label>{t("subcontracts.form.includesVat")}</Label>
							</div>
							{editIncludesVat && (
								<div className="space-y-2">
									<Label>{t("subcontracts.form.vatPercent")}</Label>
									<Input type="number" value={editVatPercent} onChange={(e) => setEditVatPercent(e.target.value)} className="rounded-xl" dir="ltr" />
								</div>
							)}
							<div className="space-y-2">
								<Label>{t("subcontracts.form.retentionPercent")}</Label>
								<Input type="number" value={editRetentionPercent} onChange={(e) => setEditRetentionPercent(e.target.value)} className="rounded-xl" dir="ltr" />
							</div>
						</div>
						<div className="space-y-2">
							<Label>{t("subcontracts.form.scopeOfWork")}</Label>
							<Textarea value={editScopeOfWork} onChange={(e) => setEditScopeOfWork(e.target.value)} className="min-h-20 rounded-xl" />
						</div>
						<div className="space-y-2">
							<Label>{t("subcontracts.form.notes")}</Label>
							<Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="min-h-16 rounded-xl" />
						</div>
						<div className="flex gap-3 pt-2">
							<Button
								type="button"
								variant="outline"
								className="flex-1 rounded-xl"
								onClick={() => setShowEditDialog(false)}
							>
								{t("common.cancel")}
							</Button>
							<Button
								className="flex-1 rounded-xl"
								onClick={handleSave}
								disabled={updateMutation.isPending}
							>
								{updateMutation.isPending ? (
									<Loader2 className="me-1.5 h-4 w-4 animate-spin" />
								) : (
									<Save className="me-1.5 h-4 w-4" />
								)}
								{t("common.save")}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("subcontracts.detail.deleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("subcontracts.detail.deleteConfirm")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							className="bg-red-600 hover:bg-red-700"
							onClick={() => deleteMutation.mutate({ organizationId, projectId, contractId: subcontractId })}
						>
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Change Order Dialog */}
			<Dialog open={showCODialog} onOpenChange={setShowCODialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editCO ? t("subcontracts.detail.editChangeOrder") : t("subcontracts.detail.addChangeOrder")}
						</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleCOSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label>{t("subcontracts.co.description")}</Label>
							<Textarea
								value={coDescription}
								onChange={(e) => setCODescription(e.target.value)}
								placeholder={t("subcontracts.co.descriptionPlaceholder")}
								className="min-h-20 rounded-xl"
								required
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label>{t("subcontracts.co.amount")}</Label>
								<Input
									type="number"
									step="0.01"
									value={coAmount}
									onChange={(e) => setCOAmount(e.target.value)}
									placeholder="0.00"
									className="rounded-xl"
									dir="ltr"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label>{t("subcontracts.co.status")}</Label>
								<Select value={coStatus} onValueChange={setCOStatus}>
									<SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
									<SelectContent>
										{(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] as const).map((key) => (
											<SelectItem key={key} value={key}>{t(`subcontracts.detail.coStatus.${key}`)}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="flex gap-3">
							<Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setShowCODialog(false)}>
								{t("common.cancel")}
							</Button>
							<Button type="submit" className="flex-1 rounded-xl" disabled={createCOMutation.isPending || updateCOMutation.isPending}>
								{(createCOMutation.isPending || updateCOMutation.isPending) ? t("common.saving") : t("common.save")}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
