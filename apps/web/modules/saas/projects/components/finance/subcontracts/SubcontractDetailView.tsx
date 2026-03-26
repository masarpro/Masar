"use client";

import { useState, useCallback } from "react";
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
import { toast } from "sonner";
import { format, differenceInDays, isPast } from "date-fns";
import { Loader2, Save } from "lucide-react";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";
import { formatCurrency, PAYMENT_METHODS } from "./subcontract-shared";
import { SubcontractHeader } from "./SubcontractHeader";
import { SubcontractFinanceSummary } from "./SubcontractFinanceSummary";
import { SubcontractClaimsSection } from "./SubcontractClaimsSection";
import { SubcontractPaymentSection } from "./SubcontractPaymentSection";

interface SubcontractDetailViewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	subcontractId: string;
}

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

	// Change order form
	const [coDescription, setCODescription] = useState("");
	const [coAmount, setCOAmount] = useState("");
	const [coStatus, setCOStatus] = useState("DRAFT");

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

	const handleSubmitPayment = useCallback((data: {
		amount: number;
		date: string;
		sourceAccountId: string;
		paymentMethod: string;
		referenceNo: string;
		description: string;
		termId: string;
	}) => {
		if (data.amount <= 0) {
			toast.error(t("subcontracts.validation.amountRequired"));
			return;
		}
		createPaymentMutation.mutate({
			organizationId,
			projectId,
			contractId: subcontractId,
			termId: data.termId || null,
			amount: data.amount,
			date: new Date(data.date),
			sourceAccountId: data.sourceAccountId || "",
			paymentMethod: (data.paymentMethod as (typeof PAYMENT_METHODS)[number]) || null,
			referenceNo: data.referenceNo || null,
			description: data.description || null,
		});
	}, [organizationId, projectId, subcontractId, createPaymentMutation, t]);

	const handleOpenEditCO = useCallback((co: { id: string; description: string; amount: number; status: string }) => {
		setEditCO(co.id);
		setCODescription(co.description);
		setCOAmount(String(co.amount));
		setCOStatus(co.status);
		setShowCODialog(true);
	}, []);

	const handleDeleteCO = useCallback((changeOrderId: string) => {
		deleteCOMutation.mutate({ organizationId, projectId, contractId: subcontractId, changeOrderId });
	}, [organizationId, projectId, subcontractId, deleteCOMutation]);

	const handleAddCO = useCallback(() => {
		resetCOForm();
		setEditCO(null);
		setShowCODialog(true);
	}, []);

	const accounts = bankAccounts?.accounts ?? [];

	if (isLoading) {
		return <DetailPageSkeleton />;
	}

	if (!contract) {
		return null;
	}

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
			<SubcontractHeader
				contract={contract}
				basePath={basePath}
				isOverBudget={isOverBudget}
				isEndDatePast={isEndDatePast}
				isNearingDeadline={isNearingDeadline}
				daysUntilEnd={daysUntilEnd}
				totalPaid={totalPaid}
				adjustedValue={adjustedValue}
				onEdit={startEditing}
				onDelete={() => setShowDeleteDialog(true)}
			>
				<SubcontractFinanceSummary
					contractValue={contract.value}
					coImpact={coImpact}
					totalPaid={totalPaid}
					remaining={remaining}
					adjustedValue={adjustedValue}
					progress={progress}
					isOverBudget={isOverBudget}
					scopeOfWork={contract.scopeOfWork}
				/>
			</SubcontractHeader>

			{/* Payments + Payment Terms */}
			<SubcontractPaymentSection
				payments={contract.payments}
				termsProgress={termsProgress}
				accounts={accounts}
				totalPaid={totalPaid}
				remaining={remaining}
				adjustedValue={adjustedValue}
				progress={progress}
				isOverBudget={isOverBudget}
				onSubmitPayment={handleSubmitPayment}
				isSubmittingPayment={createPaymentMutation.isPending}
			/>

			{/* Change Orders */}
			<SubcontractClaimsSection
				changeOrders={contract.changeOrders}
				onAdd={handleAddCO}
				onEdit={handleOpenEditCO}
				onDelete={handleDeleteCO}
			/>

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
